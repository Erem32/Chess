// Check responsive pagination with enough mock content to span multiple pages.
const { chromium } = require('playwright-core');
const assert = require('node:assert/strict');
const baseURL = process.env.CHESS_E2E_FRONTEND_URL;
const chromePath = process.env.CHROME_PATH;
if (!baseURL || !chromePath) throw new Error('Set CHESS_E2E_FRONTEND_URL and CHROME_PATH.');

(async () => {
  const browser = await chromium.launch({ executablePath: chromePath, headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const items = Array.from({ length: 40 }, (_, index) => ({ id: `item-${index}`, title: `Item ${index + 1}`, instruction: `Move ${index + 1}`, fen, category: 'Practice', line: 'Main line', introduction: 'Introduction', ideas: [], steps: [{ fen, move: null, explanation: 'Start' }, { fen, move: 'e4', explanation: 'Move' }] }));
    await page.addInitScript(() => localStorage.setItem('access_token', 'test-token'));
    await page.route('**/api/v1/**', (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/api/v1/users/me') return route.fulfill({ json: { id: 1, username: 'learner' } });
      if (['/api/v1/practice/exercises', '/api/v1/teaching-examples', '/api/v1/opening/catalog'].includes(path)) return route.fulfill({ json: items });
      return route.fulfill({ status: 404 });
    });
    for (const route of ['lessons', 'puzzles', 'examples', 'opening']) {
      let normalCount;
      for (const viewport of [{ width: 1280, height: 720 }, { width: 1920, height: 720 }, { width: 1920, height: 1080 }, { width: 390, height: 844 }, { width: 320, height: 568 }]) {
        await page.setViewportSize(viewport);
        await page.goto(`${baseURL}/${route}`);
        const cards = page.locator('.study-catalog-scroll .study-card');
        await cards.first().waitFor();
        await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const count = await cards.count();
        const area = await page.locator('.study-catalog-scroll').evaluate((element) => ({ height: element.clientHeight, content: element.scrollHeight }));
        assert.ok(area.content <= area.height + 1, `${route} ${JSON.stringify(viewport)}: ${JSON.stringify(area)}`);
        assert.ok(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1), `${route}: page overflows`);
        assert.ok(await page.getByRole('navigation', { name: 'Pages' }).isVisible());
        if (viewport.width === 1280) normalCount = count;
        if (viewport.width === 1920) assert.ok(count > normalCount, `${route}: large screen should show more cards`);
      }
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto(`${baseURL}/${route}`);
      await page.locator('.study-catalog-scroll .study-card').first().waitFor();
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const seen = new Set();
      const next = page.getByRole('button', { name: 'Next', exact: true });
      do {
        for (const label of await page.locator('.study-catalog-scroll .study-card').evaluateAll((elements) => elements.map((element) => element.getAttribute('aria-label')))) seen.add(label);
        if (!(await next.isEnabled())) break;
        await next.click();
      } while (true);
      assert.equal(seen.size, items.length, `${route}: every item should be reachable`);
    }
    console.log('Responsive catalog pagination passed.');
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exit(1); });
