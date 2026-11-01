// Run only against a disposable backend/database: this creates users and games.
const { chromium } = require('playwright-core');
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');

const baseURL = process.env.CHESS_E2E_FRONTEND_URL;
const apiURL = process.env.CHESS_E2E_API_URL;
const chromePath = process.env.CHROME_PATH;
if (process.env.CHESS_E2E_ALLOW_REGISTRATION !== '1' || !baseURL || !apiURL || !chromePath) {
  throw new Error('Set CHESS_E2E_ALLOW_REGISTRATION=1, CHESS_E2E_FRONTEND_URL, CHESS_E2E_API_URL, and CHROME_PATH for a disposable environment.');
}

async function request(path, { token, body } = {}) {
  const response = await fetch(`${apiURL}${path}`, {
    method: 'POST',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  if (!response.ok) throw new Error(`${path} failed: ${response.status} ${await response.text()}`);
  return response.json();
}

(async () => {
  const suffix = randomBytes(5).toString('hex');
  const names = [`histwhite${suffix}`, `histblack${suffix}`];
  const tokens = [];
  for (const name of names) {
    await request('/api/v1/auth/register', { body: { username: name, email: `${name}@example.com`, password: 'test-password' } });
    tokens.push((await request('/api/v1/auth/login', { body: { username_or_email: name, password: 'test-password' } })).access_token);
  }
  const ids = [];
  for (let i = 0; i < 22; i += 1) {
    await request('/api/v1/matchmaking/join', { token: tokens[0] });
    const match = await request('/api/v1/matchmaking/join', { token: tokens[1] });
    assert.equal(match.status, 'matched');
    ids.unshift(match.game_id);
    await request('/api/v1/games/my-active/abort', { token: tokens[0] });
  }

  const browser = await chromium.launch({ executablePath: chromePath, headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.goto(`${baseURL}/login`);
    await page.getByLabel('Username or email').fill(names[0]);
    await page.getByLabel('Password', { exact: true }).fill('test-password');
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    await page.getByRole('heading', { name: `Welcome, ${names[0]}` }).waitFor();
    await page.locator('.latest-game-row').first().waitFor();
    const displayed = async (selector) => (await page.locator(`${selector} strong`).allTextContents()).map((s) => Number(s.replace('Game #', '')));
    assert.deepEqual(await displayed('.latest-game-row'), ids.slice(0, 5));

    await page.getByRole('button', { name: 'View history' }).click();
    await page.locator('.history-row').first().waitFor();
    assert.deepEqual(await displayed('.history-row'), ids.slice(0, 20));
    let failed = false;
    await page.route('**/api/v1/games/my-history?*', async (route) => {
      if (!failed && new URL(route.request().url()).searchParams.has('before_id')) {
        failed = true;
        await route.fulfill({ status: 503, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': baseURL }, body: JSON.stringify({ detail: 'Temporary failure' }) });
      } else {
        await route.continue();
      }
    });
    await page.getByRole('button', { name: 'Load more' }).click();
    await page.getByRole('alert').getByText('Temporary failure', { exact: false }).waitFor();
    assert.deepEqual(await displayed('.history-row'), ids.slice(0, 20));
    await page.getByRole('button', { name: 'Retry loading more' }).click();
    await page.waitForFunction(() => document.querySelectorAll('.history-row').length === 22);
    assert.deepEqual(await displayed('.history-row'), ids);
    assert.equal(await page.getByRole('button', { name: 'Load more' }).count(), 0);
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    console.log('History pagination passed: dashboard limit, older page, failed request and retry without losing or duplicating games.');
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exit(1); });
