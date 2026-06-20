from threading import RLock

import chess
from sqlalchemy.orm import Session

from app.models import Game, MatchmakingQueue, User
from app.repositories import game_repository


class MatchmakingResult:
    def __init__(self, status: str, game: Game | None = None, queue_entry: MatchmakingQueue | None = None) -> None:
        self.status = status
        self.game = game
        self.queue_entry = queue_entry


class MatchmakingService:
    """Database-backed matchmaking workflows."""

    def __init__(self) -> None:
        self._local_lock = RLock()

    def join(self, db: Session, user: User) -> MatchmakingResult:
        with self._local_lock:
            game_repository.acquire_matchmaking_lock(db)

            active_game = game_repository.get_latest_active_game_for_user(db, user.id)
            if active_game is not None:
                return MatchmakingResult(status="matched", game=active_game)

            existing_entry = game_repository.get_queue_entry(db, user.id)
            if existing_entry is not None:
                return MatchmakingResult(status="waiting", queue_entry=existing_entry)

            while True:
                opponent_entry = game_repository.get_oldest_waiting_queue_entry(db, exclude_user_id=user.id)
                if opponent_entry is None:
                    queue_entry = game_repository.add_queue_entry(db, user.id)
                    db.commit()
                    db.refresh(queue_entry)
                    return MatchmakingResult(status="waiting", queue_entry=queue_entry)

                opponent_active_game = game_repository.get_latest_active_game_for_user(db, opponent_entry.user_id)
                if opponent_active_game is not None:
                    game_repository.delete_queue_entry(db, opponent_entry)
                    continue

                opponent_user_id = opponent_entry.user_id
                game = game_repository.create_game_with_players(
                    db,
                    white_user_id=opponent_user_id,
                    black_user_id=user.id,
                    starting_fen=chess.STARTING_FEN,
                )
                game_repository.delete_queue_entries_for_users(db, [opponent_user_id, user.id])
                db.commit()
                db.refresh(game)
                return MatchmakingResult(status="matched", game=game)

    def leave(self, db: Session, user: User) -> bool:
        with self._local_lock:
            game_repository.acquire_matchmaking_lock(db)
            deleted_count = game_repository.delete_queue_entries_for_users(db, [user.id])
            db.commit()
            return deleted_count > 0

    def status(self, db: Session, user: User) -> MatchmakingResult:
        active_game = game_repository.get_latest_active_game_for_user(db, user.id)
        if active_game is not None:
            return MatchmakingResult(status="matched", game=active_game)

        entry = game_repository.get_queue_entry(db, user.id)
        if entry is not None:
            return MatchmakingResult(status="waiting", queue_entry=entry)

        return MatchmakingResult(status="idle")
