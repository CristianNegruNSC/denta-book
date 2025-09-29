from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.models.service import Service
from app.models.provider_service import ProviderService
from app.schemas.user import UserOut, UserCreate
from app.core.security import get_password_hash
from app.models.working_hours import WorkingHour
from datetime import time

router = APIRouter()

# ✅ doar adminul poate accesa aceste rute
def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return current_user


@router.post("/providers", response_model=UserOut)
def create_provider(user: UserCreate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    provider = User(
        email=user.email,
        password_hash=get_password_hash(user.password),
        role="provider"
    )
    db.add(provider)
    db.commit()
    db.refresh(provider)

    # ✅ adaugă automat programul default (luni-vineri 9–18)
    default_hours = []
    for day in range(1, 6):  # 1=luni, ..., 5=vineri
        wh = WorkingHour(
            provider_id=provider.id,
            day_of_week=day,
            start_time=time(9, 0),
            end_time=time(18, 0),
        )
        default_hours.append(wh)

    db.add_all(default_hours)
    db.commit()

    return provider


@router.get("/providers", response_model=List[UserOut])
def list_providers(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return db.query(User).filter(User.role == "provider").all()


@router.get("/clients", response_model=List[UserOut])
def list_clients(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return db.query(User).filter(User.role == "client").all()


@router.delete("/user/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()
    return {"detail": f"User {user.email} deleted"}
