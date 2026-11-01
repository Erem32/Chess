import assert from "node:assert/strict";
import test from "node:test";
import { createGameRefresh } from "./gamePolling.js";

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

test("polling ignores older and live-event-stale responses", async () => {
  const requests = [];
  const revisionRef = { current: 0 };
  let game = { status: "active", current_fen: "initial" };
  const poll = createGameRefresh({
    gameId: 1, revisionRef,
    getGame: () => { const request = deferred(); requests.push(request); return request.promise; },
    setGame: (update) => { game = update(game); },
  });
  const first = poll.refresh();
  const second = poll.refresh();
  requests[1].resolve({ status: "active", current_fen: "new" });
  await second;
  requests[0].resolve({ status: "active", current_fen: "old" });
  await first;
  assert.equal(game.current_fen, "new");
  const third = poll.refresh();
  revisionRef.current += 1;
  requests[2].resolve({ status: "active", current_fen: "stale" });
  await third;
  assert.equal(game.current_fen, "new");
  const fourth = poll.refresh();
  poll.dispose();
  requests[3].resolve({ status: "active", current_fen: "after-disposal" });
  await fourth;
  assert.equal(game.current_fen, "new");
});

test("polling keeps the current game after errors or late active responses", async () => {
  let game = { status: "draw" };
  const poll = createGameRefresh({
    gameId: 1, revisionRef: { current: 0 },
    getGame: async () => ({ status: "active" }),
    setGame: (update) => { game = update(game); },
  });
  await poll.refresh();
  assert.equal(game.status, "draw");
  const failed = createGameRefresh({
    gameId: 1, revisionRef: { current: 0 },
    getGame: async () => { throw new Error("offline"); },
    setGame: () => { assert.fail("failed polling must not update state"); },
  });
  await failed.refresh();
});
