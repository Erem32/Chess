// Uses real content and registers a user; run only against disposable data.
const { chromium } = require('playwright-core');
const { randomBytes } = require('node:crypto');
const assert = require('node:assert/strict');
const baseURL = process.env.CHESS_E2E_FRONTEND_URL;
const chromePath = process.env.CHROME_PATH;
if (process.env.CHESS_E2E_ALLOW_REGISTRATION !== '1' || !baseURL || !chromePath) {
  throw new Error('Set CHESS_E2E_ALLOW_REGISTRATION=1, CHESS_E2E_FRONTEND_URL and CHROME_PATH for a disposable environment.');
}

(async () => {
  const browser = await chromium.launch({ executablePath: chromePath, headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const name = `viewport${randomBytes(5).toString('hex')}`;
    await page.goto(`${baseURL}/register`);
    await page.getByLabel('Username', { exact: true }).fill(name);
    await page.getByLabel('Email', { exact: true }).fill(`${name}@example.com`);
    await page.getByLabel('Password', { exact: true }).fill('test-password');
    await page.getByRole('button', { name: 'Register', exact: true }).click();
    await page.getByRole('heading', { name: 'Login' }).waitFor();
    await page.getByLabel('Username or email').fill(name);
    await page.getByLabel('Password', { exact: true }).fill('test-password');
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    await page.getByRole('heading', { name: `Welcome, ${name}` }).waitFor();
    async function fits(label) {
      const size = await page.evaluate(() => ({ page: document.documentElement.scrollHeight, viewport: innerHeight, width: innerWidth, board: document.querySelector('.board-wrap').getBoundingClientRect().height }));
      assert.ok(size.page <= size.viewport + 1, `${label}: page ${size.page}px exceeds viewport ${size.viewport}px`);
      assert.ok(size.board >= 200, `${label}: board is too small`);
      if (size.width >= 1600 && size.viewport >= 1000) assert.ok(size.board >= 680, `${label}: desktop board is only ${size.board}px`);
      else if (size.width >= 1400 && size.viewport >= 900) assert.ok(size.board >= 650, `${label}: desktop board is only ${size.board}px`);
    }
    async function openingFits(label) {
      const size = await page.evaluate(() => {
        const board = document.querySelector('.board-wrap').getBoundingClientRect();
        const next = document.querySelector('.study-actions button:last-child').getBoundingClientRect();
        return { viewport: innerHeight, width: innerWidth, boardTop: board.top, boardBottom: board.bottom, boardHeight: board.height, nextTop: next.top, nextBottom: next.bottom };
      });
      assert.ok(size.boardHeight >= 200, `${label}: board is too small`);
      if (size.width >= 1600 && size.viewport >= 1000) assert.ok(size.boardHeight >= 680, `${label}: desktop board is only ${size.boardHeight}px`);
      else if (size.width >= 1400 && size.viewport >= 900) assert.ok(size.boardHeight >= 650, `${label}: desktop board is only ${size.boardHeight}px`);
      assert.ok(size.boardTop >= 0 && size.boardBottom <= size.viewport + 1, `${label}: board is outside the viewport`);
      assert.ok(size.nextTop >= 0 && size.nextBottom <= size.viewport + 1, `${label}: next control is outside the viewport`);
    }
    async function hasNavigation(listName) {
      const navigation = page.getByRole('navigation', { name: 'Page navigation' });
      assert.equal(await navigation.getByRole('link', { name: 'Dashboard', exact: true }).getAttribute('href'), '/dashboard');
      assert.equal(await navigation.getByRole('button', { name: listName, exact: true }).isVisible(), true);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    }
    for (const viewport of [{ width: 1920, height: 1080 }, { width: 1440, height: 900 }, { width: 1366, height: 768 }, { width: 1280, height: 720 }, { width: 768, height: 768 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport);
      await page.goto(`${baseURL}/examples`);
      await page.getByRole('button', { name: 'How a pawn captures' }).click();
      await page.getByText('A pawn captures one square diagonally forward.', { exact: false }).waitFor();
      await hasNavigation('All examples');
      await fits('example');
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await fits('example next');
      await page.goto(`${baseURL}/lessons`);
      await page.getByRole('button', { name: 'Lesson 1: Pawn' }).click();
      await hasNavigation('All lessons');
      await fits('lesson');
      await page.locator('[data-square="e2"]').click();
      await page.locator('[data-square="e4"]').click();
      await page.getByText('A pawn can move two squares from its starting position.').waitFor();
      await fits('lesson feedback');
      await page.goto(`${baseURL}/puzzles`);
      await page.getByRole('button', { name: /Puzzle 1: White to move/ }).click();
      await hasNavigation('All puzzles');
      await page.getByRole('button', { name: 'Reveal solution' }).click();
      await page.getByText(/Solution: Rxd4/).waitFor();
      await fits('puzzle solution');
      await page.goto(`${baseURL}/opening`);
      await page.getByRole('button', { name: /Italian Game, not completed/ }).click();
      await hasNavigation('All openings');
      for (let step = 0; step < 6; step += 1) {
        await openingFits(`opening ${step}`);
        if (step < 5) await page.getByRole('button', { name: 'Next move', exact: true }).click();
      }
    }
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(`${baseURL}/lessons`);
    await page.getByRole('button', { name: 'Lesson 8: Knight jumps' }).click();
    await hasNavigation('All lessons');
    assert.ok((await page.locator('.board-wrap').boundingBox()).width >= 200);
    await page.getByRole('button', { name: 'All lessons', exact: true }).click();
    await page.getByRole('button', { name: 'Lesson 8: Knight jumps' }).waitFor();
    await page.getByRole('button', { name: 'Lesson 8: Knight jumps' }).click();
    await page.getByRole('link', { name: 'Dashboard', exact: true }).click();
    await page.waitForURL(`${baseURL}/dashboard`);
    console.log('Board activities fit the tested desktop and phone viewports.');
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exit(1); });
