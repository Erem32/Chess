import { createContext, useContext, useEffect, useState } from "react";
import { MOVE_GUIDANCE_KEY, readPreferences, savePreference, TEXT_SIZE_KEY } from "../features/settings/preferences.js";

const SettingsContext = createContext({ textSize: "normal", moveGuidance: true });

export function SettingsProvider({ children }) {
  const [preferences, setPreferences] = useState(() => readPreferences(window.localStorage));

  useEffect(() => {
    document.documentElement.dataset.textSize = preferences.textSize;
    savePreference(window.localStorage, TEXT_SIZE_KEY, preferences.textSize);
    savePreference(window.localStorage, MOVE_GUIDANCE_KEY, preferences.moveGuidance);
  }, [preferences]);

  const value = {
    ...preferences,
    setTextSize: (textSize) => setPreferences((current) => ({ ...current, textSize })),
    setMoveGuidance: (moveGuidance) => setPreferences((current) => ({ ...current, moveGuidance }))
  };
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  return useContext(SettingsContext);
}
