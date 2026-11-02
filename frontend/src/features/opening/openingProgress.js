const KEY_PREFIX = "opening-guide:completed:v1:user:";

function userKey(userId) {
  return userId == null ? null : `${KEY_PREFIX}${String(userId)}`;
}

export function loadOpeningProgress(storage, userId) {
  const key = userKey(userId);
  const normalizedUserId = userId == null ? null : String(userId);
  if (!storage || !key) return { userId: normalizedUserId, completed: [], persistent: false };

  try {
    const raw = storage.getItem(key);
    const value = raw === null ? [] : JSON.parse(raw);
    if (!Array.isArray(value) || !value.every((id) => typeof id === "string")) {
      throw new TypeError("Invalid opening progress");
    }
    return { userId: normalizedUserId, completed: [...new Set(value)], persistent: true };
  } catch {
    return { userId: normalizedUserId, completed: [], persistent: false };
  }
}

export function saveOpeningProgress(storage, userId, completed) {
  const key = userKey(userId);
  if (!storage || !key) return false;
  try {
    storage.setItem(key, JSON.stringify([...new Set(completed)]));
    return true;
  } catch {
    return false;
  }
}
