// Exercise history states with test-only responses.
const { chromium } = require('playwright-core');
const assert = require('node:assert/strict');
const baseURL = process.env.CHESS_E2E_FRONTEND_URL;
const chromePath = process.env.CHROME_PATH;
if (!baseURL || !chromePath) throw new Error('Set CHESS_E2E_FRONTEND_URL and CHROME_PATH.');

(async () => {
  const browser = await chromium.launch({ executablePath: chromePath, headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.addInitScript(() => localStorage.setItem('access_token', 'test-token'));
    let games = [];
    let nextBeforeId = null;
    let failHistory = true;
    await page.route('**/api/v1/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/api/v1/users/me') return route.fulfill({ json: { id: 1, username: 'learner' } });
      if (path === '/api/v1/games/my-history') return failHistory ? route.fulfill({ status: 503, json: { detail: 'Unavailable' } }) : route.fulfill({ json: { games, next_before_id: nextBeforeId } });
      return route.fulfill({ status: 404 });
    });
    await page.goto(`${baseURL}/history`);
    await page.getByRole('alert').getByText('Unavailable', { exact: false }).waitFor();
    failHistory = false;
    await page.getByRole('button', { name: 'Retry', exact: true }).click();
    await page.getByRole('heading', { name: 'No games yet' }).waitFor();
    assert.equal(await page.getByRole('link', { name: 'Find a game' }).getAttribute('href'), '/dashboard');
    games = [
      { id: 11, status: 'active', started_at: '2026-01-01T12:00:00Z', finished_at: null, players: [{ user_id: 1, username: 'learner', color: 'white' }, { user_id: 2, username: 'rival', color: 'black' }] },
      { id: 10, status: 'resigned', result: 'black_wins_by_resignation', started_at: '2026-01-01T12:00:00Z', finished_at: '2026-01-01T12:05:00Z', players: [{ user_id: 1, color: 'white', result: 'loss' }, { user_id: 3, username: 'other', color: 'black', result: 'win' }] },
      { id: 9, status: 'aborted', players: [] }
    ];
    await page.reload();
    await page.getByText('vs rival').waitFor();
    await page.getByText('Lost by resignation').waitFor();
    await page.getByText('Opponent unavailable', { exact: true }).waitFor();
    assert.equal(await page.getByRole('link', { name: 'Resume game 11' }).getAttribute('href'), '/games/11');
    assert.equal(await page.getByRole('link', { name: 'Open game 10' }).getAttribute('href'), '/games/10');
    assert.equal(await page.getByRole('link', { name: 'Open game 9' }).getAttribute('href'), '/games/9');
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.equal(await page.getByRole('link', { name: 'Open game 10' }).isVisible(), true);
    games = [...games, ...Array.from({ length: 10 }, (_, index) => ({ ...games[1], id: 20 + index }))];
    nextBeforeId = 1;
    await page.evaluate(() => localStorage.setItem('text_size', 'larger'));
    await page.reload();
    await page.getByText('vs rival').waitFor();
    for (const viewport of [{ width: 390, height: 844 }, { width: 320, height: 568 }, { width: 1280, height: 720 }]) {
      await page.setViewportSize(viewport);
      assert.ok(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1));
      const list = page.locator('.history-list');
      assert.ok(await list.evaluate((element) => element.scrollHeight > element.clientHeight));
      await list.evaluate((element) => { element.scrollTop = element.scrollHeight; });
      assert.ok(await list.evaluate((element) => element.scrollTop > 0));
      const more = await page.getByRole('button', { name: 'Load more' }).boundingBox();
      const archive = await page.locator('.history-archive').boundingBox();
      assert.ok(more && more.y >= archive.y && more.y + more.height <= archive.y + archive.height, 'Load more must remain fully visible');
    }
    await page.getByRole('link', { name: 'Open game 10' }).click();
    await page.waitForURL('**/games/10');
    console.log('History interface states and navigation passed.');
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exit(1); });
