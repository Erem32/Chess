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
    for (const width of [320, 390, 768, 1280]) {
      await page.setViewportSize({ width, height: 800 });
      for (const label of ['lessons', 'puzzles', 'opening', 'examples']) {
        assert.equal(await page.getByRole('button', { name: `Open ${label}`, exact: true }).isVisible(), true);
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Dashboard overflows at ${width}px`);
    }
    for (const [label, path] of [['lessons', '/lessons'], ['puzzles', '/puzzles'], ['opening', '/opening'], ['examples', '/examples']]) {
      await page.goto(`${baseURL}/dashboard`);
      await page.getByRole('button', { name: `Open ${label}`, exact: true }).click();
      await page.waitForURL(`${baseURL}${path}`);
    }
    await page.goto(`${baseURL}/lessons`);
    assert.equal(await page.getByRole('link', { name: 'Lessons', exact: true }).getAttribute('aria-current'), 'page');
    await page.getByRole('button', { name: /Lesson 1: Pawn/ }).click();
    await page.locator('[data-square="e2"]').click();
    await page.locator('[data-square="e4"]').click();
    await page.getByText('A pawn can move two squares from its starting position.').waitFor();
    await page.getByRole('button', { name: 'All lessons' }).click();
    await page.getByRole('button', { name: 'Lesson 11: Kingside castling' }).click();
    await page.locator('[data-square="e1"]').click();
    await page.locator('[data-square="g1"]').click();
    await page.getByText('Correct. The king goes to g1 and the rook moves from h1 to f1.').waitFor();
    await page.getByRole('button', { name: 'All lessons' }).click();
    await page.getByRole('button', { name: 'Lesson 13: En passant' }).click();
    await page.locator('[data-square="e5"]').click();
    await page.locator('[data-square="d6"]').click();
    await page.getByText('Correct. The pawn lands on d6 and the black pawn on d5 is removed.').waitFor();
    await page.getByRole('button', { name: 'All lessons' }).click();
    await page.getByRole('button', { name: 'Lesson 15: Choose a knight' }).click();
    await page.locator('[data-square="a7"]').click();
    await page.locator('[data-square="a8"]').click();
    await page.getByRole('button', { name: 'Knight', exact: true }).click();
    await page.getByText('Correct. A promotion may produce a queen, rook, bishop or knight.').waitFor();
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
    await page.goto(`${baseURL}/examples`);
    await page.getByRole('button', { name: 'En passant', exact: true }).click();
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByText(/The e5 pawn lands on d6/).waitFor();
    await page.getByRole('button', { name: 'All examples' }).click();
    await page.getByRole('button', { name: 'A knight fork', exact: true }).click();
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByText('Ne6+ checks the king on g7 and attacks the queen on c7.').waitFor();
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
