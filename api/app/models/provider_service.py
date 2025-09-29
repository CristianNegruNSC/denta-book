from sqlalchemy import Column, Integer, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.core.db import Base

class ProviderService(Base):
    __tablename__ = "provider_services"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    service_id = Column(Integer, ForeignKey("services.id", ondelete="CASCADE"))
    price = Column(Float, default=0)
    duration_minutes = Column(Integer, default=30)

    provider = relationship("User", back_populates="provider_services")   # ✅ corect
    service = relationship("Service", back_populates="providers")
