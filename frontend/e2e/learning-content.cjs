// Uses real learning content and registers a user; use a disposable database.
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
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const name = `learner${randomBytes(5).toString('hex')}`;
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
    await page.goto(`${baseURL}/lessons`);
    assert.equal(await page.getByRole('link', { name: 'Lessons', exact: true }).getAttribute('aria-current'), 'page');
    await page.getByRole('button', { name: /Lesson 1: Pawn/ }).click();
    await page.locator('[data-square="e2"]').click();
    await page.locator('[data-square="e4"]').click();
    await page.getByText('A pawn can move two squares from its starting position.').waitFor();
    await page.goto(`${baseURL}/puzzles`);
    assert.equal(await page.getByRole('link', { name: 'Puzzles', exact: true }).getAttribute('aria-current'), 'page');
    await page.getByRole('button', { name: /Puzzle 1: White to move/ }).click();
    await page.getByRole('button', { name: 'Reveal solution' }).click();
    await page.getByText(/Solution: d2d4/).waitFor();
    await page.goto(`${baseURL}/opening`);
    assert.equal(await page.getByRole('link', { name: 'Opening', exact: true }).getAttribute('aria-current'), 'page');
    await page.getByRole('button', { name: /Italian Game: developing the pieces/ }).click();
    await page.getByRole('heading', { name: 'Italian Game: developing the pieces' }).waitFor();
    for (let i = 0; i < 5; i += 1) await page.getByRole('button', { name: 'Next' }).click();
    await page.getByText(/bishop develops to c4/).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Next' }).isDisabled(), true);
    console.log('Learning content browser test passed.');
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exit(1); });
