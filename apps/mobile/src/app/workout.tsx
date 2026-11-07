import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Linking, Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { Button, Card, Header, Ionicons, MaterialCommunityIcons, Screen, Tag, uiStyles } from "../components/ui";
import { LinearGradient } from "expo-linear-gradient";
import { isDeviceVideo, VideoPlayer } from "../components/video-player";
import { useFitness } from "../lib/fitness-context";
import { trainer } from "../lib/demo-data";
import { confirmAction, notify } from "../lib/dialogs";
import { findDay, findExercise, formatLoad, formatReps, lastPerformance, parseLoad, personalRecord, suggestLoad } from "../lib/training";
import type { ExerciseLog } from "../lib/types";

type SetEntry = { reps: string; load: string; done: boolean };
type SessionMap = Record<number, SetEntry[]>;

const RPE_HINT: Record<number, string> = { 1: "Muito leve", 3: "Leve", 5: "Moderado", 7: "Difícil", 8: "Muito difícil", 9: "Quase no limite", 10: "Máximo" };


export default function WorkoutScreen() {
  const { colors, state, completeWorkout } = useFitness();
  const params = useLocalSearchParams<{ day?: string }>();
  const day = useMemo(() => findDay(typeof params.day === "string" ? params.day : undefined), [params.day]);
  const items = useMemo(() => day.items.map(item => ({ item, exercise: findExercise(item.exerciseId)!, suggestion: suggestLoad(state.sessions, item), last: lastPerformance(state.sessions, item.exerciseId), pr: personalRecord(state.sessions, item.exerciseId) })).filter(entry => entry.exercise), [day, state.sessions]);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [entries, setEntries] = useState<SessionMap>(() => Object.fromEntries(items.map((entry, index) => [index, Array.from({ length: entry.item.sets }, () => ({ reps: String(entry.item.repsMax), load: entry.suggestion.loadKg ? String(entry.suggestion.loadKg).replace(".", ",") : "0", done: false }))])));
  const [restSeconds, setRestSeconds] = useState(0);
  const [timerPaused, setTimerPaused] = useState(false);
  const [startedAt] = useState(() => Date.now());
  const [rpe, setRpe] = useState(0);
  const [pain, setPain] = useState(false);
  const [note, setNote] = useState("");
  const [finished, setFinished] = useState(false);
  const [saved, setSaved] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [newRecords, setNewRecords] = useState<string[]>([]);

  const current = items[exerciseIndex];
  const currentSets = entries[exerciseIndex] ?? [];
  const doneCount = currentSets.filter(set => set.done).length;
  const totalSets = items.reduce((total, entry) => total + entry.item.sets, 0);
  const allDone = Object.values(entries).reduce((total, sets) => total + sets.filter(set => set.done).length, 0);

  useEffect(() => {
    if (restSeconds <= 0 || timerPaused || finished) return;
    const timer = setInterval(() => setRestSeconds(seconds => Math.max(0, seconds - 1)), 1000);
    return () => clearInterval(timer);
  }, [restSeconds, timerPaused, finished]);

  function changeSet(setIndex: number, change: Partial<SetEntry>) {
    setEntries(map => ({ ...map, [exerciseIndex]: map[exerciseIndex].map((set, index) => index === setIndex ? { ...set, ...change } : set) }));
  }

  function toggleDone(setIndex: number) {
    const wasDone = currentSets[setIndex].done;
    changeSet(setIndex, { done: !wasDone });
    setRestSeconds(wasDone ? 0 : current.item.restSeconds);
    setTimerPaused(false);
  }

  function finishWorkout() {
    if (allDone === 0) {
      notify("Nenhuma série marcada", "Marque ao menos uma série concluída para salvar no histórico.");
      return;
    }
    setDurationMinutes(Math.max(1, Math.round((Date.now() - startedAt) / 60000)));
    setFinished(true);
    setRestSeconds(0);
  }

  function saveSession() {
    const records: string[] = [];
    const logs: ExerciseLog[] = items.flatMap((entry, index) => {
      const completed = entries[index].filter(set => set.done).map(set => ({ reps: Number(set.reps) || 0, loadKg: parseLoad(set.load) }));
      if (completed.length === 0) return [];
      const maxLoadKg = Math.max(...completed.map(set => set.loadKg));
      if (maxLoadKg > 0 && maxLoadKg > entry.pr && entry.pr > 0) records.push(`${entry.exercise.name}: ${formatLoad(maxLoadKg, entry.item.loadPerSide)}`);
      const averageLoad = completed.reduce((sum, set) => sum + set.loadKg, 0) / completed.length;
      return [{ exerciseId: entry.exercise.id, exerciseName: entry.exercise.name, sets: completed.length, reps: completed.map(set => set.reps).join(" / "), loadKg: Math.round(averageLoad * 10) / 10, maxLoadKg, setLogs: completed }];
    });
    completeWorkout({ id: `${Date.now()}`, name: `${day.label} · ${day.title}`, dayId: day.id, completedAt: new Date().toISOString(), durationMinutes, rating: rpe ? Math.max(1, 6 - Math.ceil(rpe / 2)) : 0, rpe: rpe || undefined, pain, note: note.trim() || undefined, logs });
    setNewRecords(records);
    setSaved(true);
  }

  function requestExit() {
    if (allDone === 0) { router.back(); return; }
    confirmAction("Sair do treino?", "As séries marcadas só entram no histórico quando você salvar a conclusão.", "Sair", () => router.back());
  }

  async function openExerciseVideo() {
    const url = state.videos[current.exercise.id];
    if (!url) return;
    try {
      if (await Linking.canOpenURL(url)) await Linking.openURL(url);
      else Alert.alert("Link indisponível", "Não foi possível abrir o vídeo neste aparelho.");
    } catch { Alert.alert("Não foi possível abrir", "Confira o link salvo para este exercício."); }
  }

  if (!current) return <Screen showTabs={false} title="Ficha vazia" subtitle="Esta ficha ainda não tem exercícios." back><View style={uiStyles.row}><Button label="Voltar" onPress={() => router.back()} /></View></Screen>;

  if (finished) return <Screen showTabs={false} bare contentStyle={styles.finishPage}>
    <View style={[styles.finishMark, { backgroundColor: colors.success }]}><Ionicons name="checkmark" size={44} color="#FFFFFF" /></View>
    <Header eyebrow="SESSÃO CONCLUÍDA" title={saved ? "Treino salvo!" : `Boa sessão, ${state.displayName}`} subtitle={saved ? `${trainer.name} verá seu feedback quando o app estiver conectado.` : "Conte como foi — leva 5 segundos."} showProfile={false} />
    <Card style={styles.summary}><View style={uiStyles.row}><View style={{ flex: 1 }}><Text style={[styles.fieldLabel, { color: colors.muted }]}>SÉRIES</Text><Text style={[styles.summaryValue, { color: colors.text }]}>{allDone} <Text style={{ color: colors.muted, fontSize: 13 }}>/ {totalSets}</Text></Text></View><View style={{ flex: 1 }}><Text style={[styles.fieldLabel, { color: colors.muted }]}>TEMPO</Text><Text style={[styles.summaryValue, { color: colors.text }]}>{durationMinutes} min</Text></View></View></Card>

    {!saved && <>
      <Card style={{ gap: 12 }}>
        <View style={uiStyles.spread}><Text style={{ color: colors.text, fontSize: 14, fontWeight: "800" }}>Esforço percebido</Text><Text style={{ color: colors.mint, fontSize: 11, fontWeight: "800" }}>{rpe ? `${rpe}/10 · ${RPE_HINT[rpe] ?? RPE_HINT[rpe - 1] ?? ""}` : "Toque para escolher"}</Text></View>
        <View style={styles.rpeRow}>{Array.from({ length: 10 }, (_, index) => index + 1).map(value => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: rpe === value }} accessibilityLabel={`Esforço ${value} de 10`} onPress={() => setRpe(value)} style={[styles.rpeChip, { backgroundColor: rpe === value ? (value >= 9 ? colors.warning : colors.mint) : colors.raised, borderColor: rpe >= value ? colors.mint : colors.line }]}><Text style={{ color: rpe === value ? "#FFFFFF" : colors.muted, fontSize: 12, fontWeight: "900" }}>{value}</Text></Pressable>)}</View>
        <View style={[uiStyles.spread, styles.painRow, { borderColor: pain ? `${colors.danger}88` : colors.line }]}><View style={{ flex: 1 }}><Text style={{ color: colors.text, fontSize: 13, fontWeight: "800" }}>Senti dor ou desconforto</Text><Text style={{ color: colors.dim, fontSize: 10, marginTop: 2 }}>Seu personal recebe um alerta para ajustar a ficha.</Text></View><Switch value={pain} onValueChange={setPain} trackColor={{ true: colors.danger, false: colors.raised }} accessibilityLabel="Senti dor ou desconforto" /></View>
        <TextInput value={note} onChangeText={text => setNote(text.slice(0, 280))} placeholder="Comentário para o personal (opcional)" placeholderTextColor={colors.dim} multiline style={[styles.noteInput, { color: colors.text, backgroundColor: colors.raised }]} accessibilityLabel="Comentário para o personal" />
      </Card>
      <View style={{ flex: 1 }} />
      <View style={styles.actions}>
        <Button label="Salvar treino" variant="success" iconName="checkmark" onPress={saveSession} />
        <Button label="Voltar para a ficha" variant="secondary" onPress={() => setFinished(false)} />
        <Button label="Descartar sessão" variant="quiet" onPress={() => confirmAction("Descartar sessão?", `${allDone} série(s) marcada(s) serão perdidas.`, "Descartar", () => router.replace("/"))} />
      </View>
    </>}
    {saved && <>
      {newRecords.length > 0 && <Card style={{ gap: 6, borderColor: `${colors.warning}88` }}><Text style={{ color: colors.warning, fontSize: 12, fontWeight: "900" }}>🏆 NOVO RECORDE PESSOAL</Text>{newRecords.map(record => <Text key={record} style={{ color: colors.text, fontSize: 12 }}>{record}</Text>)}</Card>}
      <View style={{ flex: 1 }} />
      <View style={styles.actions}>
        <Button label="Ver evolução" onPress={() => router.replace("/progress")} />
        <Button label="Voltar ao início" variant="secondary" onPress={() => router.replace("/")} />
      </View>
    </>}
  </Screen>;

  const { item, exercise, suggestion, last } = current;
  const hero = <View style={{ paddingTop: 4, gap: 10 }}>
    <Text style={{ color: colors.onNavyMuted, fontSize: 12, fontWeight: "800", letterSpacing: 1 }}>{`${day.label} · ${day.title}`.toUpperCase()}</Text>
    <Text style={{ color: colors.onNavy, fontSize: 24, fontWeight: "700" }}>Exercício {exerciseIndex + 1} de {items.length}</Text>
    <View style={uiStyles.spread}><Text style={{ color: colors.onNavyMuted, fontSize: 12 }}>{allDone}/{totalSets} séries concluídas</Text><Text style={{ color: colors.onNavy, fontSize: 12, fontWeight: "800" }}>{Math.round((allDone / Math.max(1, totalSets)) * 100)}%</Text></View>
    <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${(allDone / Math.max(1, totalSets)) * 100}%`, backgroundColor: colors.success }]} /></View>
  </View>;
  const isLast = exerciseIndex === items.length - 1;
  const footer = <View style={uiStyles.row}>
    <Button label="Anterior" variant="secondary" iconName="chevron-back" onPress={() => { setRestSeconds(0); setExerciseIndex(value => Math.max(0, value - 1)); }} />
    <Button label={isLast ? "Finalizar" : "Próximo"} variant={isLast ? "success" : "primary"} iconName={isLast ? "flag" : "chevron-forward"} onPress={() => { setRestSeconds(0); if (!isLast) setExerciseIndex(value => value + 1); else finishWorkout(); }} />
  </View>;
  return <Screen showTabs={false} hero={hero} back onBack={requestExit} footer={footer}>
    <Card style={{ padding: 0, overflow: "hidden" }}>
    <LinearGradient colors={[colors.tile, colors.navyDeep]} style={styles.videoFrame}>{state.videos[exercise.id] && isDeviceVideo(state.videos[exercise.id]) ? <VideoPlayer uri={state.videos[exercise.id]} /> : <><MaterialCommunityIcons name="weight-lifter" size={64} color="rgba(255,255,255,0.3)" /><Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 10, fontWeight: "800", letterSpacing: 1 }}>{state.videos[exercise.id] ? "VÍDEO DEMONSTRATIVO DISPONÍVEL" : "DEMONSTRAÇÃO DO MOVIMENTO"}</Text>{state.videos[exercise.id] && <Pressable accessibilityRole="button" onPress={openExerciseVideo} style={[styles.playVideo, { backgroundColor: colors.mint }]}><Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "800" }}>▶  Abrir vídeo</Text></Pressable>}</>}</LinearGradient>
    <View style={{ padding: 16 }}>
    <View style={uiStyles.spread}><View style={{ flex: 1 }}><Text style={[styles.exerciseName, { color: colors.text }]}>{exercise.name}</Text><Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>{exercise.muscle} · {exercise.equipment} · descanso {item.restSeconds}s</Text></View><Tag label={`${item.sets} × ${formatReps(item)}`} color="blue" /></View>
    </View>
    </Card>

    <View style={uiStyles.row}>
      <Card style={styles.infoBox}><Text style={[styles.fieldLabel, { color: colors.muted }]}>META HOJE</Text><Text style={{ color: suggestion.increased ? colors.mint : colors.text, fontSize: 14, fontWeight: "900", marginTop: 4 }}>{formatLoad(suggestion.loadKg, item.loadPerSide)}{suggestion.increased ? "  ↑" : ""}</Text>{suggestion.increased && <Text style={{ color: colors.mint, fontSize: 9, marginTop: 2 }}>Você bateu a meta 2× — subimos a carga</Text>}</Card>
      <Card style={styles.infoBox}><Text style={[styles.fieldLabel, { color: colors.muted }]}>ÚLTIMA VEZ</Text><Text style={{ color: colors.text, fontSize: 12, fontWeight: "800", marginTop: 4 }}>{last ? last.summary : "Primeira vez"}</Text></Card>
    </View>

    {(item.note || exercise.instructions[0]) && <Card style={styles.coachTip}><Text style={{ color: colors.blue, fontSize: 9, fontWeight: "900", letterSpacing: 1 }}>{item.note ? "NOTA DO PERSONAL" : "EXECUÇÃO"}</Text><Text style={{ color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 5 }}>{item.note ?? exercise.instructions[0]}</Text><Pressable onPress={() => router.push({ pathname: "/exercise/[id]", params: { id: exercise.id } })}><Text style={{ color: colors.blue, fontSize: 10, fontWeight: "700", marginTop: 7 }}>Ver todas as instruções ›</Text></Pressable></Card>}

    <View style={uiStyles.spread}><Text style={{ color: colors.text, fontSize: 14, fontWeight: "800" }}>Registrar séries</Text><Text style={{ color: colors.muted, fontSize: 10 }}>{doneCount} de {item.sets} concluídas</Text></View>
    <View style={styles.setHead}><Text style={[styles.colHead, { color: colors.dim, flex: 0, width: 30 }]}>SÉRIE</Text><Text style={[styles.colHead, { color: colors.dim }]}>REPS</Text><Text style={[styles.colHead, { color: colors.dim }]}>{item.loadPerSide ? "KG / LADO" : "CARGA (KG)"}</Text><Text style={[styles.colHead, { color: colors.dim, flex: 0, width: 34 }]}>OK</Text></View>
    {currentSets.map((set, setIndex) => <View key={setIndex} style={[styles.setRow, { backgroundColor: colors.card, borderColor: set.done ? `${colors.mint}65` : colors.line }]}><Text style={[styles.setNumber, { color: colors.muted }]}>{String(setIndex + 1).padStart(2, "0")}</Text><TextInput accessibilityLabel={`Repetições série ${setIndex + 1}`} keyboardType="number-pad" value={set.reps} onChangeText={text => changeSet(setIndex, { reps: text.replace(/[^0-9]/g, "").slice(0, 3) })} style={[styles.input, { color: colors.text, backgroundColor: colors.raised }]} /><TextInput accessibilityLabel={`Carga em quilos série ${setIndex + 1}`} keyboardType="decimal-pad" value={set.load} onChangeText={text => changeSet(setIndex, { load: text.replace(/[^0-9.,]/g, "").slice(0, 6) })} style={[styles.input, { color: colors.text, backgroundColor: colors.raised }]} /><Pressable accessibilityRole="checkbox" accessibilityState={{ checked: set.done }} accessibilityLabel={`Marcar série ${setIndex + 1} como concluída`} onPress={() => toggleDone(setIndex)} style={[styles.doneButton, { backgroundColor: set.done ? colors.mint : colors.raised, borderColor: set.done ? colors.mint : colors.line }]}><Text style={{ color: set.done ? "#FFFFFF" : colors.dim, fontWeight: "900" }}>{set.done ? "✓" : "○"}</Text></Pressable></View>)}
    {restSeconds > 0 && <Card style={styles.timerCard}><Text style={{ color: colors.muted, fontSize: 9, letterSpacing: 1, fontWeight: "900" }}>DESCANSO</Text><Text style={[styles.timer, { color: colors.text }]}>{String(Math.floor(restSeconds / 60)).padStart(2, "0")}:{String(restSeconds % 60).padStart(2, "0")}</Text><View style={uiStyles.row}><Button label="−30s" variant="secondary" onPress={() => setRestSeconds(value => Math.max(0, value - 30))} /><Button label={timerPaused ? "Retomar" : "Pausar"} variant="secondary" onPress={() => setTimerPaused(value => !value)} /><Button label="+30s" variant="secondary" onPress={() => setRestSeconds(value => value + 30)} /></View><Pressable accessibilityRole="button" onPress={() => setRestSeconds(0)}><Text style={{ color: colors.blue, fontSize: 10, fontWeight: "700", textAlign: "center", marginTop: 10 }}>Pular descanso</Text></Pressable></Card>}
  </Screen>;
}

const styles = StyleSheet.create({ page: { paddingTop: 8, flexGrow: 1 }, topBar: { flexDirection: "row", alignItems: "center", minHeight: 40 }, close: { width: 40, alignItems: "flex-start" }, progressTrack: { height: 6, borderRadius: 5, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.18)" }, progressFill: { height: 6, borderRadius: 5 }, videoFrame: { minHeight: 190, alignItems: "center", justifyContent: "center", gap: 8, overflow: "hidden" }, videoHalo: { position: "absolute", height: 220, width: 220, borderRadius: 150, borderWidth: 1, top: -128, right: -55 }, playVideo: { borderRadius: 10, paddingHorizontal: 13, paddingVertical: 8, marginTop: 2 }, exerciseName: { fontSize: 21, fontWeight: "900" }, infoBox: { flex: 1, padding: 11 }, coachTip: { padding: 12 }, setHead: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, gap: 8 }, colHead: { fontSize: 8, fontWeight: "900", textAlign: "center", flex: 1 }, setRow: { borderWidth: 1, borderRadius: 12, minHeight: 52, flexDirection: "row", alignItems: "center", paddingHorizontal: 10, gap: 8 }, setNumber: { width: 30, fontSize: 12, fontWeight: "800", textAlign: "center" }, input: { flex: 1, minWidth: 0, borderRadius: 9, height: 37, textAlign: "center", fontSize: 13, fontWeight: "700", paddingVertical: 0 }, doneButton: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1 }, timerCard: { alignItems: "center", gap: 8 }, timer: { fontSize: 31, fontWeight: "900", letterSpacing: 1 }, finishPage: { flexGrow: 1, justifyContent: "center", paddingTop: 24 }, finishMark: { alignSelf: "center", width: 76, height: 76, borderRadius: 27, alignItems: "center", justifyContent: "center" }, summary: { gap: 11 }, fieldLabel: { fontSize: 8, fontWeight: "900", letterSpacing: 1 }, summaryValue: { fontSize: 25, fontWeight: "900", marginTop: 5 }, rpeRow: { flexDirection: "row", justifyContent: "space-between", gap: 4 }, rpeChip: { flex: 1, height: 36, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" }, painRow: { borderWidth: 1, borderRadius: 12, padding: 11, gap: 10 }, noteInput: { minHeight: 64, borderRadius: 12, padding: 11, fontSize: 12, textAlignVertical: "top" }, actions: { gap: 10, flexDirection: "column" },
});
