from datetime import datetime

from sqlalchemy import text
from sqlalchemy.orm import Session, selectinload

from app.models import ChatMessage, Game, GamePlayer, MatchmakingQueue, Move


MATCHMAKING_ADVISORY_LOCK_ID = 842_001


def create_game_with_players(
    db: Session,
    white_user_id: int,
    black_user_id: int,
    starting_fen: str,
) -> Game:
    game = Game(status="active", current_fen=starting_fen, turn_color="white", started_at=datetime.utcnow())
    db.add(game)
    db.flush()
    db.add_all(
        [
            GamePlayer(game_id=game.id, user_id=white_user_id, color="white"),
            GamePlayer(game_id=game.id, user_id=black_user_id, color="black"),
        ]
    )
    db.flush()
    db.refresh(game)
    return game


def get_game(db: Session, game_id: int) -> Game | None:
    return db.get(Game, game_id)


def get_game_for_update(db: Session, game_id: int) -> Game | None:
    # A session may already hold this object from an earlier read. Refresh it
    # after the lock is acquired so decisions use the committed state.
    return db.query(Game).filter(Game.id == game_id).with_for_update().populate_existing().one_or_none()


def get_game_player(db: Session, game_id: int, user_id: int) -> GamePlayer | None:
    return (
        db.query(GamePlayer)
        .filter(GamePlayer.game_id == game_id, GamePlayer.user_id == user_id)
        .one_or_none()
    )


def list_game_moves(db: Session, game_id: int) -> list[Move]:
    return db.query(Move).filter(Move.game_id == game_id).order_by(Move.move_number.asc()).all()


def list_chat_messages(db: Session, game_id: int, limit: int, before_id: int | None) -> list[ChatMessage]:
    query = db.query(ChatMessage).filter(ChatMessage.game_id == game_id)
    if before_id is not None:
        query = query.filter(ChatMessage.id < before_id)
    return list(reversed(query.order_by(ChatMessage.id.desc()).limit(limit).all()))


def list_games_for_user(db: Session, user_id: int, limit: int, before_id: int | None) -> list[Game]:
    query = (
        db.query(Game)
        .join(GamePlayer)
        .filter(GamePlayer.user_id == user_id)
        .options(selectinload(Game.players).selectinload(GamePlayer.user))
    )
    if before_id is not None:
        query = query.filter(Game.id < before_id)
    return query.order_by(Game.id.desc()).limit(limit).all()


def list_active_games_for_user(db: Session, user_id: int) -> list[Game]:
    return (
        db.query(Game)
        .join(GamePlayer)
        .filter(
            GamePlayer.user_id == user_id,
            Game.status == "active",
            Game.finished_at.is_(None),
        )
        .order_by(Game.started_at.desc().nullslast(), Game.id.desc())
        .all()
    )


def list_active_games_for_user_for_update(db: Session, user_id: int) -> list[Game]:
    player_games = db.query(GamePlayer.game_id).filter(GamePlayer.user_id == user_id)
    return (
        db.query(Game)
        .filter(Game.id.in_(player_games), Game.status == "active", Game.finished_at.is_(None))
        .order_by(Game.id.asc())
        .with_for_update(of=Game)
        .populate_existing()
        .all()
    )


def get_latest_active_game_for_user(db: Session, user_id: int) -> Game | None:
    return (
        db.query(Game)
        .join(GamePlayer)
        .filter(
            GamePlayer.user_id == user_id,
            Game.status == "active",
            Game.finished_at.is_(None),
        )
        .order_by(Game.started_at.desc().nullslast(), Game.id.desc())
        .first()
    )


def get_queue_entry(db: Session, user_id: int) -> MatchmakingQueue | None:
    return db.query(MatchmakingQueue).filter(MatchmakingQueue.user_id == user_id).one_or_none()


def get_oldest_waiting_queue_entry(db: Session, exclude_user_id: int) -> MatchmakingQueue | None:
    return (
        db.query(MatchmakingQueue)
        .filter(MatchmakingQueue.user_id != exclude_user_id)
        .with_for_update(skip_locked=True)
        .order_by(MatchmakingQueue.created_at.asc(), MatchmakingQueue.id.asc())
        .first()
    )


def acquire_matchmaking_lock(db: Session) -> None:
    if db.bind is not None and db.bind.dialect.name == "postgresql":
        db.execute(text("SELECT pg_advisory_xact_lock(:lock_id)"), {"lock_id": MATCHMAKING_ADVISORY_LOCK_ID})


def add_queue_entry(db: Session, user_id: int) -> MatchmakingQueue:
    entry = MatchmakingQueue(user_id=user_id)
    db.add(entry)
    db.flush()
    db.refresh(entry)
    return entry


def delete_queue_entry(db: Session, entry: MatchmakingQueue) -> None:
    db.delete(entry)
    db.flush()


def delete_queue_entries_for_users(db: Session, user_ids: list[int]) -> int:
    if not user_ids:
        return 0
    deleted_count = db.query(MatchmakingQueue).filter(MatchmakingQueue.user_id.in_(user_ids)).delete(
        synchronize_session=False
    )
    db.flush()
    return deleted_count
