import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";

import { ApiError, apiRequest } from "../src/api/client.js";

const originalFetch = globalThis.fetch;
const originalLocalStorage = globalThis.localStorage;
const originalSessionStorage = globalThis.sessionStorage;

beforeEach(() => {
  globalThis.localStorage = { getItem: () => "stored-token" };
  globalThis.sessionStorage = { getItem: () => null };
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  globalThis.localStorage = originalLocalStorage;
  globalThis.sessionStorage = originalSessionStorage;
});

test("HTTP errors retain status for session decisions and keep server messages", async () => {
  globalThis.fetch = async (_url, options) => {
    assert.equal(options.headers.Authorization, "Bearer stored-token");
    return new Response(JSON.stringify({ detail: "Session expired" }), {
      status: 401, headers: { "Content-Type": "application/json" },
    });
  };
  await assert.rejects(apiRequest("/api/v1/users/me"), (error) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 401);
    assert.equal(error.message, "Session expired");
    return true;
  });
});

test("server failures retain status while network failures stay distinguishable", async () => {
  globalThis.fetch = async () => new Response("unavailable", { status: 503 });
  await assert.rejects(apiRequest("/api/v1/users/me"), (error) => error instanceof ApiError && error.status === 503);

  const networkError = new TypeError("Network error");
  globalThis.fetch = async () => { throw networkError; };
  await assert.rejects(apiRequest("/api/v1/users/me"), (error) => error === networkError);
});
