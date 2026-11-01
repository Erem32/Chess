from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user
from app.models import User
from app.schemas.practice import PracticeAttemptRequest, PracticeAttemptResponse, PracticeExerciseRead
from app.services import practice_service

router = APIRouter()


@router.get("/exercises", response_model=list[PracticeExerciseRead])
def list_exercises(_user: Annotated[User, Depends(get_current_user)]) -> list[PracticeExerciseRead]:
    return practice_service.list_exercises()


@router.post("/exercises/{exercise_id}/attempt", response_model=PracticeAttemptResponse)
def attempt_exercise(
    exercise_id: str,
    payload: PracticeAttemptRequest,
    _user: Annotated[User, Depends(get_current_user)],
) -> PracticeAttemptResponse:
    exercise = practice_service.find_exercise(exercise_id)
    if exercise is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Practice exercise not found")
    return practice_service.check_attempt(exercise, payload.move_uci)
