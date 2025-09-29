from sqlalchemy import Column, Integer, Time, ForeignKey
from sqlalchemy.orm import relationship
from app.core.db import Base

class WorkingHour(Base):
    __tablename__ = "working_hours"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    day_of_week = Column(Integer, nullable=False)  # 0=Sunday, 1=Monday...
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)

    provider = relationship("User", back_populates="working_hours")
