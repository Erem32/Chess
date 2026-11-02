export const TEXT_SIZE_KEY = "text_size";
export const MOVE_GUIDANCE_KEY = "move_guidance";

export function readPreferences(storage) {
  try {
    const textSize = storage.getItem(TEXT_SIZE_KEY);
    const guidance = storage.getItem(MOVE_GUIDANCE_KEY);
    return {
      textSize: ["normal", "large", "larger"].includes(textSize) ? textSize : "normal",
      moveGuidance: guidance === "false" ? false : true
    };
  } catch {
    return { textSize: "normal", moveGuidance: true };
  }
}

export function savePreference(storage, key, value) {
  try { storage.setItem(key, String(value)); } catch { /* Settings remain available for this session. */ }
}
