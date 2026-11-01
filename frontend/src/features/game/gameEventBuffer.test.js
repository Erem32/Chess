import assert from "node:assert/strict";
import test from "node:test";
import { createGameEventBuffer } from "./gameEventBuffer.js";

test("events are buffered until snapshot synchronization and then applied in order", () => {
  const applied = [];
  const buffer = createGameEventBuffer((event) => applied.push(event), () => true);
  buffer.receive(1);
  buffer.receive(2);
  assert.deepEqual(applied, []);
  assert.equal(buffer.synchronize(), true);
  buffer.receive(3);
  assert.deepEqual(applied, [1, 2, 3]);
});

test("a disconnected socket stops queued events and does not report synchronization", () => {
  const applied = [];
  let open = true;
  const buffer = createGameEventBuffer((event) => { applied.push(event); open = false; }, () => open);
  buffer.receive(1);
  buffer.receive(2);
  assert.equal(buffer.synchronize(), false);
  assert.deepEqual(applied, [1]);
});

test("a closed socket cannot report synchronization with an empty queue", () => {
  const buffer = createGameEventBuffer(() => assert.fail("unexpected event"), () => false);
  assert.equal(buffer.synchronize(), false);
});
