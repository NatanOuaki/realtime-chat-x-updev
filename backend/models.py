from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from database import Base

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, default="User")
    content = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password = Column(String)  # hashé plus tard si tu veux