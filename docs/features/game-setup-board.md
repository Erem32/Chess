# Online game and queue feedback

Players can join or leave the matchmaking queue, see their opponent and turn, and follow pending moves and connection status. Moves are confirmed by the backend; the board is disabled while waiting for confirmation or synchronization.

See [the dashboard](../../frontend/src/pages/DashboardPage.jsx), [the game page](../../frontend/src/pages/GamePage.jsx), and the two-player browser smoke test. Use a disposable database when testing matchmaking or games.
