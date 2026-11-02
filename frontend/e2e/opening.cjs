const { chromium } = require('playwright-core');
const assert = require('node:assert/strict');
const baseURL = process.env.CHESS_E2E_FRONTEND_URL;
const chromePath = process.env.CHROME_PATH;
if (!baseURL || !chromePath) throw new Error('Set CHESS_E2E_FRONTEND_URL and CHROME_PATH.');

(async () => {
  const browser = await chromium.launch({ executablePath: chromePath, headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.addInitScript(() => localStorage.setItem('access_token', 'test-token'));
    let unavailable = true;
    let catalog = [];
    await page.route('**/api/v1/**', async (route) => {
      const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization,content-type', 'access-control-allow-methods': 'GET,OPTIONS' };
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
      const path = new URL(route.request().url()).pathname;
      if (path === '/api/v1/users/me') return route.fulfill({ json: { id: 1, username: 'learner' }, headers: cors });
      if (path === '/api/v1/opening/catalog') return unavailable ? route.fulfill({ status: 503, headers: cors }) : route.fulfill({ json: catalog, headers: cors });
      return route.fulfill({ status: 404 });
    });
    await page.goto(`${baseURL}/opening`);
    await page.getByText(/Could not load opening guides/).waitFor();
    unavailable = false;
    await page.getByRole('button', { name: 'Retry' }).click();
    await page.getByText('No opening guides are available yet.').waitFor();
    catalog = [{ id: 'italian-game', title: 'Italian Game', line: 'Giuoco Piano', introduction: 'Start here.',
      ideas: ['Develop pieces.'], video_url: null, steps: [
        { fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', move: null, explanation: 'Starting position.' },
        { fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1', move: 'e4', explanation: 'White moves.' },
        { fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2', move: 'e5', explanation: 'Black replies.' }
      ] }, { id: 'sicilian-defense', title: 'Sicilian Defense', line: 'Najdorf', introduction: 'Another opening.',
      ideas: ['Fight for the centre.'], video_url: null, steps: [
        { fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', move: null, explanation: 'Start.' },
        { fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1', move: 'e4', explanation: 'First move.' },
        { fen: 'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2', move: 'c5', explanation: 'Black plays c5.' }
      ] }];
    await page.reload();
    const rows = page.locator('.opening-list .opening-row');
    assert.equal(await rows.count(), 2);
    await page.getByLabel('Find an opening').fill('Sicilian');
    assert.equal(await rows.count(), 1);
    await page.getByLabel('Find an opening').fill('');
    await page.getByRole('button', { name: /Italian Game, not completed/ }).click();
    assert.equal(await page.getByRole('link', { name: 'Watch an optional video' }).count(), 0);
    assert.equal(await page.getByRole('button', { name: 'Previous' }).isDisabled(), true);
    assert.equal(await page.locator('#game-board-square-e2 [role=button]').getAttribute('aria-disabled'), 'true');
    await page.getByRole('button', { name: 'Next move' }).click();
    await page.getByText('White moves.').waitFor();
    await page.getByRole('button', { name: 'Next move' }).click();
    assert.equal(await page.getByRole('button', { name: 'Next move' }).isDisabled(), true);
    await page.getByRole('button', { name: 'Previous' }).click();
    await page.getByText('White moves.').waitFor();
    await page.getByRole('button', { name: 'All openings' }).click();
    await page.getByText('1 of 2 completed', { exact: false }).waitFor();
    await page.getByRole('button', { name: 'Completed', exact: true }).click();
    assert.equal(await rows.count(), 1);
    await page.getByRole('button', { name: /Italian Game, completed, study again/ }).click();
    await page.getByText('Starting position.', { exact: true }).waitFor();
    catalog[0].video_url = 'https://example.com/video';
    await page.reload();
    await page.getByRole('button', { name: /Italian Game, completed, study again/ }).click();
    assert.equal(await page.getByRole('link', { name: 'Watch an optional video' }).getAttribute('href'), catalog[0].video_url);
    await page.goto(`${baseURL}/opening-guide`);
    await page.waitForURL('**/opening');
    assert.equal(await page.getByRole('link', { name: 'Opening', exact: true }).getAttribute('aria-current'), 'page');
    console.log('Opening study browser test passed.');
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exit(1); });
