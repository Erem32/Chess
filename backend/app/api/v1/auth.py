from fastapi import APIRouter, status

from app.schemas.auth import LoginRequest, RegisterRequest

router = APIRouter()


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest) -> dict[str, str]:
    return {"message": "Registration endpoint scaffolded", "username": payload.username}


@router.post("/login")
def login(payload: LoginRequest) -> dict[str, str]:
    return {"message": "Login endpoint scaffolded", "username_or_email": payload.username_or_email}
