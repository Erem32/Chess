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
      const size = await page.evaluate(() => ({ page: document.documentElement.scrollHeight, viewport: innerHeight, board: document.querySelector('.board-wrap').getBoundingClientRect().height }));
      assert.ok(size.page <= size.viewport + 1, `${label}: page ${size.page}px exceeds viewport ${size.viewport}px`);
      assert.ok(size.board >= 200, `${label}: board is too small`);
    }
    async function openingFits(label) {
      const size = await page.evaluate(() => {
        const board = document.querySelector('.board-wrap').getBoundingClientRect();
        const next = document.querySelector('.study-actions button:last-child').getBoundingClientRect();
        return { viewport: innerHeight, boardTop: board.top, boardBottom: board.bottom, boardHeight: board.height, nextTop: next.top, nextBottom: next.bottom };
      });
      assert.ok(size.boardHeight >= 200, `${label}: board is too small`);
      assert.ok(size.boardTop >= 0 && size.boardBottom <= size.viewport + 1, `${label}: board is outside the viewport`);
      assert.ok(size.nextTop >= 0 && size.nextBottom <= size.viewport + 1, `${label}: next control is outside the viewport`);
    }
    for (const viewport of [{ width: 1366, height: 768 }, { width: 1280, height: 720 }, { width: 768, height: 768 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport);
      await page.goto(`${baseURL}/examples`);
      await page.getByRole('button', { name: 'How a pawn captures' }).click();
      await page.getByText('A pawn captures one square diagonally forward.', { exact: false }).waitFor();
      await fits('example');
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await fits('example next');
      await page.goto(`${baseURL}/lessons`);
      await page.getByRole('button', { name: 'Lesson 1: Pawn' }).click();
      await fits('lesson');
      await page.locator('[data-square="e2"]').click();
      await page.locator('[data-square="e4"]').click();
      await page.getByText('A pawn can move two squares from its starting position.').waitFor();
      await fits('lesson feedback');
      await page.goto(`${baseURL}/puzzles`);
      await page.getByRole('button', { name: /Puzzle 1: White to move/ }).click();
      await page.getByRole('button', { name: 'Reveal solution' }).click();
      await page.getByText(/Solution: Rxd4/).waitFor();
      await fits('puzzle solution');
      await page.goto(`${baseURL}/opening`);
      await page.getByRole('button', { name: /Italian Game, not completed/ }).click();
      for (let step = 0; step < 6; step += 1) {
        await openingFits(`opening ${step}`);
        if (step < 5) await page.getByRole('button', { name: 'Next move', exact: true }).click();
      }
    }
    console.log('Board activities fit the tested desktop and phone viewports.');
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exit(1); });
