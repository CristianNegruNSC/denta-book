from pydantic import BaseModel

# doar numele serviciului unic (ex: Consultatie, Igienizari etc.)
class ServiceBase(BaseModel):
    name: str


class ServiceCreate(ServiceBase):
    pass


class ServiceOut(ServiceBase):
    id: int

    class Config:
        orm_mode = True


# schema pentru pivotul provider_services
class ProviderServiceBase(BaseModel):
    price: float = 0
    duration_minutes: int = 30


class ProviderServiceCreate(ProviderServiceBase):
    service_id: int


class ProviderServiceOut(ProviderServiceBase):
    id: int
    provider_id: int
    service_id: int
    service: ServiceOut   # include și numele serviciului

    class Config:
        orm_mode = True
