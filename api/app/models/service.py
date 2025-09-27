from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean
from app.core.db import Base

class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    name = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    is_default = Column(Boolean, default=False)  # marchează serviciile predefinite
