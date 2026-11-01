import assert from "node:assert/strict";
import test from "node:test";
import { createReconnectScheduler } from "./reconnectScheduler.js";

test("retries grow and a stable connection resets the retry sequence", () => {
  const attempts = [];
  const timers = [];
  let currentTime = 1000;
  let calls = 0;
  const retries = createReconnectScheduler(() => { calls += 1; }, {
    now: () => currentTime,
    delayForAttempt: (attempt) => { attempts.push(attempt); return attempt * 100; },
    schedule: (callback, delay) => { timers.push({ callback, delay }); return timers.length; },
    cancel: () => {},
  });
  retries.retry(0);
  retries.retry(0);
  assert.deepEqual(attempts, [0, 1]);
  assert.deepEqual(timers.map((timer) => timer.delay), [0, 100]);
  timers[1].callback();
  assert.equal(calls, 1);
  currentTime = 31000;
  retries.retry(1000);
  assert.deepEqual(attempts, [0, 1, 0]);
  retries.resetAttempts();
  retries.retry(0);
  assert.equal(attempts.at(-1), 0);
});

test("cleanup cancels the scheduled retry once", () => {
  const cancelled = [];
  const retries = createReconnectScheduler(() => assert.fail("unexpected retry"), {
    delayForAttempt: () => 500,
    schedule: () => 123,
    cancel: (timer) => cancelled.push(timer),
  });
  retries.retry(0);
  retries.cancelRetry();
  retries.cancelRetry();
  assert.deepEqual(cancelled, [123]);
});
