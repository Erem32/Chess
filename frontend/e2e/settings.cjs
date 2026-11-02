const { chromium } = require('playwright-core');
const assert = require('node:assert/strict');
const baseURL = process.env.CHESS_E2E_FRONTEND_URL;
const chromePath = process.env.CHROME_PATH;
if (!baseURL || !chromePath) throw new Error('Set CHESS_E2E_FRONTEND_URL and CHROME_PATH.');

(async () => {
  const browser = await chromium.launch({ executablePath: chromePath, headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.addInitScript(() => localStorage.setItem('access_token', 'test-token'));
    const start = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const moves = [];
    await page.route('**/api/v1/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/api/v1/users/me') return route.fulfill({ json: { id: 1, username: 'learner' } });
      if (path === '/api/v1/practice/exercises') return route.fulfill({ json: [{ id: 'test', fen: start, instruction: 'Test move' }] });
      if (path.endsWith('/attempt')) {
        moves.push(route.request().postDataJSON().move_uci);
        return route.fulfill({ json: { result: 'incorrect', fen: start, feedback: null } });
      }
      return route.fulfill({ status: 404 });
    });
    await page.goto(`${baseURL}/settings`);
    assert.equal(await page.getByLabel('Text size').inputValue(), 'normal');
    assert.equal(await page.getByLabel('Show legal-move markers').isChecked(), true);
    const originalSize = await page.locator('h1').evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
    await page.getByLabel('Text size').selectOption('larger');
    assert.ok(await page.locator('h1').evaluate((element) => parseFloat(getComputedStyle(element).fontSize)) > originalSize);
    await page.getByLabel('Show legal-move markers').uncheck();
    await page.reload();
    assert.equal(await page.getByLabel('Text size').inputValue(), 'larger');
    assert.equal(await page.getByLabel('Show legal-move markers').isChecked(), false);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.goto(`${baseURL}/lessons`);
    await page.getByRole('button', { name: 'Lesson 1: Test move' }).click();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.locator('[data-square="e2"]').click();
    assert.equal(await page.locator('[data-square="e4"] [style*="radial-gradient"]').count(), 0);
    await page.locator('[data-square="e4"]').click();
    await page.getByText('Not quite. Try another move.').waitFor();
    assert.deepEqual(moves, ['e2e4']);
    await page.goto(`${baseURL}/settings`);
    await page.getByLabel('Show legal-move markers').check();
    await page.getByLabel('Text size').selectOption('normal');
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto(`${baseURL}/lessons`);
    await page.getByRole('button', { name: 'Lesson 1: Test move' }).click();
    await page.locator('[data-square="e2"]').click();
    await page.locator('[data-square="e4"] [style*="radial-gradient"]').waitFor();
    await page.locator('[data-square="e4"]').click();
    await page.getByText('Not quite. Try another move.').waitFor();
    assert.deepEqual(moves, ['e2e4', 'e2e4']);
    console.log('Settings browser test passed.');
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exit(1); });
