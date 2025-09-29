from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.deps import get_db
from app.models.provider_service import ProviderService
from app.schemas.provider_service import ProviderServiceOut

router = APIRouter()

@router.get("/providers/{provider_id}/services", response_model=List[ProviderServiceOut])
def get_provider_services(provider_id: int, db: Session = Depends(get_db)):
    services = db.query(ProviderService).filter(ProviderService.provider_id == provider_id).all()
    if not services:
        raise HTTPException(status_code=404, detail="Provider services not found")
    return services