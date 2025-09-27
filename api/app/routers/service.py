from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.deps import get_db, get_current_user
from app.models.service import Service
from app.models.user import User
from app.schemas.user import UserOut
from app.schemas.service import ServiceCreate, ServiceOut

router = APIRouter()

# ✅ lista de servicii default
DEFAULT_SERVICES = [
    "Consultatie",
    "Igienizari",
    "Tratament de canal",
    "Obturatii",
    "Proteze fixe",
    "Proteze mobilizabile",
    "Proteze mobile",
    "Implanturi",
    "Radiografii",
    "CBCT",
    "Aparte ortodontice",
]


# ✅ returnează lista default
@router.get("/defaults", response_model=List[str])
def get_default_services():
    return DEFAULT_SERVICES


# ✅ provider adaugă un serviciu
@router.post("/", response_model=ServiceOut)
def create_service(
    service: ServiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "provider":
        raise HTTPException(status_code=403, detail="Only providers can add services")

    new_service = Service(
        provider_id=current_user.id,
        name=service.name,
        price=service.price,
        duration_minutes=service.duration_minutes,
        is_default=service.is_default,
    )
    db.add(new_service)
    db.commit()
    db.refresh(new_service)
    return new_service


# ✅ provider vede propriile servicii
@router.get("/provider/me", response_model=List[ServiceOut])
def list_my_services(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "provider":
        raise HTTPException(status_code=403, detail="Only providers can view their services")

    return db.query(Service).filter(Service.provider_id == current_user.id).all()


# ✅ lista serviciilor unui provider după ID (pentru client)
@router.get("/provider/{provider_id}", response_model=List[ServiceOut])
def list_services(provider_id: int, db: Session = Depends(get_db)):
    return db.query(Service).filter(Service.provider_id == provider_id).all()


# ✅ update serviciu
@router.put("/{service_id}", response_model=ServiceOut)
def update_service(
    service_id: int,
    service: ServiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_service = db.query(Service).filter(Service.id == service_id).first()
    if not db_service:
        raise HTTPException(status_code=404, detail="Service not found")

    if db_service.provider_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your service")

    db_service.name = service.name
    db_service.price = service.price
    db_service.duration_minutes = service.duration_minutes
    db_service.is_default = service.is_default
    db.commit()
    db.refresh(db_service)
    return db_service


# ✅ ștergere serviciu
@router.delete("/{service_id}")
def delete_service(
    service_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_service = db.query(Service).filter(Service.id == service_id).first()
    if not db_service:
        raise HTTPException(status_code=404, detail="Service not found")

    if db_service.provider_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your service")

    db.delete(db_service)
    db.commit()
    return {"detail": "Service deleted"}

# toate serviciile din platformă (pentru clienți)
@router.get("/all", response_model=List[ServiceOut])
def get_all_services(db: Session = Depends(get_db)):
    return db.query(Service).all()

# providerii care oferă un anumit serviciu
@router.get("/{service_id}/providers", response_model=List[UserOut])
def get_providers_for_service(service_id: int, db: Session = Depends(get_db)):
    services = db.query(Service).filter(Service.id == service_id).all()
    if not services:
        raise HTTPException(status_code=404, detail="Service not found")

    provider_ids = [s.provider_id for s in services]
    return db.query(User).filter(User.id.in_(provider_ids)).all()
