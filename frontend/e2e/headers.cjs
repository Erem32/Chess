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
      if (path === '/api/v1/practice/exercises') return route.fulfill({ json: [{ id: 'example', instruction: 'Example', fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' }] });
      if (path === '/api/v1/teaching-examples') return route.fulfill({ json: [] });
      if (path === '/api/v1/opening/catalog') return route.fulfill({ json: [] });
      return route.fulfill({ status: 404 });
    });
    for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport);
      const sizes = [];
      const positions = [];
      for (const route of ['login', 'register', 'dashboard', 'lessons', 'puzzles', 'opening', 'examples', 'history', 'settings']) {
        await page.goto(`${baseURL}/${route}`);
        const heading = page.locator('.study-header h1');
        await heading.waitFor();
        sizes.push({ route, size: await heading.evaluate((element) => getComputedStyle(element).fontSize) });
        if (['lessons', 'puzzles', 'opening', 'examples', 'history', 'settings'].includes(route)) {
          positions.push({ route, heading: (await heading.boundingBox()).y, back: (await page.locator('.study-back').boundingBox()).y });
        }
      }
      assert.equal(new Set(sizes.map((item) => item.size)).size, 1, JSON.stringify(sizes));
      for (const item of positions) {
        assert.ok(Math.abs(item.heading - positions[0].heading) < 1 && Math.abs(item.back - positions[0].back) < 1, JSON.stringify(positions));
      }
    }
    for (const viewport of [{ width: 1280, height: 720 }, { width: 1920, height: 1080 }, { width: 390, height: 844 }, { width: 320, height: 568 }]) {
      await page.setViewportSize(viewport);
      await page.goto(`${baseURL}/lessons`);
      const frame = page.locator('.study-catalog-scroll');
      await frame.waitFor();
      const reference = await frame.boundingBox();
      await page.goto(`${baseURL}/history`);
      const archive = await page.locator('.history-archive').boundingBox();
      for (const key of ['x', 'y', 'width']) assert.ok(Math.abs(archive[key] - reference[key]) < 1, `${JSON.stringify(viewport)} ${key}: history ${archive[key]}, lessons ${reference[key]}`);
    }
    console.log('Page headers and history frame are aligned at desktop and mobile widths.');
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exit(1); });
