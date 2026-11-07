import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useColorScheme } from "react-native";
import { defaultState } from "./demo-data";
import { loadAppState, saveAppState } from "./storage";
import type { BodyMeasurement, PersistedAppState, ThemeChoice, WorkoutSession } from "./types";

// `mint` é a cor de destaque principal (azul vivo) — nome mantido por compatibilidade.
const shared = { navy: "#283B57", navyDeep: "#1A2639", tile: "#33465F", onNavy: "#FFFFFF", onNavyMuted: "#B9C6D8", tabActive: "#5DB2FF" };
const palette = {
  dark: { ...shared, navy: "#22324A", navyDeep: "#131C2B", tile: "#2B3D57", bg: "#131C2B", card: "#1D2939", raised: "#26354A", line: "#2F3F55", text: "#F1F5FB", muted: "#A3B0C2", dim: "#73839A", mint: "#2D9BFF", blue: "#6CB6FF", blueDeep: "#1A3454", danger: "#FF7A85", warning: "#FFAE55", success: "#25C976" },
  light: { ...shared, bg: "#F3F6FB", card: "#FFFFFF", raised: "#EEF2F7", line: "#E3E9F1", text: "#1C2536", muted: "#5A6679", dim: "#8A96A8", mint: "#1487F2", blue: "#1487F2", blueDeep: "#E5F1FE", danger: "#E5484D", warning: "#EC8A12", success: "#1EC46C" },
};

type FitnessContextValue = {
  state: PersistedAppState;
  colors: (typeof palette)["dark"] | (typeof palette)["light"];
  ready: boolean;
  setTheme: (theme: ThemeChoice) => void;
  setDisplayName: (name: string) => void;
  toggleFavorite: (exerciseId: string) => void;
  setVideo: (exerciseId: string, url: string) => void;
  completeWorkout: (session: WorkoutSession) => void;
  addMeasurement: (measurement: BodyMeasurement) => void;
  removeMeasurement: (id: string) => void;
  resetDemo: () => void;
};

const FitnessContext = createContext<FitnessContextValue | null>(null);

export function FitnessProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedAppState>(defaultState);
  const [ready, setReady] = useState(false);
  const system = useColorScheme();

  useEffect(() => {
    let active = true;
    void loadAppState().then(saved => {
      if (active) {
        setState(saved.displayName === "Mirlan" ? { ...saved, displayName: "Ruan" } : saved);
        setReady(true);
      }
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (ready) void saveAppState(state);
  }, [ready, state]);

  const colors = palette[state.theme === "system" ? (system === "light" ? "light" : "dark") : state.theme];
  const value = useMemo<FitnessContextValue>(() => ({
    state,
    colors,
    ready,
    setTheme: theme => setState(current => ({ ...current, theme })),
    setDisplayName: displayName => setState(current => ({ ...current, displayName: displayName.trim().slice(0, 32) || "Ruan" })),
    toggleFavorite: exerciseId => setState(current => ({ ...current, favorites: current.favorites.includes(exerciseId) ? current.favorites.filter(id => id !== exerciseId) : [...current.favorites, exerciseId] })),
    setVideo: (exerciseId, url) => setState(current => {
      const videos = { ...current.videos };
      if (url) videos[exerciseId] = url;
      else delete videos[exerciseId];
      return { ...current, videos };
    }),
    completeWorkout: session => setState(current => ({ ...current, sessions: [session, ...current.sessions] })),
    addMeasurement: measurement => setState(current => ({ ...current, measurements: [measurement, ...current.measurements].sort((a, b) => b.date.localeCompare(a.date)) })),
    removeMeasurement: id => setState(current => ({ ...current, measurements: current.measurements.filter(item => item.id !== id) })),
    resetDemo: () => setState({ ...defaultState, theme: state.theme }),
  }), [state, colors, ready]);

  return <FitnessContext.Provider value={value}>{children}</FitnessContext.Provider>;
}

export function useFitness() {
  const context = useContext(FitnessContext);
  if (!context) throw new Error("useFitness deve ser usado dentro de FitnessProvider");
  return context;
}
