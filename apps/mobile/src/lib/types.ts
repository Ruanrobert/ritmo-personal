export type ThemeChoice = "dark" | "light" | "system";

/** Item do catálogo de exercícios. Os campos de séries/carga são o padrão sugerido do catálogo. */
export type Exercise = {
  id: string;
  name: string;
  muscle: string;
  equipment: string;
  level: "Iniciante" | "Intermediário" | "Avançado";
  description: string;
  instructions: string[];
  sets: number;
  reps: string;
  restSeconds: number;
  targetLoad: number;
  videoUrl?: string;
};

/** Personal vinculado ao aluno (exibido na home e usado nos atalhos de contato). */
export type Trainer = {
  name: string;
  cref: string;
  whatsapp: string; // apenas dígitos com DDI, ex.: 5511999999999
  instagram: string; // sem @
};

/**
 * Prescrição de um exercício dentro de uma ficha.
 * Carga é sempre numérica (kg) — evita textos como "15-15" que quebram gráficos.
 */
export type Prescription = {
  exerciseId: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  loadKg: number;
  loadPerSide: boolean; // true = carga por lado/halter
  restSeconds: number;
  note?: string;
};

/** Ficha de um dia do programa (ex.: Segunda · Peito, ombro e tríceps). */
export type WorkoutDay = {
  id: string;
  label: string;
  title: string;
  weekday: number; // 1 = segunda ... 7 = domingo
  items: Prescription[];
};

/** Programa com validade definido pelo personal. */
export type Program = {
  id: string;
  name: string;
  goal: string;
  level: string;
  startsOn: string; // YYYY-MM-DD
  endsOn: string; // YYYY-MM-DD
  generalNotes: string;
  days: WorkoutDay[];
};

export type SetLog = { reps: number; loadKg: number };

export type ExerciseLog = {
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: string;
  loadKg: number;
  setLogs?: SetLog[];
  maxLoadKg?: number;
};

export type WorkoutSession = {
  id: string;
  name: string;
  dayId?: string;
  completedAt: string;
  durationMinutes: number;
  rating: number;
  rpe?: number; // esforço percebido 1–10
  pain?: boolean;
  note?: string;
  logs: ExerciseLog[];
};

/** Medidas corporais estruturadas (substituem foto de ficha em papel). */
export type BodyMeasurement = {
  id: string;
  date: string; // ISO
  weightKg?: number;
  chestCm?: number;
  waistCm?: number;
  hipCm?: number;
  armCm?: number;
  thighCm?: number;
};

export type PersistedAppState = {
  theme: ThemeChoice;
  displayName: string;
  favorites: string[];
  sessions: WorkoutSession[];
  videos: Record<string, string>;
  measurements: BodyMeasurement[];
  uiVersion?: number;
};
