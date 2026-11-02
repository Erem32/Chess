// Uses real services and registers a user; run only against disposable data.
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
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const page = await context.newPage();
    const name = `mobile${randomBytes(5).toString('hex')}`;
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
    const menu = page.getByRole('button', { name: 'Menu', exact: true });
    assert.equal(await menu.getAttribute('aria-expanded'), 'false');
    await menu.tap();
    await page.getByRole('link', { name: 'Lessons', exact: true }).tap();
    await page.getByRole('heading', { name: 'Lessons', exact: true }).waitFor();
    assert.equal(await menu.getAttribute('aria-expanded'), 'false');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.getByRole('button', { name: 'Lesson 1: Pawn', exact: true }).tap();
    const order = await page.locator('.lesson-exercise').evaluate((element) => {
      const text = element.querySelector('.lesson-copy').getBoundingClientRect();
      const board = element.querySelector('.lesson-board').getBoundingClientRect();
      return text.top < board.top;
    });
    assert.equal(order, true);
    await page.locator('[data-square="e2"]').tap();
    await page.locator('[data-square="e4"]').tap();
    await page.getByText('A pawn can move two squares from its starting position.').waitFor();
    await page.getByRole('button', { name: 'Next lesson' }).tap();
    await page.getByText(/Knight: A knight moves/).waitFor();
    await menu.tap();
    await page.getByRole('link', { name: 'Settings', exact: true }).tap();
    await page.getByLabel('Show legal-move markers').uncheck();
    await page.reload();
    assert.equal(await page.getByLabel('Show legal-move markers').isChecked(), false);
    await menu.tap();
    await page.getByRole('link', { name: 'Puzzles', exact: true }).tap();
    await page.getByRole('button', { name: /Puzzle 1:/ }).tap();
    await page.getByRole('button', { name: 'Reveal solution' }).tap();
    await page.getByText(/Solution: d2d4/).waitFor();
    for (const width of [320, 390, 768, 1280]) {
      await page.setViewportSize({ width, height: 844 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Unexpected overflow at ${width}px`);
    }
    console.log('Mobile navigation and touch practice passed.');
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exit(1); });
