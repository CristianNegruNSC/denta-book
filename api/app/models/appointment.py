from sqlalchemy import Column, Integer, ForeignKey, DateTime, String
from app.core.db import Base

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    client_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    service_id = Column(Integer, ForeignKey("services.id", ondelete="CASCADE"))
    start_at = Column(DateTime, nullable=False)  # ora locală RO
    end_at = Column(DateTime, nullable=False)    # ora locală RO
    status = Column(String, default="pending")
