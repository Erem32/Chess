// Component interaction test; the frontend dev server must be running.
const { chromium } = require('playwright-core');
const assert = require('node:assert/strict');
const baseURL = process.env.CHESS_E2E_FRONTEND_URL;
const chromePath = process.env.CHROME_PATH;
if (!baseURL || !chromePath) throw new Error('Set CHESS_E2E_FRONTEND_URL and CHROME_PATH.');

(async () => {
  const browser = await chromium.launch({ executablePath: chromePath, headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
    await page.goto(`${baseURL}/e2e/board-practice.html`);
    const square = (name) => page.locator(`[data-square="${name}"]`);
    const events = () => page.evaluate(() => window.boardEvents);
    const mode = async (name) => {
      await page.getByRole('button', { name, exact: true }).click();
      await page.waitForFunction((value) => document.querySelector('[data-testid="board-mode"]')?.textContent === value, name);
    };
    const clickMove = async (from, to) => { await square(from).click(); await square(to).click(); };
    const drag = async (from, x, y) => {
      const source = await square(from).boundingBox();
      await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2);
      await page.mouse.down();
      await page.mouse.move(x, y, { steps: 10 });
      await page.mouse.up();
    };

    await clickMove('e2', 'e5');
    assert.deepEqual(await events(), [{ type: 'invalid', sourceSquare: 'e2', targetSquare: 'e5' }]);
    await mode('online');
    await clickMove('e2', 'e5');
    assert.deepEqual(await events(), []);
    await mode('disabled');
    await clickMove('e2', 'e5');
    assert.deepEqual(await events(), []);
    await mode('practice');
    await square('e2').click();
    await square('d2').click();
    await square('d4').click();
    assert.deepEqual(await events(), [{ type: 'move', move: 'd2d4' }]);
    await page.reload();
    await clickMove('e2', 'e2');
    assert.deepEqual(await events(), []);
    const target = await square('e5').boundingBox();
    await drag('e2', target.x + target.width / 2, target.y + target.height / 2);
    assert.deepEqual(await events(), [{ type: 'invalid', sourceSquare: 'e2', targetSquare: 'e5' }]);
    await page.reload();
    await drag('e2', 5, 5);
    assert.deepEqual(await events(), []);
    await page.reload();
    await mode('capture');
    await clickMove('e4', 'd5');
    assert.deepEqual(await events(), [{ type: 'move', move: 'e4d5' }]);
    await mode('promotion');
    await clickMove('a7', 'a8');
    await page.getByRole('button', { name: 'Knight', exact: true }).click();
    assert.deepEqual(await events(), [{ type: 'move', move: 'a7a8n' }]);
    await mode('black');
    await clickMove('e7', 'e4');
    assert.deepEqual(await events(), [{ type: 'invalid', sourceSquare: 'e7', targetSquare: 'e4' }]);
    console.log('Board practice test passed: invalid click/drag, online and disabled guards, selection, off-board drop, capture and promotion.');
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exit(1); });
