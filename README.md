# Realtime Chat App — FastAPI & React

Une application de chat en temps réel construite avec FastAPI, WebSockets, React et SQLite.

## Fonctionnalités
- Authentification (Register + Login)
- JWT sécurisé
- Chat en temps réel via WebSocket
- Horodatage fuseau horaire Israël
- UI moderne et responsive
- Historique des messages stockés en base

## Architecture
```
/
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── requirements.txt
│   └── .env
└── frontend/
    ├── src/
    │   ├── App.js
    │   ├── Login.jsx
    │   ├── Register.jsx
    │   ├── components/
    │   │   └── Chat.jsx
    │   └── App.css
    ├── package.json
```

## Installation Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Créer un fichier `.env` :
```
SECRET_KEY=changer_cette_cle
```

## Installation Frontend
```bash
cd frontend
npm install
npm start
```

## Endpoints API
- POST /register
- POST /login
- GET /messages
- POST /messages
- WebSocket : /ws

## Sécurité
- JWT signé
- Expiration 12h
- Password hashé
- Aucun stockage côté serveur des sessions

