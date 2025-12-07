from pydantic import BaseModel
from datetime import datetime

class MessageCreate(BaseModel):
    username: str
    content: str

class MessageOut(BaseModel):
    id: int
    username: str
    content: str
    timestamp: datetime

    class Config:
        from_attributes = True 
