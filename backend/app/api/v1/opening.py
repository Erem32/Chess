from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.models import User
from app.services.opening_service import load_opening_catalog, load_opening_guide

router = APIRouter()


@router.get("")
def get_opening_guide(_user: Annotated[User, Depends(get_current_user)]) -> dict | None:
    return load_opening_guide()


@router.get("/catalog")
def get_opening_catalog(_user: Annotated[User, Depends(get_current_user)]) -> list[dict]:
    return load_opening_catalog()
