import assert from "node:assert/strict";
import test from "node:test";
import { createPendingChat } from "./pendingChat.js";

test("acknowledgements settle only the matching pending send", async () => {
  const pending = createPendingChat();
  const first = pending.send("one", () => {});
  const second = pending.send("two", () => {});
  assert.equal(pending.settle("one", null), true);
  await first;
  assert.equal(pending.settle("one", null), false);
  assert.equal(pending.settle("two", "Message rejected"), true);
  await assert.rejects(second, /Message rejected/);
});

test("disconnect and synchronous send errors preserve delivery uncertainty", async () => {
  const pending = createPendingChat();
  const first = pending.send("one", () => {});
  const second = pending.send("two", () => {});
  pending.rejectAll();
  await assert.rejects(first, /may have been delivered/);
  await assert.rejects(second, /may have been delivered/);
  await assert.rejects(pending.send("three", () => { throw new Error("socket closed"); }), /draft has been kept/);
});

test("unconfirmed sends time out and a late acknowledgement is ignored", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const pending = createPendingChat();
  const send = pending.send("one", () => {});
  t.mock.timers.tick(10000);
  await assert.rejects(send, /Message was not confirmed/);
  assert.equal(pending.settle("one", null), false);
});
