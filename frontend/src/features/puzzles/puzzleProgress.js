const KEY_PREFIX = "puzzles:completed:v1:user:";

function keyFor(userId) {
  return userId == null ? null : `${KEY_PREFIX}${String(userId)}`;
}

export function loadPuzzleProgress(storage, userId) {
  const key = keyFor(userId);
  const normalizedId = userId == null ? null : String(userId);
  if (!storage || !key) return { userId: normalizedId, completed: [], persistent: false };
  try {
    const raw = storage.getItem(key);
    const value = raw === null ? [] : JSON.parse(raw);
    if (!Array.isArray(value) || !value.every((id) => typeof id === "string")) throw new TypeError("Invalid puzzle progress");
    return { userId: normalizedId, completed: [...new Set(value)], persistent: true };
  } catch {
    return { userId: normalizedId, completed: [], persistent: false };
  }
}

export function savePuzzleProgress(storage, userId, completed) {
  const key = keyFor(userId);
  if (!storage || !key) return false;
  try {
    storage.setItem(key, JSON.stringify([...new Set(completed)]));
    return true;
  } catch {
    return false;
  }
}
