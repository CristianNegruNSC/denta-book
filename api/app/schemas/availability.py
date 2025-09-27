from pydantic import BaseModel
from datetime import date, time

class AvailabilityBase(BaseModel):
    date: date
    start_time: time
    end_time: time

class AvailabilityCreate(AvailabilityBase):
    pass

class AvailabilityOut(AvailabilityBase):
    id: int
    provider_id: int

    class Config:
        from_attributes = True
