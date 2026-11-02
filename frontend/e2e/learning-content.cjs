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
    await page.getByText(/Solution: Rxd4/).waitFor();
    await page.getByText('Puzzle 1 / 103 · 0 solved').waitFor();
    await page.getByRole('button', { name: 'All puzzles' }).click();
    await page.getByRole('button', { name: 'Puzzle 4: White to move: find the best continuation.' }).click();
    await page.getByRole('button', { name: 'Hint', exact: true }).click();
    await page.getByText('Hint: consider the queen on d2.').waitFor();
    await page.locator('[data-square="d2"]').click();
    await page.locator('[data-square="d8"]').click();
    await page.getByText('Correct! Opponent played Qxd8. Find the next move.').waitFor();
    await page.getByRole('button', { name: 'Hint', exact: true }).click();
    await page.getByText('Hint: consider the rook on d1.').waitFor();
    await page.locator('[data-square="d1"]').click();
    await page.locator('[data-square="d8"]').click();
    await page.getByText('Puzzle solved!').waitFor();
    await page.reload();
    await page.getByText('1 / 103 solved').waitFor();
    await page.goto(`${baseURL}/opening`);
    assert.equal(await page.getByRole('link', { name: 'Opening', exact: true }).getAttribute('aria-current'), 'page');
    await page.getByRole('button', { name: /Italian Game, not completed/ }).click();
    await page.getByRole('heading', { name: 'Italian Game', level: 1 }).waitFor();
    for (let i = 0; i < 14; i += 1) await page.getByRole('button', { name: 'Next move' }).click();
    await page.getByText("Black places a rook behind the e5 pawn.").waitFor();
    assert.equal(await page.getByRole('button', { name: 'Next move' }).isDisabled(), true);
    await page.getByRole('button', { name: 'All openings' }).click();
    await page.getByRole('button', { name: /Italian Game, completed, study again/ }).waitFor();
    console.log('Learning content browser test passed.');
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exit(1); });
