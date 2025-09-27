from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List
from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo

from app.core.deps import get_db, get_current_user
from app.models.appointment import Appointment
from app.models.availability import Availability
from app.models.user import User
from app.models.service import Service
from app.schemas.appointment import AppointmentCreate, AppointmentOut

router = APIRouter()

BUCHAREST_TZ = ZoneInfo("Europe/Bucharest")


# 🟢 Client: creează o programare
@router.post("/", response_model=AppointmentOut)
def create_appointment(
    data: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "client":
        raise HTTPException(status_code=403, detail="Only clients can book appointments")

    # verificăm serviciul
    service = db.query(Service).filter(Service.id == data.service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    # calculăm end_at pe baza duratei serviciului
    end_at = data.start_at + timedelta(minutes=service.duration_minutes)

    # 1. verificăm trecut
    if data.start_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Cannot book in the past")

    # 2. verificăm overlap
    overlap = (
        db.query(Appointment)
        .filter(
            Appointment.provider_id == data.provider_id,
            Appointment.status != "canceled",
            and_(
                Appointment.start_at < end_at,
                Appointment.end_at > data.start_at,
            ),
        )
        .first()
    )
    if overlap:
        raise HTTPException(status_code=400, detail="Time slot already booked")

    # 3. verificăm availability (în ora României)
    start_local = data.start_at.astimezone(BUCHAREST_TZ)
    end_local = end_at.astimezone(BUCHAREST_TZ)

    avail = (
        db.query(Availability)
        .filter(
            Availability.provider_id == data.provider_id,
            Availability.date == start_local.date(),
            Availability.start_time <= start_local.time(),
            Availability.end_time >= end_local.time(),
        )
        .first()
    )
    if not avail:
        raise HTTPException(status_code=400, detail="Outside provider availability")

    # 4. creăm programarea
    new_app = Appointment(
        provider_id=data.provider_id,
        client_id=current_user.id,
        service_id=data.service_id,
        start_at=data.start_at,
        end_at=end_at,
        status="pending",
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
        raise HTTPException(status_code=403, detail="Only providers can see their appointments")

    return db.query(Appointment).filter(Appointment.provider_id == current_user.id).all()


# 🟢 Update status
@router.patch("/{appointment_id}", response_model=AppointmentOut)
def update_appointment_status(
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


# 🟢 Provider: șterge programări (doar dacă sunt canceled)
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

    if appt.status != "canceled":
        raise HTTPException(status_code=400, detail="Only canceled appointments can be deleted")

    db.delete(appt)
    db.commit()
    return {"detail": "Appointment deleted"}


# 🟢 Listare sloturi disponibile
@router.get("/slots")
def get_available_slots(
    provider_id: int,
    service_id: int,
    date: str,
    db: Session = Depends(get_db),
):
    # verificăm serviciul
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    try:
        target_date = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format (YYYY-MM-DD required)")

    availability = (
        db.query(Availability)
        .filter(
            Availability.provider_id == provider_id,
            Availability.date == target_date,
        )
        .first()
    )
    if not availability:
        return {"slots": []}

    slots = []
    start_dt = datetime.combine(target_date, availability.start_time, tzinfo=BUCHAREST_TZ)
    end_dt = datetime.combine(target_date, availability.end_time, tzinfo=BUCHAREST_TZ)
    slot_duration = timedelta(minutes=service.duration_minutes)

    current = start_dt
    while current + slot_duration <= end_dt:
        slots.append(current)
        current += slot_duration

    appointments = (
        db.query(Appointment)
        .filter(
            Appointment.provider_id == provider_id,
            Appointment.start_at >= start_dt,
            Appointment.end_at <= end_dt,
            Appointment.status != "canceled",
        )
        .all()
    )
    taken = [(a.start_at, a.end_at) for a in appointments]

    available_slots = []
    for slot in slots:
        slot_end = slot + slot_duration
        conflict = False
        for s, e in taken:
            if (slot < e) and (slot_end > s):
                conflict = True
                break
        if not conflict:
            available_slots.append(slot.isoformat())

    return {"slots": available_slots}
