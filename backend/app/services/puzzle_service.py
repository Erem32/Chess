"""Replay a server-owned puzzle line and check the learner's moves."""

import chess

from app.schemas.practice import PuzzleAttemptResponse, PuzzleHintResponse, PuzzleLineResponse
from app.services.practice_service import PracticeExercise


class InvalidPuzzleProgress(ValueError):
    pass


def _position(exercise: PracticeExercise, moves: list[str]) -> tuple[chess.Board, list[str], int]:
    line = exercise.solution_moves or [exercise.accepted_moves[0]]
    board = chess.Board(exercise.fen)
    index = 0
    for move_uci in moves:
        # Completed lines cannot be resumed and user-supplied history cannot skip a step.
        if index >= len(line) or move_uci != line[index]:
            raise InvalidPuzzleProgress("Invalid puzzle progress")
        board.push_uci(move_uci)
        index += 1
        if index >= len(line) or board.is_checkmate():
            raise InvalidPuzzleProgress("Puzzle is already complete")
        board.push_uci(line[index])
        index += 1
    if index >= len(line):
        raise InvalidPuzzleProgress("Puzzle is already complete")
    return board, line, index


def attempt(exercise: PracticeExercise, moves: list[str], move_uci: str) -> PuzzleAttemptResponse:
    board, line, index = _position(exercise, moves)
    try:
        move = chess.Move.from_uci(move_uci)
    except ValueError:
        move = chess.Move.null()
    if move not in board.legal_moves:
        return PuzzleAttemptResponse(result="illegal", fen=board.fen())

    board.push(move)
    # Lichess notes that any mate in one is valid, even if the stored line uses another.
    accepted = move_uci in exercise.accepted_moves if exercise.solution_moves is None else move_uci == line[index]
    if not accepted and not (exercise.solution_moves is not None and board.is_checkmate()):
        board.pop()
        return PuzzleAttemptResponse(result="incorrect", fen=board.fen(), feedback=exercise.incorrect_feedback)

    index += 1
    if board.is_checkmate() or index == len(line):
        return PuzzleAttemptResponse(result="correct", fen=board.fen(), complete=True, feedback=exercise.correct_feedback)

    reply = chess.Move.from_uci(line[index])
    reply_san = board.san(reply)
    board.push(reply)
    return PuzzleAttemptResponse(result="correct", fen=board.fen(), opponent_move=reply_san)


def hint(exercise: PracticeExercise, moves: list[str]) -> PuzzleHintResponse:
    board, line, index = _position(exercise, moves)
    square = chess.Move.from_uci(line[index]).from_square
    piece = board.piece_at(square)
    if piece is None:  # The catalog validator guarantees a piece at the source square.
        raise InvalidPuzzleProgress("Invalid puzzle position")
    return PuzzleHintResponse(square=chess.square_name(square), piece=chess.piece_name(piece.piece_type))


def reveal(exercise: PracticeExercise, moves: list[str]) -> PuzzleLineResponse:
    board, line, index = _position(exercise, moves)
    notation = []
    for move_uci in line[index:]:
        move = chess.Move.from_uci(move_uci)
        notation.append(board.san(move))
        board.push(move)
    return PuzzleLineResponse(moves=notation, fen=board.fen(), explanation=exercise.explanation)
