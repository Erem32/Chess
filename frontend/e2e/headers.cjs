const { chromium } = require('playwright-core');
const assert = require('node:assert/strict');
const baseURL = process.env.CHESS_E2E_FRONTEND_URL;
const chromePath = process.env.CHROME_PATH;
if (!baseURL || !chromePath) throw new Error('Set CHESS_E2E_FRONTEND_URL and CHROME_PATH.');

(async () => {
  const browser = await chromium.launch({ executablePath: chromePath, headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    await page.addInitScript(() => localStorage.setItem('access_token', 'test-token'));
    await page.route('**/api/v1/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/api/v1/users/me') return route.fulfill({ json: { id: 1, username: 'learner' } });
      if (path === '/api/v1/users/me/stats') return route.fulfill({ json: { wins: 0, losses: 0, draws: 0, games_played: 0 } });
      if (path === '/api/v1/games/my-active') return route.fulfill({ status: 204 });
      if (path === '/api/v1/matchmaking/status') return route.fulfill({ json: { status: 'idle' } });
      if (path === '/api/v1/games/my-history') return route.fulfill({ json: { games: [], next_before_id: null } });
      if (path === '/api/v1/practice/exercises' || path === '/api/v1/teaching-examples') return route.fulfill({ json: [] });
      if (path === '/api/v1/opening') return route.fulfill({ status: 200, contentType: 'application/json', body: 'null' });
      return route.fulfill({ status: 404 });
    });
    for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport);
      const sizes = [];
      for (const route of ['login', 'register', 'dashboard', 'lessons', 'puzzles', 'opening', 'examples', 'history', 'settings']) {
        await page.goto(`${baseURL}/${route}`);
        const heading = page.locator('.study-header h1');
        await heading.waitFor();
        sizes.push({ route, size: await heading.evaluate((element) => getComputedStyle(element).fontSize) });
      }
      assert.equal(new Set(sizes.map((item) => item.size)).size, 1, JSON.stringify(sizes));
    }
    console.log('Page headers are consistent at desktop and mobile widths.');
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exit(1); });
