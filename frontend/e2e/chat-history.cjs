// Run only against a disposable backend and database: this creates users and messages.
const { chromium } = require('playwright-core');
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');

const frontend = process.env.CHESS_E2E_FRONTEND_URL;
const api = process.env.CHESS_E2E_API_URL;
const ws = process.env.CHESS_E2E_WS_URL;
const chromePath = process.env.CHROME_PATH;
if (process.env.CHESS_E2E_ALLOW_REGISTRATION !== '1' || !frontend || !api || !ws || !chromePath) {
  throw new Error('Set CHESS_E2E_ALLOW_REGISTRATION=1, CHESS_E2E_FRONTEND_URL, CHESS_E2E_API_URL, CHESS_E2E_WS_URL and CHROME_PATH for a disposable environment.');
}

(async () => {
  const browser = await chromium.launch({ executablePath: chromePath, headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const suffix = randomBytes(5).toString('hex');
  try {
    async function request(path, body, token) {
      const response = await fetch(`${api}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
      return response.json();
    }
    async function register(name) {
      await request('/api/v1/auth/register', { username: name, email: `${name}@example.com`, password: 'test-password' });
      return (await request('/api/v1/auth/login', { username_or_email: name, password: 'test-password' })).access_token;
    }
    const viewer = await register(`viewer${suffix}`);
    const sender = await register(`sender${suffix}`);
    await request('/api/v1/matchmaking/join', {}, viewer);
    const gameId = (await request('/api/v1/matchmaking/join', {}, sender)).game_id;

    // Seed messages through the actual WebSocket so persistence and broadcast follow normal paths.
    await page.goto(frontend);
    async function sendMessages(first, last) {
      await page.evaluate(({ ws, gameId, token, first, last }) => new Promise((resolve, reject) => {
        const socket = new WebSocket(`${ws}/ws/games/${gameId}?token=${encodeURIComponent(token)}`);
        const timer = setTimeout(() => { socket.close(); reject(new Error('Chat seed timed out')); }, 30000);
        let acknowledged = 0;
        socket.onerror = () => { clearTimeout(timer); reject(new Error('Chat seed socket failed')); };
        socket.onopen = () => {
          for (let i = first; i <= last; i++) socket.send(JSON.stringify({ type: 'chat', payload: { message: `Message ${i}` } }));
        };
        socket.onmessage = ({ data }) => {
          const event = JSON.parse(data);
          if (event.type === 'error') { clearTimeout(timer); socket.close(); reject(new Error(event.payload.message)); }
          if (event.type === 'chat' && ++acknowledged === last - first + 1) { clearTimeout(timer); socket.close(); resolve(); }
        };
      }), { ws, gameId, token: sender, first, last });
    }
    await sendMessages(1, 205);
    await page.evaluate((token) => localStorage.setItem('access_token', token), viewer);
    await page.goto(`${frontend}/games/${gameId}`);
    const chat = page.locator('.desktop-game-sidebar .chat-panel').first();
    const chatMessage = (number) => chat.locator('.chat-messages p').filter({ hasText: new RegExp(`Message ${number}$`) });
    await chatMessage(205).waitFor();
    assert.equal(await chat.locator('.chat-messages p').count(), 100);
    await chat.getByRole('button', { name: 'Older messages' }).click();
    await chatMessage(6).waitFor();
    assert.equal(await chat.locator('.chat-messages p').count(), 100);
    assert.equal(await chatMessage(105).count(), 1);
    await sendMessages(206, 206);
    assert.equal(await chatMessage(206).count(), 0);

    let failed = false;
    await page.route('**/api/v1/games/*/chat?*', async (route) => {
      if (!failed && new URL(route.request().url()).searchParams.has('before_id')) {
        failed = true;
        await route.abort();
      } else await route.continue();
    });
    await chat.getByRole('button', { name: 'Older messages' }).click();
    await chat.getByRole('alert').filter({ hasText: 'Could not load older messages' }).waitFor();
    assert.equal(await chatMessage(6).count(), 1);
    await chat.getByRole('button', { name: 'Older messages' }).click();
    await chatMessage(1).waitFor();
    assert.equal(await chat.locator('.chat-messages p').count(), 5);
    await chat.getByText('No earlier messages.').waitFor();
    await chat.getByRole('button', { name: 'Latest messages' }).click();
    await chatMessage(206).waitFor();
    assert.equal(await chat.locator('.chat-messages p').count(), 100);
    console.log('Chat history smoke passed: older pages, live arrival, retry, end of history and return to latest.');
  } finally {
    await context.close();
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exit(1); });
