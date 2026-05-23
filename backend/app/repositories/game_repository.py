from sqlalchemy.orm import Session

from app.models.game import Game


def get_game(db: Session, game_id: int) -> Game | None:
    return db.get(Game, game_id)
