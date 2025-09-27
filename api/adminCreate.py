from app.core.db import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User

db = SessionLocal()

admin = User(
    email="admin@test.com",
    password_hash=get_password_hash("admin123"),
    role="admin"
)

db.add(admin)
db.commit()
db.close()