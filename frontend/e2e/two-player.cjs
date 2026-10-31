// Run only against a disposable backend and database: this registers two users.
const { chromium } = require('playwright-core');
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');

const baseURL = process.env.CHESS_E2E_FRONTEND_URL;
const chromePath = process.env.CHROME_PATH;
if (process.env.CHESS_E2E_ALLOW_REGISTRATION !== '1' || !baseURL || !chromePath) {
  throw new Error('Set CHESS_E2E_ALLOW_REGISTRATION=1, CHESS_E2E_FRONTEND_URL, and CHROME_PATH for a disposable environment.');
}

(async () => {
  const browser = await chromium.launch({ executablePath: chromePath, headless: true, args: ['--no-sandbox'] });
  const contexts = [];
  const suffix = randomBytes(5).toString('hex');
  try {
    async function register(name) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      contexts.push(context);
      const page = await context.newPage();
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
      return page;
    }
    const white = await register(`white${suffix}`);
    const black = await register(`black${suffix}`);
    await white.getByRole('button', { name: 'Join matchmaking' }).click();
    await white.getByText('Searching for another player').waitFor();
    await black.getByRole('button', { name: 'Join matchmaking' }).click();
    await Promise.all([white.waitForURL('**/games/*'), black.waitForURL('**/games/*')]);
    assert.equal(new URL(white.url()).pathname, new URL(black.url()).pathname);
    await white.waitForFunction(() => document.querySelector('#game-board-square-e2 [role=button]')?.getAttribute('aria-disabled') === 'false');
    await white.locator('[data-square="e2"]').click();
    await white.locator('[data-square="e4"]').click();
    for (const page of [white, black]) await page.getByText('e4', { exact: true }).first().waitFor();
    await black.waitForFunction(() => document.querySelector('#game-board-square-e7 [role=button]')?.getAttribute('aria-disabled') === 'false');
    await black.locator('[data-square="e7"]').click();
    await black.locator('[data-square="e5"]').click();
    for (const page of [white, black]) await page.getByText('e5', { exact: true }).first().waitFor();
    const whiteChat = white.locator('.desktop-game-sidebar .chat-panel').first();
    const blackChat = black.locator('.desktop-game-sidebar .chat-panel').first();
    await whiteChat.getByLabel('Chat message').fill('Good game');
    await whiteChat.getByRole('button', { name: 'Send', exact: true }).click();
    await blackChat.getByText('Good game', { exact: false }).waitFor();
    await black.reload();
    await blackChat.getByText('Good game', { exact: false }).waitFor();
    await black.getByRole('button', { name: 'Resign' }).first().click();
    await Promise.all([
      white.getByRole('heading', { name: 'Game over' }).waitFor(),
      black.getByRole('heading', { name: 'Game over' }).waitFor()
    ]);
    console.log('Two-player smoke passed: registration, matchmaking, moves by both players, chat, reload and resignation.');
  } finally {
    for (const context of contexts) await context.close();
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exit(1); });
