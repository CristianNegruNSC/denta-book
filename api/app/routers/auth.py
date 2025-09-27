from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta

from app.core.db import SessionLocal
from app.models.user import User
from app.schemas.user import UserCreate, UserOut, UserLogin
from app.core.security import get_password_hash, verify_password
from app.core.jwt import create_access_token

router = APIRouter()

# Dependency pentru a obține sesiunea DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/register", response_model=UserOut)
def register(user: UserCreate, db: Session = Depends(get_db)):
    # verifică dacă emailul există deja
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # creează user nou cu parolă hashuită, rol implicit = client
    new_user = User(
        email=user.email,
        password_hash=get_password_hash(user.password),
        role="client"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/login")
def login(data: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == data.email).first()
    if not db_user or not verify_password(data.password, db_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid credentials"
        )

    # generează JWT
    token = create_access_token(
        data={"sub": str(db_user.id)},
        expires_minutes=30
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": db_user.role,   # trimitem și rolul
        "email": db_user.email
    }
