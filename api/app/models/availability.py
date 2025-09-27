from sqlalchemy import Column, Integer, ForeignKey, Date, Time
from app.core.db import Base

class Availability(Base):
    __tablename__ = "availability"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    date = Column(Date, nullable=False)              # data exactă (ex: 2025-09-25)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
