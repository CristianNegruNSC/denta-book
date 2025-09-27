from pydantic import BaseModel
from datetime import datetime

class AppointmentBase(BaseModel):
    provider_id: int
    service_id: int
    start_at: datetime

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentOut(BaseModel):
    id: int
    provider_id: int
    client_id: int
    service_id: int
    start_at: datetime
    end_at: datetime
    status: str

    class Config:
        from_attributes = True
