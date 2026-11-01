import assert from "node:assert/strict";
import test from "node:test";

import { getMyHistory } from "./games.js";

test("game history requests encode optional page size and cursor", async (t) => {
  const previousFetch = globalThis.fetch;
  const previousLocalStorage = globalThis.localStorage;
  const previousSessionStorage = globalThis.sessionStorage;
  t.after(() => {
    globalThis.fetch = previousFetch;
    globalThis.localStorage = previousLocalStorage;
    globalThis.sessionStorage = previousSessionStorage;
  });
  globalThis.localStorage = globalThis.sessionStorage = { getItem: () => null };
  const urls = [];
  globalThis.fetch = async (url) => {
    urls.push(url);
    return { ok: true, status: 200, headers: { get: () => "application/json" }, json: async () => ({ games: [] }) };
  };

  await getMyHistory();
  await getMyHistory({ limit: 5, beforeId: 42 });
  assert.equal(new URL(urls[0]).pathname, "/api/v1/games/my-history");
  assert.equal(new URL(urls[0]).search, "");
  assert.equal(new URL(urls[1]).search, "?limit=5&before_id=42");
});
