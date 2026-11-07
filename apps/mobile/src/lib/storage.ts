import AsyncStorage from "@react-native-async-storage/async-storage";
import { defaultState } from "./demo-data";
import type { PersistedAppState } from "./types";

const STORAGE_KEY = "ritmo.student-demo.v2";

export async function loadAppState(): Promise<PersistedAppState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const value = JSON.parse(raw) as Partial<PersistedAppState>;
    // Novo visual (v2): migra uma única vez para o tema claro.
    const migrated = value.uiVersion === 2 ? {} : { theme: "light" as const, uiVersion: 2 };
    return {
      ...defaultState,
      ...value,
      ...migrated,
      favorites: Array.isArray(value.favorites) ? value.favorites : [],
      sessions: Array.isArray(value.sessions) ? value.sessions : [],
      videos: value.videos && typeof value.videos === "object" ? value.videos : {},
      measurements: Array.isArray(value.measurements) ? value.measurements : [],
    };
  } catch {
    return defaultState;
  }
}

export async function saveAppState(state: PersistedAppState) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export async function clearAppState() {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
