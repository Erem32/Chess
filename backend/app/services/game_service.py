from datetime import datetime

from sqlalchemy.orm import Session

from app.models import Game, Move, User
from app.repositories import game_repository


class GameNotFoundError(Exception):
    pass


class GameAccessDeniedError(Exception):
    pass


class GameAlreadyFinishedError(Exception):
    pass


class GameCannotBeAbortedError(Exception):
    pass


class DrawOfferStateError(Exception):
    pass


class GameService:
    """Game lifecycle, resignations, and history workflows."""

    def get_game_for_user(self, db: Session, game_id: int, user: User) -> Game:
        game = game_repository.get_game(db, game_id)
        if game is None:
            raise GameNotFoundError
        if game_repository.get_game_player(db, game_id, user.id) is None:
            raise GameAccessDeniedError
        return game

    def list_moves_for_user(self, db: Session, game_id: int, user: User) -> list[Move]:
        self.get_game_for_user(db, game_id, user)
        return game_repository.list_game_moves(db, game_id)

    def list_history_for_user(self, db: Session, user: User) -> list[Game]:
        return game_repository.list_games_for_user(db, user.id)

    def get_latest_active_game_for_user(self, db: Session, user: User) -> Game | None:
        active_games = game_repository.list_active_games_for_user(db, user.id)
        return active_games[0] if active_games else None

    def abort_active_games_for_user(self, db: Session, user: User) -> list[Game]:
        active_games = game_repository.list_active_games_for_user_for_update(db, user.id)
        if any(game_repository.list_game_moves(db, game.id) for game in active_games):
            raise GameCannotBeAbortedError
        finished_at = datetime.utcnow()

        for game in active_games:
            game.status = "aborted"
            game.finished_at = finished_at
            game.result = "aborted"
            game.draw_offer_by_user_id = None
            game.draw_offer_created_at = None
            for player in game.players:
                player.result = None

        db.commit()
        for game in active_games:
            db.refresh(game)
        return active_games

    def resign(self, db: Session, game_id: int, user: User) -> Game:
        game = game_repository.get_game_for_update(db, game_id)
        if game is None:
            raise GameNotFoundError
        if game_repository.get_game_player(db, game_id, user.id) is None:
            raise GameAccessDeniedError
        if game.finished_at is not None or game.status in {"white_win", "black_win", "draw", "resigned", "aborted"}:
            raise GameAlreadyFinishedError

        resigning_player = game_repository.get_game_player(db, game_id, user.id)
        if resigning_player is None:
            raise GameAccessDeniedError

        winning_color = "black" if resigning_player.color == "white" else "white"
        game.status = "resigned"
        game.finished_at = datetime.utcnow()
        game.result = f"{winning_color}_wins_by_resignation"
        game.draw_offer_by_user_id = None
        game.draw_offer_created_at = None
        for player in game.players:
            player.result = "loss" if player.user_id == user.id else "win"

        db.commit()
        db.refresh(game)
        return game
