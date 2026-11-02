from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user
from app.models import User
from app.schemas.practice import PracticeAttemptRequest, PracticeAttemptResponse, PracticeExerciseRead, PuzzleSolutionResponse
from app.services import practice_service

router = APIRouter()


@router.get("/exercises", response_model=list[PracticeExerciseRead])
def list_exercises(
    _user: Annotated[User, Depends(get_current_user)],
    kind: Literal["lesson", "puzzle"] | None = None,
) -> list[PracticeExerciseRead]:
    return practice_service.list_exercises(kind)


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


@router.get("/exercises/{exercise_id}/solution", response_model=PuzzleSolutionResponse)
def reveal_puzzle_solution(
    exercise_id: str,
    _user: Annotated[User, Depends(get_current_user)],
) -> PuzzleSolutionResponse:
    exercise = practice_service.find_exercise(exercise_id)
    if exercise is None or exercise.kind != "puzzle":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Puzzle not found")
    return practice_service.puzzle_solution(exercise)
