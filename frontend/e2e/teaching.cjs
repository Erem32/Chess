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
    const examples = [{ id: 'test', title: 'Test example', steps: [
      { fen: '7k/8/8/3p4/4P3/8/8/7K w - - 0 1', move: null, explanation: 'Starting position.' },
      { fen: '7k/8/8/3P4/8/8/8/7K b - - 0 1', move: 'exd5', explanation: 'The pawn captures.' }
    ] }];
    await page.route('**/api/v1/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/api/v1/users/me') return route.fulfill({ json: { id: 1, username: 'learner' } });
      if (path === '/api/v1/teaching-examples') return route.fulfill({ json: examples });
      return route.fulfill({ status: 404 });
    });
    await page.goto(`${baseURL}/examples`);
    await page.getByRole('button', { name: 'Test example' }).click();
    await page.getByText('Starting position.', { exact: true }).waitFor();
    assert.equal(await page.locator('#game-board-square-e4 [role=button]').getAttribute('aria-disabled'), 'true');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByText('The pawn captures.').waitFor();
    assert.equal(await page.getByRole('button', { name: 'Next' }).isDisabled(), true);
    await page.getByRole('button', { name: 'Previous' }).click();
    await page.getByText('Starting position.', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'All examples' }).click();
    await page.getByRole('button', { name: 'Test example' }).click();
    assert.equal(await page.getByRole('button', { name: 'Previous' }).isDisabled(), true);
    await page.getByRole('button', { name: 'All examples' }).click();
    examples.push(...Array.from({ length: 10 }, (_, index) => ({ ...examples[0], id: `example-${index}`, title: `Example ${index + 2}` })));
    await page.reload();
    await page.getByRole('button', { name: 'Test example' }).waitFor();
    const firstPageCount = await page.locator('.study-catalog-scroll .study-card').count();
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByRole('button', { name: `Example ${firstPageCount + 1}`, exact: true }).waitFor();
    await page.getByRole('button', { name: 'Previous', exact: true }).click();
    await page.getByRole('button', { name: 'Test example' }).waitFor();
    console.log('Teaching examples browser test passed.');
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exit(1); });
