from sqlalchemy import Column, Integer, String, DateTime, func
from sqlalchemy.orm import relationship
from app.core.db import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="client")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # relații
    provider_services = relationship(
        "ProviderService", back_populates="provider", cascade="all, delete-orphan"
    )
    working_hours = relationship(
        "WorkingHour", back_populates="provider", cascade="all, delete-orphan"
    )

    appointments_as_provider = relationship(
        "Appointment",
        back_populates="provider",
        cascade="all, delete-orphan",
        foreign_keys="Appointment.provider_id",
    )
    appointments_as_client = relationship(
        "Appointment",
        back_populates="client",
        cascade="all, delete-orphan",
        foreign_keys="Appointment.client_id",
    )
