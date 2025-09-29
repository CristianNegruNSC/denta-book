from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.core.deps import get_db, get_current_user
from app.models.service import Service
from app.models.user import User
from app.models.provider_service import ProviderService
from app.schemas.user import UserOut
from app.schemas.service import (
    ServiceOut,
    ServiceCreate,
    ProviderServiceOut,
    ProviderServiceCreate,
)

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


# ✅ returnează lista default (hardcoded)
@router.get("/defaults", response_model=List[str])
def get_default_services():
    return DEFAULT_SERVICES


# ✅ toate serviciile definite global (din tabela `services`)
@router.get("/all", response_model=List[ServiceOut])
def get_all_services(db: Session = Depends(get_db)):
    return db.query(Service).all()


# ✅ provider vede propriile servicii (din pivot)
@router.get("/provider/me", response_model=List[ProviderServiceOut])
def list_my_services(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "provider":
        raise HTTPException(status_code=403, detail="Only providers can view their services")

    return (
        db.query(ProviderService)
        .options(joinedload(ProviderService.service))
        .filter(ProviderService.provider_id == current_user.id)
        .all()
    )


# ✅ lista serviciilor unui provider după ID (pentru client)
@router.get("/provider/{provider_id}", response_model=List[ProviderServiceOut])
def list_services(provider_id: int, db: Session = Depends(get_db)):
    return (
        db.query(ProviderService)
        .options(joinedload(ProviderService.service))
        .filter(ProviderService.provider_id == provider_id)
        .all()
    )


# ✅ provider adaugă un serviciu EXISTENT (din services)
@router.post("/", response_model=ProviderServiceOut)
def create_service(
    service: ProviderServiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "provider":
        raise HTTPException(status_code=403, detail="Only providers can add services")

    db_service = db.query(Service).filter(Service.id == service.service_id).first()
    if not db_service:
        raise HTTPException(status_code=404, detail="Service type not found")

    exists = db.query(ProviderService).filter(
        ProviderService.provider_id == current_user.id,
        ProviderService.service_id == service.service_id
    ).first()
    if exists:
        raise HTTPException(status_code=400, detail="You already have this service")

    new_service = ProviderService(
        provider_id=current_user.id,
        service_id=service.service_id,
        price=service.price,
        duration_minutes=service.duration_minutes,
    )
    db.add(new_service)
    db.commit()
    db.refresh(new_service)
    return new_service


# ✅ provider adaugă un serviciu NOU (custom → devine global dacă nu există deja)
@router.post("/custom", response_model=ProviderServiceOut)
def create_custom_service(
    service: ServiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "provider":
        raise HTTPException(status_code=403, detail="Only providers can add services")

    # verificăm dacă există deja global (case-insensitive)
    db_service = db.query(Service).filter(Service.name.ilike(service.name)).first()
    if not db_service:
        db_service = Service(name=service.name)
        db.add(db_service)
        db.commit()
        db.refresh(db_service)

    # verificăm dacă providerul are deja serviciul
    exists = db.query(ProviderService).filter(
        ProviderService.provider_id == current_user.id,
        ProviderService.service_id == db_service.id
    ).first()
    if exists:
        raise HTTPException(status_code=400, detail="You already have this service")

    new_provider_service = ProviderService(
        provider_id=current_user.id,
        service_id=db_service.id,
        price=service.price,
        duration_minutes=service.duration_minutes,
    )
    db.add(new_provider_service)
    db.commit()
    db.refresh(new_provider_service)
    return new_provider_service


# ✅ update serviciu existent (pivot)
@router.put("/{provider_service_id}", response_model=ProviderServiceOut)
def update_service(
    provider_service_id: int,
    service_data: ProviderServiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "provider":
        raise HTTPException(status_code=403, detail="Only providers can update services")

    db_service = (
        db.query(ProviderService)
        .options(joinedload(ProviderService.service))
        .filter(
            ProviderService.id == provider_service_id,
            ProviderService.provider_id == current_user.id,
        )
        .first()
    )

    if not db_service:
        raise HTTPException(status_code=404, detail="Service not found")

    db_service.price = service_data.price
    db_service.duration_minutes = service_data.duration_minutes
    db.commit()
    db.refresh(db_service)
    return db_service


# ✅ ștergere serviciu (din pivot, nu din lista globală)
@router.delete("/{provider_service_id}")
def delete_service(
    provider_service_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_service = (
        db.query(ProviderService)
        .filter(
            ProviderService.id == provider_service_id,
            ProviderService.provider_id == current_user.id,
        )
        .first()
    )
    if not db_service:
        raise HTTPException(status_code=404, detail="Service not found")

    db.delete(db_service)
    db.commit()
    return {"detail": "Service deleted"}


# ✅ providerii care oferă un anumit serviciu global
@router.get("/{service_id}/providers", response_model=List[UserOut])
def get_providers_for_service(service_id: int, db: Session = Depends(get_db)):
    provider_services = (
        db.query(ProviderService)
        .filter(ProviderService.service_id == service_id)
        .all()
    )
    if not provider_services:
        raise HTTPException(status_code=404, detail="No providers found for this service")

    provider_ids = [ps.provider_id for ps in provider_services]
    return db.query(User).filter(User.id.in_(provider_ids)).all()
