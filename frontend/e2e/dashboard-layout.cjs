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
    let waiting = false;
    let activeGame = null;
    const games = Array.from({ length: 5 }, (_, index) => ({ id: index + 1, status: 'aborted', players: [] }));
    await page.route('**/api/v1/**', (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/api/v1/users/me') return route.fulfill({ json: { id: 1, username: 'learner' } });
      if (path === '/api/v1/users/me/stats') return route.fulfill({ json: { games_played: 10, wins: 4, losses: 3, draws: 3 } });
      if (path === '/api/v1/games/my-active') return activeGame ? route.fulfill({ json: activeGame }) : route.fulfill({ status: 204 });
      if (path === '/api/v1/games/my-history') return route.fulfill({ json: { games, next_before_id: null } });
      if (path === '/api/v1/matchmaking/status') return route.fulfill({ json: { status: waiting ? 'waiting' : 'idle' } });
      return route.fulfill({ status: 404 });
    });
    for (const viewport of [{ width: 1280, height: 720 }, { width: 1366, height: 768 }, { width: 1920, height: 1080 }, { width: 768, height: 768 }, { width: 390, height: 844 }, { width: 390, height: 700 }, { width: 320, height: 700 }, { width: 390, height: 640 }, { width: 320, height: 568 }, { width: 1280, height: 650 }]) {
      await page.setViewportSize(viewport);
      await page.goto(`${baseURL}/dashboard`);
      await page.getByText('Game #1').waitFor();
      assert.ok(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1), `page overflows at ${JSON.stringify(viewport)}`);
      for (const label of ['Play online', 'Learn & practise', 'Stats', 'Latest games']) {
        const box = await page.getByRole('heading', { name: label }).boundingBox();
        assert.ok(box && box.y >= 0 && box.y + box.height <= viewport.height, `${label} outside ${JSON.stringify(viewport)}`);
      }
      for (const label of ['Join matchmaking', 'Open lessons', 'Open puzzles', 'Open opening', 'Open examples', 'View history']) {
        const box = await page.getByRole('button', { name: label, exact: true }).boundingBox();
        assert.ok(box && box.y >= 0 && box.y + box.height <= viewport.height, `${label} outside ${JSON.stringify(viewport)}`);
      }
      const list = page.locator('.latest-games-list');
      const dimensions = await list.evaluate((element) => ({ scrollHeight: element.scrollHeight, clientHeight: element.clientHeight }));
      if (dimensions.scrollHeight > dimensions.clientHeight) {
        await list.evaluate((element) => { element.scrollTop = element.scrollHeight; });
        assert.ok(await list.evaluate((element) => element.scrollTop > 0), 'recent games should remain reachable');
      }
    }
    waiting = true;
    for (const viewport of [{ width: 390, height: 844 }, { width: 320, height: 568 }]) {
      await page.setViewportSize(viewport);
      await page.reload();
      await page.getByRole('button', { name: 'Leave queue' }).waitFor();
      assert.ok(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1), 'waiting state overflows');
      for (const label of ['Leave queue', 'View history']) {
        const box = await page.getByRole('button', { name: label, exact: true }).boundingBox();
        assert.ok(box && box.y + box.height <= viewport.height, `${label} outside waiting view`);
      }
    }
    waiting = false;
    activeGame = { id: 42 };
    await page.evaluate(() => sessionStorage.removeItem("matchmaking_pending"));
    await page.reload();
    await page.getByRole('button', { name: 'Resume game' }).waitFor();
    for (const label of ['Resume game', 'Abort game', 'View history']) {
      const box = await page.getByRole('button', { name: label, exact: true }).boundingBox();
      assert.ok(box && box.y + box.height <= 568, `${label} outside active-game view`);
    }
    console.log('Dashboard layout fits tested viewports.');
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exit(1); });
