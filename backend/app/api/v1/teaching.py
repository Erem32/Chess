from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.models import User
from app.services.teaching_service import load_teaching_examples

router = APIRouter()


@router.get("")
def get_teaching_examples(_user: Annotated[User, Depends(get_current_user)]) -> list[dict]:
    return load_teaching_examples()
