from fastapi import APIRouter

router = APIRouter()


@router.post("/join")
def join_matchmaking() -> dict[str, str]:
    return {"message": "Join matchmaking endpoint scaffolded"}


@router.post("/leave")
def leave_matchmaking() -> dict[str, str]:
    return {"message": "Leave matchmaking endpoint scaffolded"}
