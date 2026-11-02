// Exercise puzzle interaction and account-local progress with test-only API responses.
const { chromium } = require('playwright-core');
const assert = require('node:assert/strict');
const baseURL = process.env.CHESS_E2E_FRONTEND_URL;
const chromePath = process.env.CHROME_PATH;
if (!baseURL || !chromePath) throw new Error('Set CHESS_E2E_FRONTEND_URL and CHROME_PATH.');

(async () => {
  const browser = await chromium.launch({ executablePath: chromePath, headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
    await page.addInitScript(() => localStorage.setItem('access_token', 'test-token'));
    let exercises = [];
    let userId = 1;
    const attempts = [];
    const start = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const afterPlayer = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
    const afterReply = 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2';
    const end = 'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2';
    await page.route('**/api/v1/**', async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname === '/api/v1/users/me') return route.fulfill({ json: { id: userId, username: 'learner' } });
      if (url.pathname === '/api/v1/practice/exercises') {
        assert.equal(url.search, '?kind=puzzle');
        return route.fulfill({ json: exercises });
      }
      if (url.pathname.endsWith('/hint')) {
        const previous = route.request().postDataJSON().moves;
        return route.fulfill({ json: previous.length ? { piece: 'knight', square: 'g1' } : { piece: 'pawn', square: 'e2' } });
      }
      if (url.pathname.endsWith('/solution')) return route.fulfill({ json: {
        moves: ['e4', 'e5', 'Nf3'], fen: end, explanation: null,
        steps: [
          { fen: start, move: null, move_uci: null },
          { fen: afterPlayer, move: 'e4', move_uci: 'e2e4' },
          { fen: afterReply, move: 'e5', move_uci: 'e7e5' },
          { fen: end, move: 'Nf3', move_uci: 'g1f3' }
        ]
      } });
      if (url.pathname.endsWith('/attempt')) {
        const { moves, move_uci: move } = route.request().postDataJSON();
        attempts.push({ moves, move });
        if (move === 'e2e5') return route.fulfill({ json: { result: 'illegal', fen: start } });
        if (move === 'd2d4') return route.fulfill({ json: { result: 'incorrect', fen: start } });
        if (move === 'e2e4') return route.fulfill({ json: { result: 'correct', fen: afterReply, player_fen: afterPlayer, complete: false, opponent_move: 'e5' } });
        assert.deepEqual(moves, ['e2e4']);
        return route.fulfill({ json: { result: 'correct', fen: end, player_fen: end, complete: true } });
      }
      return route.fulfill({ status: 404 });
    });
    await page.goto(`${baseURL}/puzzles`);
    await page.getByText('No puzzles are available yet.').waitFor();
    exercises = Array.from({ length: 13 }, (_, index) => ({ id: `test-${index}`, fen: start, instruction: `Test move ${index}` }));
    await page.reload();
    await page.getByText('0 / 13 solved').waitFor();
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByRole('button', { name: 'Puzzle 13: Test move 12' }).waitFor();
    await page.getByRole('button', { name: 'Previous', exact: true }).click();
    await page.getByRole('button', { name: 'Puzzle 1: Test move 0' }).click();
    const move = async (from, to) => { await page.locator(`[data-square="${from}"]`).click(); await page.locator(`[data-square="${to}"]`).click(); };
    await page.getByRole('button', { name: 'Hint', exact: true }).click();
    await page.getByText('Hint: consider the pawn on e2.').waitFor();
    await move('e2', 'e5');
    await page.getByText('That move is not legal.').waitFor();
    await move('d2', 'd4');
    await page.getByText("That move is not in this puzzle's solution. Try another move.").waitFor();
    await page.getByRole('button', { name: 'Reveal solution' }).click();
    await page.getByText('Solution · Step 0 / 3').waitFor();
    await page.locator('[data-square="e2"] [data-piece="wP"]').waitFor();
    await page.getByRole('button', { name: 'Next move' }).click();
    await page.getByText('White: e4').waitFor();
    await page.locator('[data-square="e4"] [data-piece="wP"]').waitFor();
    await page.locator('[data-square="e7"] [data-piece="bP"]').waitFor();
    await page.getByRole('button', { name: 'Next move' }).click();
    await page.getByText('Black: e5').waitFor();
    await page.locator('[data-square="e5"] [data-piece="bP"]').waitFor();
    await page.getByRole('button', { name: 'Next move' }).click();
    await page.getByText('White: Nf3').waitFor();
    assert.equal(await page.getByRole('button', { name: 'Next move' }).isDisabled(), true);
    await page.getByRole('button', { name: 'Previous move' }).click();
    await page.getByText('Black: e5').waitFor();
    await page.locator('[data-square="g1"] [data-piece="wN"]').waitFor();
    await page.getByText('Puzzle 1 / 13 · 0 solved').waitFor();
    await page.getByRole('button', { name: 'Retry' }).click();
    await page.locator('[data-square="e2"] [data-piece="wP"]').waitFor();
    await page.waitForTimeout(400);
    await move('e2', 'e4');
    await page.getByText("Correct! Waiting for the opponent's reply...").waitFor();
    await page.locator('[data-square="e4"] [data-piece="wP"]').waitFor();
    await page.locator('[data-square="e7"] [data-piece="bP"]').waitFor();
    await page.getByRole('button', { name: 'Retry' }).click();
    await page.waitForTimeout(1000);
    await page.locator('[data-square="e2"] [data-piece="wP"]').waitFor();
    await page.locator('[data-square="e7"] [data-piece="bP"]').waitFor();
    await move('e2', 'e4');
    await page.getByText('Correct! Opponent played e5. Find the next move.').waitFor();
    await page.getByRole('button', { name: 'Hint', exact: true }).click();
    await page.getByText('Hint: consider the knight on g1.').waitFor();
    await move('g1', 'f3');
    await page.getByText('Puzzle solved!').waitFor();
    await page.getByText('Puzzle 1 / 13 · 1 solved').waitFor();
    await page.reload();
    await page.getByText('1 / 13 solved').waitFor();
    await page.getByRole('button', { name: 'Solved', exact: true }).click();
    await page.getByRole('button', { name: 'Puzzle 1: Test move 0' }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Puzzle 2: Test move 1' }).count(), 0);
    userId = 2;
    await page.reload();
    await page.getByText('0 / 13 solved').waitFor();
    assert.deepEqual(attempts.map(({ move }) => move), ['e2e5', 'd2d4', 'e2e4', 'e2e4', 'g1f3']);
    console.log('Puzzles browser test passed.');
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exit(1); });
