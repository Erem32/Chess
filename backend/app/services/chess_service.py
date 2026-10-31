from datetime import datetime

import chess
from sqlalchemy.orm import Session

from app.models import ChatMessage, Game, GamePlayer, Move
from app.repositories import game_repository


class IllegalMoveError(ValueError):
    pass


class GameNotFoundError(ValueError):
    pass


class GameAccessError(ValueError):
    pass


class GameNotActiveError(ValueError):
    pass


class NotPlayerTurnError(ValueError):
    pass


class ChatMessageError(ValueError):
    pass


MAX_CHAT_MESSAGE_LENGTH = 1000


class DrawOfferError(ValueError):
    pass


def apply_uci_move(fen: str, move_uci: str) -> dict[str, str | bool | None]:
    board = chess.Board(fen)

    try:
        move = chess.Move.from_uci(move_uci)
    except ValueError as exc:
        raise IllegalMoveError("Invalid UCI move") from exc

    if move not in board.legal_moves:
        raise IllegalMoveError("Illegal move")

    san = board.san(move)
    board.push(move)
    is_checkmate = board.is_checkmate()
    is_stalemate = board.is_stalemate()
    is_insufficient_material = board.is_insufficient_material()
    is_seventyfive_moves = board.is_seventyfive_moves()
    is_finished = is_checkmate or is_stalemate or is_insufficient_material or is_seventyfive_moves

    return {
        "fen": board.fen(),
        "turn_color": "white" if board.turn == chess.WHITE else "black",
        "is_checkmate": is_checkmate,
        "is_stalemate": is_stalemate,
        "is_insufficient_material": is_insufficient_material,
        "is_seventyfive_moves": is_seventyfive_moves,
        "is_finished": is_finished,
        "result": board.result() if is_finished else None,
        "san": san,
    }


def apply_player_move(db: Session, game_id: int, user_id: int, move_uci: str) -> dict:
    db.expire_all()
    game = _get_game_for_user(db, game_id, user_id, lock=True)
    player = _get_player(db, game_id, user_id)
    if player is None:
        raise GameAccessError("User does not belong to this game")
    if game.status != "active":
        raise GameNotActiveError("Game is not active")
    if player.color != game.turn_color:
        raise NotPlayerTurnError("It is not this player's turn")

    move_result = apply_uci_move(game.current_fen, move_uci)
    previous_moves = game_repository.list_game_moves(db, game_id)
    board = _replay_game_history(game.current_fen, previous_moves)
    is_fivefold_repetition = False
    if board is not None:
        board.push_uci(move_uci)
        is_fivefold_repetition = board.is_fivefold_repetition()
        if is_fivefold_repetition and not move_result["is_checkmate"]:
            move_result["is_finished"] = True
            move_result["result"] = "1/2-1/2"
    move_number = len(previous_moves) + 1
    move = Move(
        game_id=game_id,
        user_id=user_id,
        move_number=move_number,
        move_uci=move_uci,
        move_san=str(move_result["san"]),
        fen_after_move=str(move_result["fen"]),
    )

    game.current_fen = str(move_result["fen"])
    game.turn_color = str(move_result["turn_color"])
    _clear_draw_offer(game)
    if move_result["is_finished"]:
        game.status = _finished_status(game.turn_color, bool(move_result["is_checkmate"]))
        game.finished_at = datetime.utcnow()
        game.result = str(move_result["result"])
        _set_player_results(game, bool(move_result["is_checkmate"]))

    db.add(move)
    db.commit()
    db.refresh(game)
    db.refresh(move)

    return {
        "game": game_state_payload(game),
        "move": move_payload(move),
        "is_checkmate": move_result["is_checkmate"],
        "is_stalemate": move_result["is_stalemate"],
        "is_insufficient_material": move_result["is_insufficient_material"],
        "is_seventyfive_moves": move_result["is_seventyfive_moves"],
        "is_fivefold_repetition": is_fivefold_repetition,
    }


def _replay_game_history(current_fen: str, moves: list[Move]) -> chess.Board | None:
    """Recover repetition history only when the stored moves reproduce the game."""
    board = chess.Board()
    try:
        for move in moves:
            board.push_uci(move.move_uci)
    except ValueError:
        return None
    return board if board.fen() == current_fen else None


def persist_chat_message(db: Session, game_id: int, user_id: int, message: str) -> dict:
    db.expire_all()
    _get_game_for_user(db, game_id, user_id)
    text = message.strip()
    if not text:
        raise ChatMessageError("Chat message cannot be empty")
    if len(text) > MAX_CHAT_MESSAGE_LENGTH:
        raise ChatMessageError(f"Chat message cannot exceed {MAX_CHAT_MESSAGE_LENGTH} characters")
    if "\x00" in text:
        raise ChatMessageError("Chat message cannot contain null bytes")
    try:
        text.encode("utf-8")
    except UnicodeEncodeError as exc:
        raise ChatMessageError("Chat message must contain valid Unicode") from exc

    chat_message = ChatMessage(game_id=game_id, user_id=user_id, message=text)
    db.add(chat_message)
    db.commit()
    db.refresh(chat_message)
    return chat_message_payload(chat_message)


def get_game_state_for_user(db: Session, game_id: int, user_id: int) -> dict:
    db.expire_all()
    return game_state_payload(_get_game_for_user(db, game_id, user_id))


def offer_draw(db: Session, game_id: int, user_id: int) -> dict:
    game = _get_game_for_user(db, game_id, user_id, lock=True)
    if game.status != "active":
        raise GameNotActiveError("Game is not active")
    if game.draw_offer_by_user_id == user_id:
        raise DrawOfferError("You have already offered a draw")
    if game.draw_offer_by_user_id is not None and game.draw_offer_by_user_id != user_id:
        raise DrawOfferError("A draw offer is already pending")

    game.draw_offer_by_user_id = user_id
    game.draw_offer_created_at = datetime.utcnow()
    db.commit()
    db.refresh(game)
    return game_state_payload(game)


def draw_claim_options(db: Session, game_id: int, user_id: int) -> dict:
    game, board, history_available = _draw_claim_position(db, game_id, user_id)
    current_reasons = _claim_reasons(board, history_available)
    moves = []
    for move in list(board.legal_moves):
        san = board.san(move)
        board.push(move)
        reasons = _claim_reasons(board, history_available)
        board.pop()
        if reasons:
            moves.append({"uci": move.uci(), "san": san, "reasons": reasons})
    return {"game_id": game.id, "current_reasons": current_reasons, "moves": moves}


def claim_draw(db: Session, game_id: int, user_id: int, move_uci: str | None = None) -> dict:
    game, board, history_available = _draw_claim_position(db, game_id, user_id)
    if move_uci is not None:
        try:
            move = chess.Move.from_uci(move_uci)
        except ValueError as exc:
            raise DrawOfferError("Declared move is invalid") from exc
        if move not in board.legal_moves:
            raise DrawOfferError("Declared move is not legal")
        board.push(move)
    reasons = _claim_reasons(board, history_available)
    if not reasons:
        raise DrawOfferError("The position does not qualify for a draw claim")
    game.status = "draw"
    game.result = f"draw_claimed_{reasons[0]}"
    game.finished_at = datetime.utcnow()
    for player in game.players:
        player.result = "draw"
    _clear_draw_offer(game)
    db.commit()
    db.refresh(game)
    return game_state_payload(game)


def _draw_claim_position(db: Session, game_id: int, user_id: int) -> tuple[Game, chess.Board, bool]:
    db.expire_all()
    game = _get_game_for_user(db, game_id, user_id, lock=True)
    player = _get_player(db, game_id, user_id)
    if game.status != "active":
        raise GameNotActiveError("Game is not active")
    if player is None or player.color != game.turn_color:
        raise NotPlayerTurnError("It is not this player's turn")
    board = _replay_game_history(game.current_fen, game_repository.list_game_moves(db, game_id))
    return game, board if board is not None else chess.Board(game.current_fen), board is not None


def _claim_reasons(board: chess.Board, history_available: bool) -> list[str]:
    reasons = []
    if history_available and board.is_repetition(3):
        reasons.append("threefold")
    if board.is_fifty_moves():
        reasons.append("fifty_move")
    return reasons


def respond_to_draw_offer(db: Session, game_id: int, user_id: int, accept: bool) -> dict:
    game = _get_game_for_user(db, game_id, user_id, lock=True)
    if game.status != "active":
        raise GameNotActiveError("Game is not active")
    if game.draw_offer_by_user_id is None:
        raise DrawOfferError("There is no pending draw offer")
    if game.draw_offer_by_user_id == user_id:
        raise DrawOfferError("You cannot respond to your own draw offer")

    if accept:
        game.status = "draw"
        game.finished_at = datetime.utcnow()
        game.result = "draw_agreed"
        for player in game.players:
            player.result = "draw"
        _clear_draw_offer(game)
    else:
        _clear_draw_offer(game)

    db.commit()
    db.refresh(game)
    return game_state_payload(game)


def game_state_payload(game: Game) -> dict:
    return {
        "id": game.id,
        "status": game.status,
        "current_fen": game.current_fen,
        "turn_color": game.turn_color,
        "started_at": _datetime_payload(game.started_at),
        "finished_at": _datetime_payload(game.finished_at),
        "result": game.result,
        "draw_offer_by_user_id": game.draw_offer_by_user_id,
        "draw_offer_created_at": _datetime_payload(game.draw_offer_created_at),
    }


def move_payload(move: Move) -> dict:
    return {
        "id": move.id,
        "game_id": move.game_id,
        "user_id": move.user_id,
        "move_number": move.move_number,
        "move_uci": move.move_uci,
        "move_san": move.move_san,
        "fen_after_move": move.fen_after_move,
        "created_at": _datetime_payload(move.created_at),
    }


def chat_message_payload(chat_message: ChatMessage) -> dict:
    return {
        "id": chat_message.id,
        "game_id": chat_message.game_id,
        "user_id": chat_message.user_id,
        "message": chat_message.message,
        "created_at": _datetime_payload(chat_message.created_at),
    }


def _get_game_for_user(db: Session, game_id: int, user_id: int, lock: bool = False) -> Game:
    game = game_repository.get_game_for_update(db, game_id) if lock else game_repository.get_game(db, game_id)
    if game is None:
        raise GameNotFoundError("Game not found")
    if _get_player(db, game_id, user_id) is None:
        raise GameAccessError("User does not belong to this game")
    return game


def _get_player(db: Session, game_id: int, user_id: int) -> GamePlayer | None:
    return (
        db.query(GamePlayer)
        .filter(GamePlayer.game_id == game_id, GamePlayer.user_id == user_id)
        .one_or_none()
    )


def _finished_status(next_turn_color: str, is_checkmate: bool) -> str:
    if not is_checkmate:
        return "draw"
    return "black_win" if next_turn_color == "white" else "white_win"


def _set_player_results(game: Game, is_checkmate: bool) -> None:
    if not is_checkmate:
        for player in game.players:
            player.result = "draw"
        return

    winning_color = "black" if game.turn_color == "white" else "white"
    for player in game.players:
        player.result = "win" if player.color == winning_color else "loss"


def _clear_draw_offer(game: Game) -> None:
    game.draw_offer_by_user_id = None
    game.draw_offer_created_at = None


def _datetime_payload(value: datetime | None) -> str | None:
    return value.isoformat() if value else None
