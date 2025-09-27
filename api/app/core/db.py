from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.settings import settings

# Conexiune DB
engine = create_engine(settings.DATABASE_URL, future=True, echo=True)

# Session local pentru queries
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Baza pentru modelele ORM
Base = declarative_base()