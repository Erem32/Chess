// A REST poll can arrive ahead of its matching socket move. Keep the board
// disabled until its displayed position agrees with the server game state.
export function boardMatchesGame(game, fen) {
  return Boolean(game?.current_fen && fen && game.current_fen === fen);
}

export function canPlayGameMove(game, fen, playerColor, socketStatus) {
  return game?.status === "active" && Boolean(playerColor) &&
    game.turn_color === playerColor && socketStatus === "connected" && boardMatchesGame(game, fen);
}
