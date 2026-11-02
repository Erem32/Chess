// Verify the initial layout against slow and failed responses without a backend.
const { chromium } = require('playwright-core');
const assert = require('node:assert/strict');
const baseURL = process.env.CHESS_E2E_FRONTEND_URL;
const chromePath = process.env.CHROME_PATH;
if (!baseURL || !chromePath) throw new Error('Set CHESS_E2E_FRONTEND_URL and CHROME_PATH.');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  const browser = await chromium.launch({ executablePath: chromePath, headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    let activeGame = null;
    await page.addInitScript(() => localStorage.setItem('access_token', 'test-token'));
    await page.route('**/api/v1/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/api/v1/users/me') return route.fulfill({ json: { id: 1, username: 'learner' } });
      if (path === '/api/v1/users/me/stats') { await delay(900); return route.fulfill({ json: { wins: 4, losses: 2, draws: 1, games_played: 7 } }); }
      if (path === '/api/v1/games/my-active') { await delay(900); return activeGame ? route.fulfill({ json: activeGame }) : route.fulfill({ status: 204 }); }
      if (path === '/api/v1/matchmaking/status') return route.fulfill({ json: { status: 'idle' } });
      if (path === '/api/v1/games/my-history') { await delay(900); return route.fulfill({ json: { games: [], next_before_id: null } }); }
      if (path === '/api/v1/practice/exercises') { await delay(900); return route.fulfill({ json: [] }); }
      if (path.startsWith('/api/v1/games/12')) { await delay(900); return route.fulfill({ status: 404, json: { detail: 'Game missing' } }); }
      return route.fulfill({ status: 404 });
    });
    await page.goto(`${baseURL}/dashboard`);
    await page.getByRole('status', { name: 'Loading statistics' }).waitFor();
    const play = page.getByRole('heading', { name: 'Play online' });
    const latest = page.getByRole('heading', { name: 'Latest games' });
    const before = { play: (await play.boundingBox()).y, latest: (await latest.boundingBox()).y, stats: (await page.locator('.dashboard-stat-grid').boundingBox()).height };
    await page.getByText('7', { exact: true }).first().waitFor();
    await page.getByText('No games yet.', { exact: false }).waitFor();
    const after = { play: (await play.boundingBox()).y, latest: (await latest.boundingBox()).y, stats: (await page.locator('.dashboard-stat-grid').boundingBox()).height };
    for (const key of Object.keys(before)) assert.ok(Math.abs(before[key] - after[key]) < 2, `${key} shifted: ${before[key]} to ${after[key]}`);
    activeGame = { id: 7 };
    await page.reload();
    await page.getByRole('status', { name: 'Loading statistics' }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Join matchmaking' }).isDisabled(), true);
    const activeBefore = (await page.getByRole('heading', { name: 'Latest games' }).boundingBox()).y;
    await page.getByRole('button', { name: 'Resume game' }).waitFor();
    assert.ok(Math.abs(activeBefore - (await page.getByRole('heading', { name: 'Latest games' }).boundingBox()).y) < 2);
    await page.getByRole('button', { name: 'Abort game' }).waitFor();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    await page.getByRole('status', { name: 'Loading statistics' }).waitFor();
    const mobileBefore = (await page.getByRole('heading', { name: 'Latest games' }).boundingBox()).y;
    await page.getByRole('button', { name: 'Resume game' }).waitFor();
    assert.ok(Math.abs(mobileBefore - (await page.getByRole('heading', { name: 'Latest games' }).boundingBox()).y) < 2);
    await page.goto(`${baseURL}/lessons`);
    await page.getByRole('status', { name: 'Loading lessons' }).waitFor();
    assert.equal(await page.locator('.loading-card').count(), 6);
    assert.equal(await page.getByText('Loading lessons...').count(), 0);
    await page.getByText('No lessons are available yet.').waitFor();
    await page.goto(`${baseURL}/games/12`);
    await page.getByRole('status', { name: 'Loading game' }).waitFor();
    assert.equal(await page.locator('#game-board-square-e2').count(), 0);
    await page.getByText('Game missing', { exact: false }).first().waitFor();
    await page.getByRole('button', { name: 'Retry loading game' }).waitFor();
    console.log('Loading layout and error handling passed.');
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exit(1); });
