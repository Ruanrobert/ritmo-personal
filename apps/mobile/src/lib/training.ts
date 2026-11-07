import { exercises, program } from "./demo-data";
import type { Exercise, ExerciseLog, Prescription, Program, WorkoutDay, WorkoutSession } from "./types";

export const WEEKDAY_SHORT = ["S", "T", "Q", "Q", "S", "S", "D"];

/** 1 = segunda ... 7 = domingo */
export function isoWeekday(date = new Date()) {
  return ((date.getDay() + 6) % 7) + 1;
}

export function findExercise(id: string): Exercise | undefined {
  return exercises.find(item => item.id === id);
}

export function findDay(dayId: string | undefined, source: Program = program): WorkoutDay {
  return source.days.find(day => day.id === dayId) ?? todayOrNextDay(source).day;
}

/** Ficha de hoje; se hoje for descanso, retorna a próxima da semana. */
export function todayOrNextDay(source: Program = program, date = new Date()): { day: WorkoutDay; isToday: boolean } {
  const today = isoWeekday(date);
  const exact = source.days.find(day => day.weekday === today);
  if (exact) return { day: exact, isToday: true };
  const sorted = [...source.days].sort((a, b) => ((a.weekday - today + 7) % 7) - ((b.weekday - today + 7) % 7));
  return { day: sorted[0], isToday: false };
}

export function formatReps(item: Prescription) {
  return item.repsMin === item.repsMax ? `${item.repsMin}` : `${item.repsMin}–${item.repsMax}`;
}

export function formatLoad(loadKg: number, perSide = false) {
  if (!loadKg) return "Peso corporal";
  const value = Number.isInteger(loadKg) ? `${loadKg}` : loadKg.toFixed(1).replace(".", ",");
  return perSide ? `${value} kg/lado` : `${value} kg`;
}

export function parseLoad(text: string) {
  const value = Number(text.replace(",", "."));
  return Number.isFinite(value) && value >= 0 ? Math.round(value * 10) / 10 : 0;
}

export function daysBetween(fromIso: string, to = new Date()) {
  const from = new Date(`${fromIso}T00:00:00`);
  const start = new Date(to); start.setHours(0, 0, 0, 0);
  return Math.round((from.getTime() - start.getTime()) / 86400000);
}

export function programStatus(source: Program = program) {
  const remaining = daysBetween(source.endsOn);
  const total = Math.max(1, daysBetween(source.endsOn, new Date(`${source.startsOn}T00:00:00`)));
  const elapsed = Math.min(total, Math.max(0, total - remaining));
  return { remaining, progress: elapsed / total, expired: remaining < 0, endingSoon: remaining >= 0 && remaining <= 7 };
}

export function formatDate(iso: string, options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "2-digit" }) {
  return new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString("pt-BR", options);
}

/** "Executado N vezes, última em dd/mm" — calculado das sessões salvas. */
export function dayStats(sessions: WorkoutSession[], dayId: string) {
  const done = sessions.filter(session => session.dayId === dayId);
  return { count: done.length, last: done[0]?.completedAt };
}

export function startOfWeek(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (isoWeekday(start) - 1));
  return start;
}

/** Dias (1..7) treinados na semana corrente. */
export function trainedWeekdays(sessions: WorkoutSession[], date = new Date()) {
  const start = startOfWeek(date);
  return new Set(sessions.filter(session => new Date(session.completedAt) >= start).map(session => isoWeekday(new Date(session.completedAt))));
}

/** Semanas consecutivas (incluindo a atual, se já houver treino) com pelo menos 1 sessão. */
export function weekStreak(sessions: WorkoutSession[], date = new Date()) {
  const weeks = new Set(sessions.map(session => startOfWeek(new Date(session.completedAt)).getTime()));
  let cursor = startOfWeek(date);
  if (!weeks.has(cursor.getTime())) cursor = new Date(cursor.getTime() - 7 * 86400000);
  let streak = 0;
  while (weeks.has(cursor.getTime())) { streak += 1; cursor = new Date(cursor.getTime() - 7 * 86400000); }
  return streak;
}

function logsFor(sessions: WorkoutSession[], exerciseId: string): { log: ExerciseLog; date: string }[] {
  return sessions.flatMap(session => session.logs.filter(log => log.exerciseId === exerciseId).map(log => ({ log, date: session.completedAt })));
}

export function maxLoadOf(log: ExerciseLog) {
  if (typeof log.maxLoadKg === "number") return log.maxLoadKg;
  if (log.setLogs?.length) return Math.max(...log.setLogs.map(set => set.loadKg));
  return log.loadKg;
}

/** Último desempenho registrado do exercício, formatado para a ficha. */
export function lastPerformance(sessions: WorkoutSession[], exerciseId: string) {
  const entry = logsFor(sessions, exerciseId)[0];
  if (!entry) return undefined;
  const sets = entry.log.setLogs ?? [];
  const summary = sets.length ? `${sets.length}× ${sets.map(set => set.reps).join("/")} @ ${formatLoad(maxLoadOf(entry.log))}` : `${entry.log.sets}× ${entry.log.reps} @ ${formatLoad(entry.log.loadKg)}`;
  return { summary, date: entry.date, log: entry.log };
}

/** Recorde pessoal (maior carga) do exercício. */
export function personalRecord(sessions: WorkoutSession[], exerciseId: string) {
  const loads = logsFor(sessions, exerciseId).map(entry => maxLoadOf(entry.log));
  return loads.length ? Math.max(...loads) : 0;
}

/**
 * Progressão dupla: se nas duas últimas sessões todas as séries atingiram o máximo
 * da faixa de repetições, sugere aumentar a carga (2,5 kg; 1 kg para carga por lado ≤ 10 kg).
 */
export function suggestLoad(sessions: WorkoutSession[], item: Prescription) {
  const recent = logsFor(sessions, item.exerciseId).slice(0, 2);
  const lastLoad = recent[0] ? maxLoadOf(recent[0].log) : item.loadKg;
  const base = Math.max(lastLoad, item.loadKg);
  if (!base || recent.length < 2) return { loadKg: base, increased: false };
  const hitTop = recent.every(({ log }) => (log.setLogs?.length ?? 0) >= item.sets && (log.setLogs ?? []).every(set => set.reps >= item.repsMax && set.loadKg >= base));
  if (!hitTop) return { loadKg: base, increased: false };
  const step = item.loadPerSide && base <= 10 ? 1 : 2.5;
  return { loadKg: Math.round((base + step) * 10) / 10, increased: true };
}

/** Série histórica numérica (maior carga por sessão) para gráficos. */
export function loadSeries(sessions: WorkoutSession[], exerciseId: string) {
  return logsFor(sessions, exerciseId).map(entry => ({ date: entry.date, load: maxLoadOf(entry.log), reps: entry.log.reps })).reverse();
}
