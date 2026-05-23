import chess


class IllegalMoveError(ValueError):
    pass


def apply_uci_move(fen: str, move_uci: str) -> dict[str, str | bool]:
    board = chess.Board(fen)

    try:
        move = chess.Move.from_uci(move_uci)
    except ValueError as exc:
        raise IllegalMoveError("Invalid UCI move") from exc

    if move not in board.legal_moves:
        raise IllegalMoveError("Illegal move")

    san = board.san(move)
    board.push(move)

    return {
        "fen": board.fen(),
        "turn_color": "white" if board.turn == chess.WHITE else "black",
        "is_checkmate": board.is_checkmate(),
        "is_stalemate": board.is_stalemate(),
        "is_insufficient_material": board.is_insufficient_material(),
        "san": san,
    }
