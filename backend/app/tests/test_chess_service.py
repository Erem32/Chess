import chess
import pytest

from app.services.chess_service import IllegalMoveError, apply_uci_move


def test_legal_move_is_accepted() -> None:
    result = apply_uci_move(chess.STARTING_FEN, "e2e4")

    assert result["turn_color"] == "black"
    assert result["san"] == "e4"


def test_illegal_move_is_rejected() -> None:
    with pytest.raises(IllegalMoveError):
        apply_uci_move(chess.STARTING_FEN, "e2e5")


def test_checkmate_detection() -> None:
    board = chess.Board()
    for move in ["f2f3", "e7e5", "g2g4"]:
        board.push(chess.Move.from_uci(move))

    result = apply_uci_move(board.fen(), "d8h4")

    assert result["is_checkmate"] is True
