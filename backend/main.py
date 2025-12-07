from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List
import jwt
import os
from dotenv import load_dotenv

from database import Base, engine, SessionLocal
from models import User, Message
from schemas import MessageCreate, MessageOut

# Charger le .env
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"

if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY manquant dans le fichier .env")

app = FastAPI()

# CORS (pour autoriser ton front en dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # en prod : mettre l’URL exacte du front
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Init DB
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Gestion des connexions WebSocket
active_connections: List[WebSocket] = []


async def broadcast(message: dict):
    """Envoie un message JSON à tous les clients connectés."""
    disconnected = []
    for conn in active_connections:
        try:
            await conn.send_json(message)
        except WebSocketDisconnect:
            disconnected.append(conn)
    for conn in disconnected:
        if conn in active_connections:
            active_connections.remove(conn)


def create_access_token(username: str) -> str:
    """Crée un JWT simple avec le username et une expiration."""
    payload = {
        "username": username,
        "exp": datetime.utcnow() + timedelta(hours=12)
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return token


def decode_token(token: str) -> str:
    """Retourne le username à partir d’un token, ou lève une exception."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload["username"]
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expiré")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalide")


# ---------- AUTH ----------

@app.post("/register")
def register(data: dict, db: Session = Depends(get_db)):
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        raise HTTPException(status_code=400, detail="Champs requis")

    # Vérifier doublon
    existing = db.query(User).filter(User.username == username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Utilisateur déjà existant")

    user = User(username=username, password=password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"message": "Compte créé"}



@app.post("/login")
def login(data: dict, db: Session = Depends(get_db)):
    username = data.get("username")
    password = data.get("password")

    user = db.query(User).filter(User.username == username).first()

    if not user or user.password != password:
        raise HTTPException(status_code=401, detail="Identifiants invalides")

    token = create_access_token(username)

    return {"access_token": token, "username": username}



# ---------- API REST MESSAGES ----------

@app.get("/messages", response_model=List[MessageOut])
def get_messages(db: Session = Depends(get_db)):
    """Retourne l’historique des messages."""
    return db.query(Message).order_by(Message.timestamp.asc()).all()


@app.post("/messages", response_model=MessageOut)
def post_message(message: MessageCreate, db: Session = Depends(get_db)):
    """
    Endpoint REST pour créer un message.
    """
    msg = Message(username=message.username, content=message.content)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


# ---------- WEBSOCKET ----------

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, db: Session = Depends(get_db)):
    """
    WebSocket améliorée :
    - gère deux types d'événements : "message" et "typing"
    - decode le token JWT
    - enregistre les messages dans SQLite
    - broadcast messages + typing aux autres
    """

    await websocket.accept()
    active_connections.append(websocket)

    try:
        while True:
            data = await websocket.receive_json()

            event = data.get("event")         # "message" ou "typing"
            token = data.get("token")         # JWT envoyé par le front

            if not token:
                await websocket.send_json({"error": "Token requis"})
                continue

            try:
                username = decode_token(token)
            except HTTPException as e:
                await websocket.send_json({"error": e.detail})
                await websocket.close()
                if websocket in active_connections:
                    active_connections.remove(websocket)
                break

            # 🔵 EVENT : typing
            if event == "typing":
                await broadcast({
                    "event": "typing",
                    "username": username
                })
                continue

            # 🔵 EVENT : message envoyé
            if event == "message":
                content = data.get("content")

                if not content:
                    await websocket.send_json({"error": "Message vide"})
                    continue

                # Enregistrement DB
                msg = Message(username=username, content=content)
                db.add(msg)
                db.commit()
                db.refresh(msg)

                # Broadcast du message à tous
                await broadcast({
                    "event": "message",
                    "id": msg.id,
                    "username": msg.username,
                    "content": msg.content,
                    "timestamp": msg.timestamp.isoformat(timespec="seconds") + "Z"
                })

    except WebSocketDisconnect:
        if websocket in active_connections:
            active_connections.remove(websocket)
