from pydantic import BaseModel
from datetime import datetime
from typing import Optional


# 🔹 Ce trimite clientul / providerul când creează o programare sau blocaj
class AppointmentCreate(BaseModel):
    provider_id: Optional[int] = None   # obligatoriu pentru client
    client_id: Optional[int] = None     # setat automat din token pentru client
    service_id: Optional[int] = None    # poate fi null pentru blocaje
    start_at: datetime
    end_at: datetime


# 🔹 Ce returnăm către frontend
class AppointmentOut(BaseModel):
    id: int
    provider_id: Optional[int]
    client_id: Optional[int]
    service_id: Optional[int]
    start_at: datetime
    end_at: datetime
    status: str
    created_by: str   # "client" sau "provider"

    class Config:
        orm_mode = True
