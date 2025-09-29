from sqlalchemy import Column, Integer, ForeignKey, DateTime, String
from sqlalchemy.orm import relationship
from app.core.db import Base

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    client_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    start_at = Column(DateTime, nullable=False)
    end_at = Column(DateTime, nullable=False)
    status = Column(String, default="pending")
    created_by = Column(String, default="client")
    service_id = Column(Integer, ForeignKey("services.id", ondelete="SET NULL"), nullable=True)

    provider = relationship("User", back_populates="appointments_as_provider", foreign_keys=[provider_id])
    client = relationship("User", back_populates="appointments_as_client", foreign_keys=[client_id])
