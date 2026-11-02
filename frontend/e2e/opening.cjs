const { chromium } = require('playwright-core');
const assert = require('node:assert/strict');
const baseURL = process.env.CHESS_E2E_FRONTEND_URL;
const chromePath = process.env.CHROME_PATH;
if (!baseURL || !chromePath) throw new Error('Set CHESS_E2E_FRONTEND_URL and CHROME_PATH.');

(async () => {
  const browser = await chromium.launch({ executablePath: chromePath, headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.addInitScript(() => localStorage.setItem('access_token', 'test-token'));
    let guide = null;
    await page.route('**/api/v1/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/api/v1/users/me') return route.fulfill({ json: { id: 1, username: 'learner' } });
      if (path === '/api/v1/opening') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(guide) });
      return route.fulfill({ status: 404 });
    });
    await page.goto(`${baseURL}/opening`);
    await page.getByText('No opening guide is available yet.').waitFor();
    guide = { title: 'Test guide', video_url: null, steps: [
      { fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', move: null, explanation: 'Starting position.' },
      { fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1', move: 'e4', explanation: 'White moves.' }
    ] };
    await page.reload();
    await page.getByText('Starting position.', { exact: true }).waitFor();
    assert.equal(await page.getByRole('link', { name: 'Watch video' }).count(), 0);
    assert.equal(await page.getByRole('button', { name: 'Previous' }).isDisabled(), true);
    assert.equal(await page.locator('#game-board-square-e2 [role=button]').getAttribute('aria-disabled'), 'true');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByText('White moves.').waitFor();
    assert.equal(await page.getByRole('button', { name: 'Next' }).isDisabled(), true);
    await page.getByRole('button', { name: 'Previous' }).click();
    await page.getByText('Starting position.', { exact: true }).waitFor();
    guide.video_url = 'https://example.com/video';
    await page.reload();
    assert.equal(await page.getByRole('link', { name: 'Watch video' }).getAttribute('href'), guide.video_url);
    console.log('Opening study browser test passed.');
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exit(1); });
