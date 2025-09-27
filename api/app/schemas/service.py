from pydantic import BaseModel

class ServiceBase(BaseModel):
    name: str
    price: float
    duration_minutes: int

class ServiceCreate(ServiceBase):
    is_default: bool = False  # implicit False, dar poate fi True pentru cele din lista standard

class ServiceOut(ServiceBase):
    id: int
    provider_id: int
    is_default: bool

    class Config:
        from_attributes = True