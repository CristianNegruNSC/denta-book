from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta, timezone

from app.core.deps import get_db, get_current_user
from app.models.appointment import Appointment
from app.models.user import User
from app.models.service import Service
from app.models.working_hours import WorkingHour
from app.schemas.appointment import AppointmentCreate, AppointmentOut

router = APIRouter()


# 🟢 Client: creează o programare
@router.post("/", response_model=AppointmentOut)
def create_appointment(
    data: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "client":
        raise HTTPException(status_code=403, detail="Only clients can book appointments")

    service = db.query(Service).filter(Service.id == data.service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    end_at = data.start_at + timedelta(minutes=service.duration_minutes)

    if data.start_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Cannot book in the past")

    # verificăm overlap
    overlap = (
        db.query(Appointment)
        .filter(
            Appointment.provider_id == data.provider_id,
            Appointment.status != "canceled",
            Appointment.start_at < end_at,
            Appointment.end_at > data.start_at,
        )
        .first()
    )
    if overlap:
        raise HTTPException(status_code=400, detail="Time slot already booked")

    # verificăm dacă e în working_hours
    day_of_week = data.start_at.weekday() + 1 if data.start_at.weekday() < 6 else 0
    wh = (
        db.query(WorkingHour)
        .filter(
            WorkingHour.provider_id == data.provider_id,
            WorkingHour.day_of_week == day_of_week,
            WorkingHour.start_time <= data.start_at.time(),
            WorkingHour.end_time >= end_at.time(),
        )
        .first()
    )
    if not wh:
        raise HTTPException(status_code=400, detail="Outside provider working hours")

    new_app = Appointment(
        provider_id=data.provider_id,
        client_id=current_user.id,
        service_id=data.service_id,
        start_at=data.start_at,
        end_at=end_at,
        status="pending",
        created_by="client",
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)
    return new_app


# 🟢 Client: listează programările sale
@router.get("/me", response_model=List[AppointmentOut])
def list_my_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "client":
        raise HTTPException(status_code=403, detail="Only clients can view their appointments")

    return db.query(Appointment).filter(Appointment.client_id == current_user.id).all()


# 🟢 Provider: listează programările sale
@router.get("/provider/me", response_model=List[AppointmentOut])
def list_provider_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "provider":
        raise HTTPException(status_code=403, detail="Only providers can view their appointments")

    return db.query(Appointment).filter(Appointment.provider_id == current_user.id).all()


# 🟢 Provider: blochează timp
@router.post("/block", response_model=AppointmentOut)
def block_time(
    data: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "provider":
        raise HTTPException(status_code=403, detail="Only providers can block time")

    new_block = Appointment(
        provider_id=current_user.id,
        client_id=None,
        service_id=None,
        start_at=data.start_at,
        end_at=data.end_at,
        status="confirmed",
        created_by="provider",
    )
    db.add(new_block)
    db.commit()
    db.refresh(new_block)
    return new_block


# 🟢 Update status
@router.patch("/{appointment_id}", response_model=AppointmentOut)
def update_status(
    appointment_id: int,
    status: str = Query(..., regex="^(pending|confirmed|canceled)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    appt = db.get(Appointment, appointment_id)
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    if current_user.role == "client":
        if appt.client_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not your appointment")
        if status != "canceled":
            raise HTTPException(status_code=403, detail="Clients can only cancel")

    if current_user.role == "provider":
        if appt.provider_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not your appointment")

    appt.status = status
    db.commit()
    db.refresh(appt)
    return appt


# 🟢 Provider: șterge programări (inclusiv blocaje create de el)
@router.delete("/{appointment_id}")
def delete_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    appt = db.get(Appointment, appointment_id)
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    if current_user.role != "provider" or appt.provider_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")

    db.delete(appt)
    db.commit()
    return {"detail": "Appointment deleted"}
