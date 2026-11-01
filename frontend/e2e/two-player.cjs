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
      await context.addInitScript(() => {
        const NativeWebSocket = window.WebSocket;
        window.__socketCount = 0;
        window.WebSocket = class extends NativeWebSocket {
          constructor(...args) {
            super(...args);
            window.__gameSocket = this;
            window.__socketCount += 1;
          }
        };
      });
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
    await white.evaluate(() => sessionStorage.removeItem('matchmaking_pending'));
    await white.reload();
    await white.getByText('Searching for another player').waitFor();
    await black.getByRole('button', { name: 'Join matchmaking' }).click();
    await Promise.all([white.waitForURL('**/games/*'), black.waitForURL('**/games/*')]);
    assert.equal(new URL(white.url()).pathname, new URL(black.url()).pathname);
    assert.equal(await white.getByLabel('Play a move').count(), 0);
    // Mobile panel choices must expose their selected state to assistive technology.
    await black.setViewportSize({ width: 390, height: 844 });
    const mobileNav = black.getByRole('region', { name: 'Game panels' });
    const playersTab = mobileNav.getByRole('button', { name: 'Players' });
    const movesTab = mobileNav.getByRole('button', { name: 'Moves' });
    const chatTab = mobileNav.getByRole('button', { name: 'Chat' });
    assert.equal(await playersTab.getAttribute('aria-pressed'), 'true');
    assert.equal(await movesTab.getAttribute('aria-pressed'), 'false');
    await movesTab.focus();
    await black.keyboard.press('Enter');
    assert.equal(await movesTab.getAttribute('aria-pressed'), 'true');
    assert.equal(await playersTab.getAttribute('aria-pressed'), 'false');
    await chatTab.focus();
    await black.keyboard.press('Space');
    assert.equal(await chatTab.getAttribute('aria-pressed'), 'true');
    assert.equal(await movesTab.getAttribute('aria-pressed'), 'false');
    assert.equal(await black.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await black.setViewportSize({ width: 1440, height: 900 });
    await white.waitForFunction(() => document.querySelector('#game-board-square-e2 [role=button]')?.getAttribute('aria-disabled') === 'false');
    await white.locator('[data-square="e2"]').click();
    await white.locator('[data-square="e4"]').click();
    for (const page of [white, black]) await page.getByText('e4', { exact: true }).first().waitFor();
    assert.equal(await white.locator('#game-board-square-g1 [role=button]').getAttribute('aria-disabled'), 'true');
    await black.waitForFunction(() => document.querySelector('#game-board-square-e7 [role=button]')?.getAttribute('aria-disabled') === 'false');
    await black.locator('[data-square="e7"]').click();
    await black.locator('[data-square="e5"]').click();
    for (const page of [white, black]) await page.getByText('e5', { exact: true }).first().waitFor();
    // A newer REST game state can arrive before its socket event. A mismatch
    // must trigger snapshot recovery rather than leave a stale board playable.
    const recoveryCount = await white.evaluate(() => window.__socketCount);
    const gamePath = new URL(white.url()).pathname;
    let alteredPoll = false;
    const alterPoll = async (route) => {
      if (!alteredPoll && new URL(route.request().url()).pathname === `/api/v1${gamePath}`) {
        alteredPoll = true;
        const response = await route.fetch();
        const body = await response.json();
        body.current_fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
        await route.fulfill({ response, json: body });
      } else await route.continue();
    };
    await white.route('**/api/v1/games/*', alterPoll);
    await white.waitForFunction((oldCount) => window.__socketCount > oldCount, recoveryCount, { timeout: 10000 });
    await white.unroute('**/api/v1/games/*', alterPoll);
    await white.waitForFunction(() => document.querySelector('#game-board-square-g1 [role=button]')?.getAttribute('aria-disabled') === 'false');
    const whiteChat = white.locator('.desktop-game-sidebar .chat-panel').first();
    const blackChat = black.locator('.desktop-game-sidebar .chat-panel').first();
    await whiteChat.getByLabel('Chat message').fill('Good game');
    await whiteChat.getByRole('button', { name: 'Send', exact: true }).click();
    await blackChat.getByText('Good game', { exact: false }).waitFor();
    const socketCount = await black.evaluate(() => window.__socketCount);
    await black.evaluate(() => window.__gameSocket.close());
    await black.waitForFunction((oldCount) => window.__socketCount > oldCount, socketCount, { timeout: 10000 });
    await black.getByText("Waiting for your opponent's move.").first().waitFor();
    await black.reload();
    await blackChat.getByText('Good game', { exact: false }).waitFor();
    async function move(page, from, to, number) {
      await page.waitForFunction((square) => document.querySelector(`[data-square="${square}"] [role=button]`)?.getAttribute('aria-disabled') === 'false', from);
      await page.locator(`[data-square="${from}"]`).click();
      await page.locator(`[data-square="${to}"]`).click();
      for (const participant of [white, black]) {
        await participant.waitForFunction((count) => document.querySelectorAll('.desktop-game-sidebar .move-list li').length >= count, number);
      }
    }
    await move(white, 'g1', 'f3', 3);
    await move(black, 'g8', 'f6', 4);
    await move(white, 'f3', 'g1', 5);
    await move(black, 'f6', 'g8', 6);
    await move(white, 'g1', 'f3', 7);
    await move(black, 'g8', 'f6', 8);
    await move(white, 'f3', 'g1', 9);
    const blackActions = black.locator('.desktop-game-sidebar').last();
    await blackActions.getByRole('button', { name: 'Check draw claim' }).click();
    const claim = blackActions.getByRole('region', { name: 'Draw claim' });
    await claim.getByLabel('Claim based on').selectOption('f6g8');
    await claim.getByRole('button', { name: 'Claim draw', exact: true }).click();
    await Promise.all([
      white.getByRole('heading', { name: 'Game over' }).waitFor(),
      black.getByRole('heading', { name: 'Game over' }).waitFor()
    ]);
    for (const page of [white, black]) await page.getByRole('button', { name: 'Back to dashboard' }).click();
    await white.getByRole('button', { name: 'Join matchmaking' }).click();
    await white.getByText('Searching for another player').waitFor();
    await black.getByRole('button', { name: 'Join matchmaking' }).click();
    await Promise.all([white.waitForURL('**/games/*'), black.waitForURL('**/games/*')]);
    await move(white, 'e2', 'e4', 1);
    // A claim check belongs to the current position; a late response must not
    // reopen its panel after the player moves.
    let releaseClaim;
    let claimStarted;
    const claimBlocked = new Promise((resolve) => { releaseClaim = resolve; });
    const claimRequestStarted = new Promise((resolve) => { claimStarted = resolve; });
    const delayClaim = async (route) => {
      const response = await route.fetch();
      claimStarted();
      await claimBlocked;
      await route.fulfill({ response });
    };
    await black.route('**/api/v1/games/*/draw-claims', delayClaim);
    await black.locator('.desktop-game-sidebar').last().getByRole('button', { name: 'Check draw claim' }).click();
    await claimRequestStarted;
    await black.waitForFunction(() => document.querySelector('[data-square="d7"] [role=button]')?.getAttribute('aria-disabled') === 'false');
    const source = await black.locator('[data-square="d7"]').boundingBox();
    const target = await black.locator('[data-square="d5"]').boundingBox();
    await black.mouse.move(source.x + source.width / 2, source.y + source.height / 2);
    await black.mouse.down();
    await black.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 10 });
    await black.mouse.up();
    for (const page of [white, black]) await page.getByText('d5', { exact: true }).first().waitFor();
    const lateClaimResponse = black.waitForResponse((response) => response.url().endsWith('/draw-claims'));
    releaseClaim();
    await lateClaimResponse;
    await black.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.equal(await black.getByRole('region', { name: 'Draw claim' }).count(), 0);
    await black.unroute('**/api/v1/games/*/draw-claims', delayClaim);
    await move(white, 'e4', 'd5', 3);
    for (const page of [white, black]) await page.getByText('exd5', { exact: true }).first().waitFor();
    await move(black, 'd8', 'd5', 4);
    for (const page of [white, black]) await page.getByText('Qxd5', { exact: true }).first().waitFor();
    black.once('dialog', (dialog) => dialog.dismiss());
    await black.getByRole('button', { name: 'Resign' }).first().click();
    assert.equal(await black.getByRole('heading', { name: 'Game over' }).count(), 0);
    black.once('dialog', (dialog) => dialog.accept());
    await black.getByRole('button', { name: 'Resign' }).first().click();
    await Promise.all([
      white.getByRole('heading', { name: 'Game over' }).waitFor(),
      black.getByRole('heading', { name: 'Game over' }).waitFor()
    ]);
    assert.equal(await black.getByRole('button', { name: 'Resign' }).count(), 0);
    console.log('Two-player smoke passed: registration, matchmaking, click moves and capture, dragging, chat, reconnect, draw claim and resignation.');
  } finally {
    for (const context of contexts) await context.close();
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exit(1); });
