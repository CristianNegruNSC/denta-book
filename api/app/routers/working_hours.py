from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.models.working_hours import WorkingHour
from app.schemas.working_hours import WorkingHourOut, WorkingHourCreate

router = APIRouter()

@router.get("/me", response_model=List[WorkingHourOut])
def get_my_working_hours(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "provider":
        raise HTTPException(status_code=403, detail="Only providers can view working hours")
    return db.query(WorkingHour).filter(WorkingHour.provider_id == current_user.id).all()


@router.post("/", response_model=WorkingHourOut)
def create_or_update_working_hour(
    wh: WorkingHourCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "provider":
        raise HTTPException(status_code=403, detail="Only providers can set working hours")

    # verificăm dacă există deja ceva pentru ziua respectivă
    existing = (
        db.query(WorkingHour)
        .filter(
            WorkingHour.provider_id == current_user.id,
            WorkingHour.day_of_week == wh.day_of_week,
        )
        .first()
    )

    if existing:
        existing.start_time = wh.start_time
        existing.end_time = wh.end_time
        db.commit()
        db.refresh(existing)
        return existing

    new_wh = WorkingHour(
        provider_id=current_user.id,
        day_of_week=wh.day_of_week,
        start_time=wh.start_time,
        end_time=wh.end_time,
    )
    db.add(new_wh)
    db.commit()
    db.refresh(new_wh)
    return new_wh


@router.delete("/{wh_id}")
def delete_working_hour(
    wh_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    wh = db.query(WorkingHour).filter(
        WorkingHour.id == wh_id,
        WorkingHour.provider_id == current_user.id
    ).first()

    if not wh:
        raise HTTPException(status_code=404, detail="Working hour not found")

    db.delete(wh)
    db.commit()
    return {"detail": "Working hour deleted"}

@router.post("/", response_model=WorkingHourOut)
def create_or_update_working_hour(
    wh: WorkingHourCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "provider":
        raise HTTPException(status_code=403, detail="Only providers can set working hours")

    existing = (
        db.query(WorkingHour)
        .filter(
            WorkingHour.provider_id == current_user.id,
            WorkingHour.day_of_week == wh.day_of_week,
        )
        .first()
    )

    if existing:
        existing.start_time = wh.start_time
        existing.end_time = wh.end_time
        db.commit()
        db.refresh(existing)
        return existing

    new_wh = WorkingHour(
        provider_id=current_user.id,
        day_of_week=wh.day_of_week,
        start_time=wh.start_time,
        end_time=wh.end_time,
    )
    db.add(new_wh)
    db.commit()
    db.refresh(new_wh)
    return new_wh

