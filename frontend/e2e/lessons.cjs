// Exercise the real lessons page with test-only API responses.
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
    let failExercises = false;
    const moves = [];
    const start = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    await page.route('**/api/v1/**', async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname === '/api/v1/users/me') return route.fulfill({ json: { id: 1, username: 'learner' } });
      if (url.pathname === '/api/v1/practice/exercises') {
        assert.equal(url.search, '?kind=lesson');
        if (failExercises) return route.fulfill({ status: 503, json: { detail: 'Unavailable' } });
        return route.fulfill({ json: exercises });
      }
      if (url.pathname.endsWith('/attempt')) {
        const move = route.request().postDataJSON().move_uci;
        moves.push(move);
        const result = move === 'e2e5' ? 'illegal' : move === 'd2d4' ? 'incorrect' : 'correct';
        const fen = result === 'correct' ? 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1' : start;
        return route.fulfill({ json: { result, fen, feedback: null } });
      }
      return route.fulfill({ status: 404 });
    });
    await page.goto(`${baseURL}/lessons`);
    await page.getByText('No lessons are available yet.').waitFor();
    exercises = [{ id: 'test', fen: start, instruction: 'Test move' }];
    failExercises = true;
    await page.reload();
    await page.getByText('Could not load lessons: Unavailable').waitFor();
    failExercises = false;
    await page.getByRole('button', { name: 'Retry loading' }).click();
    await page.getByRole('button', { name: 'Lesson 1: Test move' }).click();
    const move = async (from, to) => { await page.locator(`[data-square="${from}"]`).click(); await page.locator(`[data-square="${to}"]`).click(); };
    await move('e2', 'e5');
    await page.getByText('That move is not legal.').waitFor();
    await move('d2', 'd4');
    await page.getByText('Not quite. Try another move.').waitFor();
    await move('e2', 'e4');
    await page.getByText('Correct!', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Retry' }).click();
    // Allow the board's reset animation to finish before interacting again.
    await page.waitForTimeout(500);
    await move('e2', 'e4');
    await page.getByText('Correct!', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'All lessons' }).click();
    await page.getByRole('button', { name: 'Lesson 1: Test move' }).waitFor();
    assert.deepEqual(moves, ['e2e5', 'd2d4', 'e2e4', 'e2e4']);
    console.log('Lessons browser test passed.');
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exit(1); });
