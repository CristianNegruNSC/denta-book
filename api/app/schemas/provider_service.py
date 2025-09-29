from pydantic import BaseModel

class ProviderServiceBase(BaseModel):
    price: float = 0
    duration_minutes: int = 30


class ProviderServiceCreate(ProviderServiceBase):
    service_id: int


class ProviderServiceOut(ProviderServiceBase):
    id: int
    provider_id: int
    service_id: int

    class Config:
        orm_mode = True