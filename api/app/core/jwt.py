from datetime import datetime, timedelta
from jose import JWTError, jwt
from app.core.settings import settings

ALGORITHM = "HS256"

def create_access_token(data: dict, expires_minutes: int = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(
        minutes=expires_minutes or settings.JWT_EXPIRES_MIN
    )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
