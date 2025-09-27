from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.settings import settings
from app.routers import auth, users, availability, appointments, admin, service

app = FastAPI(title="DentaBook API")

@app.get("/")
def root():
    return {"message": "Hello from DentaBook API!"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(availability.router, prefix="/availability", tags=["availability"])
app.include_router(appointments.router, prefix="/appointments", tags=["appointments"])
app.include_router(admin.router, prefix="/admin", tags=["admin"])
app.include_router(service.router, prefix="/services", tags=["services"])
