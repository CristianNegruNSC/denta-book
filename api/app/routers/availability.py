from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from typing import List
from app.core.deps import get_db, get_current_user
from app.models.availability import Availability
from app.schemas.availability import AvailabilityCreate, AvailabilityOut

router = APIRouter()


# 🟢 Provider: creează interval de disponibilitate
@router.post("/", response_model=AvailabilityOut)
def create_availability(
    availability: AvailabilityCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user.role != "provider":
        raise HTTPException(status_code=403, detail="Only providers can set availability")

    new_avail = Availability(
        provider_id=current_user.id,
        date=availability.date,
        start_time=availability.start_time,
        end_time=availability.end_time,
    )
    db.add(new_avail)
    db.commit()
    db.refresh(new_avail)
    return new_avail


# 🟢 Provider: listează intervalele sale
@router.get("/", response_model=List[AvailabilityOut])
def list_availability(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user.role != "provider":
        raise HTTPException(status_code=403, detail="Only providers can see availability")

    return db.query(Availability).filter(Availability.provider_id == current_user.id).all()


# 🟢 Provider: șterge un interval
@router.delete("/{availability_id}", status_code=204)
def delete_availability(
    availability_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    avail = db.get(Availability, availability_id)
    if not avail:
        raise HTTPException(status_code=404, detail="Availability not found")

    if avail.provider_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your availability")

    db.delete(avail)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
