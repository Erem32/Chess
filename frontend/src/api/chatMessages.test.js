import test from "node:test";
import assert from "node:assert/strict";
import { mergeChatMessages, olderChatPage } from "./chatMessages.js";

test("chat history and concurrent live events merge in order without duplicates", () => {
  const result = mergeChatMessages([{ id: 3, message: "live" }], [
    { id: 1, message: "first" }, { id: 3, message: "stored" }, { id: 2, message: "second" }
  ]);
  assert.deepEqual(result.map((message) => message.id), [1, 2, 3]);
});

test("chat retains only the newest 100 valid messages", () => {
  const result = mergeChatMessages([], Array.from({ length: 102 }, (_, i) => ({ id: i + 1 })));
  assert.equal(result.length, 100);
  assert.equal(result[0].id, 3);
  assert.equal(result.at(-1).id, 102);
});

test("older chat pages are sorted, deduplicated and keep the current view at the end", () => {
  const current = [{ id: 101 }];
  const next = olderChatPage(current, [{ id: 2 }, { id: 1 }, { id: 2 }]);
  assert.deepEqual(next.page.map((item) => item.id), [1, 2]);
  assert.equal(next.hasOlder, false);
  const end = olderChatPage(current, []);
  assert.equal(end.page, current);
  assert.equal(end.hasOlder, false);
  assert.equal(olderChatPage(current, Array.from({ length: 100 }, (_, i) => ({ id: i + 1 }))).hasOlder, true);
});
