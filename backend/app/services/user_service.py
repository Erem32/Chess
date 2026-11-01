from sqlalchemy.orm import Session

from app.models import User
from app.repositories import user_repository
from app.schemas.user import UserStats


WIN_RESULTS = {"win", "won", "winner"}
LOSS_RESULTS = {"loss", "lost", "lose"}
DRAW_RESULTS = {"draw", "drawn", "stalemate"}


def get_current_user_profile(user: User) -> User:
    return user


def get_user_stats(db: Session, user: User) -> UserStats:
    wins = 0
    losses = 0
    draws = 0

    for result, count in user_repository.count_user_game_results(db, user.id):
        normalized = result.strip().lower()
        if normalized in WIN_RESULTS:
            wins += count
        elif normalized in LOSS_RESULTS:
            losses += count
        elif normalized in DRAW_RESULTS:
            draws += count

    return UserStats(
        wins=wins,
        losses=losses,
        draws=draws,
        games_played=wins + losses + draws,
    )
