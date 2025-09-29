from pydantic import BaseModel
from datetime import time

class WorkingHourBase(BaseModel):
    day_of_week: int
    start_time: time
    end_time: time

class WorkingHourCreate(WorkingHourBase):
    pass

class WorkingHourOut(WorkingHourBase):
    id: int
    provider_id: int

    class Config:
        orm_mode = True
