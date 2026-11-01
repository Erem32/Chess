from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import Game, GamePlayer, User


def get_user(db: Session, user_id: int) -> User | None:
    return db.get(User, user_id)


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def get_user_by_username(db: Session, username: str) -> User | None:
    return db.query(User).filter(User.username == username).first()


def get_user_by_username_or_email(db: Session, username_or_email: str) -> User | None:
    return (
        db.query(User)
        .filter((User.username == username_or_email) | (User.email == username_or_email))
        .first()
    )


def create_user(db: Session, *, username: str, email: str, hashed_password: str) -> User:
    user = User(username=username, email=email, hashed_password=hashed_password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def count_user_game_results(db: Session, user_id: int) -> list[tuple[str, int]]:
    return (
        db.query(GamePlayer.result, func.count(GamePlayer.id))
        .join(Game, Game.id == GamePlayer.game_id)
        .filter(GamePlayer.user_id == user_id, GamePlayer.result.is_not(None), Game.status != "aborted")
        .group_by(GamePlayer.result)
        .all()
    )
