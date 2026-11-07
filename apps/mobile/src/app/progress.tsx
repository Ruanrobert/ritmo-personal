import { useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Button, Card, Metric, Screen, SectionHeading, Tag, uiStyles } from "../components/ui";
import { useFitness } from "../lib/fitness-context";
import { confirmAction, notify } from "../lib/dialogs";
import { program } from "../lib/demo-data";
import { findExercise, formatDate, formatLoad, loadSeries, parseLoad, personalRecord } from "../lib/training";
import type { BodyMeasurement } from "../lib/types";

type MeasureKey = "weightKg" | "chestCm" | "waistCm" | "hipCm" | "armCm" | "thighCm";
const FIELDS: { key: MeasureKey; label: string; unit: string }[] = [
  { key: "weightKg", label: "Peso", unit: "kg" },
  { key: "waistCm", label: "Cintura", unit: "cm" },
  { key: "hipCm", label: "Quadril", unit: "cm" },
  { key: "chestCm", label: "Peito", unit: "cm" },
  { key: "armCm", label: "Braço", unit: "cm" },
  { key: "thighCm", label: "Coxa", unit: "cm" },
];

function BarChart({ values, labels, unit, color, highlight }: { values: number[]; labels: string[]; unit: string; color: string; highlight: string }) {
  const { colors } = useFitness();
  const max = Math.max(...values, 1);
  const min = Math.min(...values);
  const floor = values.length > 1 ? Math.max(0, min - (max - min) * 0.6 - 1) : 0;
  return <View style={styles.chart}>{values.map((value, index) => <View key={`${index}-${value}`} style={styles.barGroup}>
    <Text style={{ color: colors.muted, fontSize: 9 }}>{Number.isInteger(value) ? value : value.toFixed(1)}{unit}</Text>
    <View style={[styles.bar, { height: `${Math.max(10, ((value - floor) / Math.max(1, max - floor)) * 100)}%`, backgroundColor: index === values.length - 1 ? highlight : color }]} />
    <Text style={{ color: colors.dim, fontSize: 8 }}>{labels[index]}</Text>
  </View>)}</View>;
}

export default function ProgressScreen() {
  const { colors, state, addMeasurement, removeMeasurement } = useFitness();
  const params = useLocalSearchParams<{ exercise?: string }>();
  const programExerciseIds = useMemo(() => Array.from(new Set(program.days.flatMap(day => day.items.filter(item => item.loadKg > 0).map(item => item.exerciseId)))), []);
  const [selectedId, setSelectedId] = useState(typeof params.exercise === "string" ? params.exercise : programExerciseIds[0]);
  const [form, setForm] = useState<Partial<Record<MeasureKey, string>>>({});
  const [formOpen, setFormOpen] = useState(false);
  const [measureKey, setMeasureKey] = useState<MeasureKey>("weightKg");

  const selected = findExercise(selectedId);
  const series = loadSeries(state.sessions, selectedId).slice(-8);
  const pr = personalRecord(state.sessions, selectedId);
  const first = series[0]?.load ?? 0;
  const lastValue = series[series.length - 1]?.load ?? 0;
  const delta = series.length > 1 ? lastValue - first : 0;

  const measureSeries = state.measurements.filter(item => typeof item[measureKey] === "number").slice(0, 8).reverse();
  const latest = state.measurements[0];
  const previous = state.measurements[1];
  const field = FIELDS.find(item => item.key === measureKey)!;
  const rpeSessions = state.sessions.filter(session => session.rpe);
  const avgRpe = rpeSessions.length ? rpeSessions.reduce((sum, session) => sum + (session.rpe ?? 0), 0) / rpeSessions.length : 0;
  const painCount = state.sessions.filter(session => session.pain).length;

  function saveMeasurement() {
    const entry: BodyMeasurement = { id: `${Date.now()}`, date: new Date().toISOString() };
    let filled = 0;
    for (const { key } of FIELDS) {
      const value = parseLoad(form[key] ?? "");
      if (value > 0) { entry[key] = value; filled += 1; }
    }
    if (!filled) { notify("Nada para salvar", "Preencha pelo menos uma medida."); return; }
    addMeasurement(entry);
    setForm({});
    setFormOpen(false);
  }

  return <Screen activeTab="progress" title="Meu Progresso" subtitle="Cargas, recordes e medidas — tudo em números." back>

    <View style={uiStyles.row}>
      <Metric label="SESSÕES" value={`${state.sessions.length}`} detail="salvas neste aparelho" accent />
      <Metric label="ESFORÇO MÉDIO" value={avgRpe ? `${avgRpe.toFixed(1)}/10` : "—"} detail={painCount ? `${painCount} relato(s) de dor` : "sem relatos de dor"} />
    </View>

    <SectionHeading title="Progressão de carga" />
    <View style={styles.chips}>{programExerciseIds.map(id => <Pressable key={id} accessibilityRole="tab" accessibilityState={{ selected: selectedId === id }} onPress={() => setSelectedId(id)} style={[styles.chip, { backgroundColor: selectedId === id ? colors.blueDeep : colors.raised, borderColor: selectedId === id ? colors.blue : colors.line }]}><Text style={{ color: selectedId === id ? colors.blue : colors.muted, fontSize: 10, fontWeight: "700" }}>{findExercise(id)?.name}</Text></Pressable>)}</View>
    <Card style={styles.chartCard}>
      <View style={uiStyles.spread}>
        <View style={{ flex: 1 }}><Text style={[styles.eyebrow, { color: colors.muted }]}>MAIOR CARGA POR SESSÃO</Text><Text style={[styles.chartTitle, { color: colors.text }]}>{selected?.name}</Text></View>
        {pr > 0 && <Tag label={`🏆 PR ${formatLoad(pr)}`} color="warning" />}
      </View>
      {series.length ? <BarChart values={series.map(item => item.load)} labels={series.map(item => formatDate(item.date))} unit="" color={colors.mint} highlight={colors.blue} /> : <View style={[styles.emptyChart, { borderColor: colors.line }]}><Text style={{ color: colors.muted, fontSize: 12, textAlign: "center" }}>Conclua uma ficha com {selected?.name} para ver sua progressão aqui.</Text></View>}
      {series.length > 1 && <Text style={{ color: delta >= 0 ? colors.mint : colors.warning, fontSize: 11, fontWeight: "800" }}>{delta >= 0 ? "+" : ""}{delta.toFixed(1).replace(".", ",")} kg desde {formatDate(series[0].date)}</Text>}
      {series.length > 0 && <View style={{ gap: 6 }}>{series.slice().reverse().slice(0, 4).map((entry, index) => <View key={`${entry.date}-${index}`} style={[uiStyles.spread, styles.logRow, { borderColor: colors.line }]}><Text style={{ color: colors.text, fontSize: 12, fontWeight: "700" }}>{formatLoad(entry.load)} × {entry.reps}</Text><Text style={{ color: colors.dim, fontSize: 10 }}>{formatDate(entry.date, { weekday: "short", day: "2-digit", month: "2-digit" })}</Text></View>)}</View>}
    </Card>

    <SectionHeading title="Medidas corporais" action={formOpen ? "Cancelar" : "+ Registrar"} onAction={() => setFormOpen(value => !value)} />
    {formOpen && <Card style={{ gap: 12 }}>
      <Text style={{ color: colors.muted, fontSize: 11 }}>Preencha só o que você mediu hoje. Use fita métrica sempre no mesmo ponto.</Text>
      <View style={styles.formGrid}>{FIELDS.map(item => <View key={item.key} style={styles.formField}>
        <Text style={[styles.eyebrow, { color: colors.muted }]}>{item.label.toUpperCase()} ({item.unit})</Text>
        <TextInput accessibilityLabel={`${item.label} em ${item.unit}`} keyboardType="decimal-pad" value={form[item.key] ?? ""} onChangeText={text => setForm(current => ({ ...current, [item.key]: text.replace(/[^0-9.,]/g, "").slice(0, 6) }))} placeholder={latest?.[item.key] ? String(latest[item.key]).replace(".", ",") : "—"} placeholderTextColor={colors.dim} style={[styles.input, { color: colors.text, backgroundColor: colors.raised }]} />
      </View>)}</View>
      <Button label="Salvar medidas" icon="✓" onPress={saveMeasurement} />
    </Card>}

    {latest ? <Card style={{ gap: 12 }}>
      <View style={styles.chips}>{FIELDS.map(item => <Pressable key={item.key} accessibilityRole="tab" accessibilityState={{ selected: measureKey === item.key }} onPress={() => setMeasureKey(item.key)} style={[styles.chip, { backgroundColor: measureKey === item.key ? colors.blueDeep : colors.raised, borderColor: measureKey === item.key ? colors.blue : colors.line }]}><Text style={{ color: measureKey === item.key ? colors.blue : colors.muted, fontSize: 10, fontWeight: "700" }}>{item.label}</Text></Pressable>)}</View>
      {measureSeries.length ? <BarChart values={measureSeries.map(item => item[measureKey] as number)} labels={measureSeries.map(item => formatDate(item.date))} unit="" color={colors.blue} highlight={colors.mint} /> : <Text style={{ color: colors.muted, fontSize: 11 }}>Sem registros de {field.label.toLowerCase()} ainda.</Text>}
      <View style={styles.formGrid}>{FIELDS.filter(item => typeof latest[item.key] === "number").map(item => {
        const diff = previous && typeof previous[item.key] === "number" ? (latest[item.key] as number) - (previous[item.key] as number) : 0;
        return <View key={item.key} style={[styles.measureTile, { backgroundColor: colors.raised }]}>
          <Text style={[styles.eyebrow, { color: colors.muted }]}>{item.label.toUpperCase()}</Text>
          <Text style={{ color: colors.text, fontSize: 17, fontWeight: "900", marginTop: 3 }}>{String(latest[item.key]).replace(".", ",")} <Text style={{ fontSize: 10, color: colors.muted }}>{item.unit}</Text></Text>
          {diff !== 0 && <Text style={{ color: colors.blue, fontSize: 10, marginTop: 2 }}>{diff > 0 ? "+" : ""}{diff.toFixed(1).replace(".", ",")} {item.unit}</Text>}
        </View>;
      })}</View>
      <Text style={{ color: colors.dim, fontSize: 10 }}>Última medição em {formatDate(latest.date, { day: "2-digit", month: "long", year: "numeric" })} · {state.measurements.length} registro(s)</Text>
      <Pressable accessibilityRole="button" onPress={() => confirmAction("Apagar última medição?", "Esta ação não pode ser desfeita.", "Apagar", () => removeMeasurement(latest.id))}><Text style={{ color: colors.danger, fontSize: 11, fontWeight: "700" }}>Apagar última medição</Text></Pressable>
    </Card> : !formOpen && <Card style={{ gap: 8 }}><Text style={{ color: colors.text, fontSize: 13, fontWeight: "800" }}>Nada de foto de ficha em papel</Text><Text style={{ color: colors.muted, fontSize: 11, lineHeight: 17 }}>Registre peso e circunferências em números para ver gráficos e comparar com a medição anterior.</Text><Button label="Registrar primeira medição" variant="secondary" onPress={() => setFormOpen(true)} /></Card>}

    <Text style={{ color: colors.dim, fontSize: 10, lineHeight: 15 }}>Medidas ficam apenas neste aparelho por enquanto. Ao conectar o backend, elas serão visíveis só para você e seu personal.</Text>
  </Screen>;
}

const styles = StyleSheet.create({
  chartCard: { gap: 13 },
  eyebrow: { fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  chartTitle: { fontSize: 17, fontWeight: "900", marginTop: 5 },
  chart: { height: 170, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-around", borderBottomWidth: 1, borderBottomColor: "#657B8B", paddingBottom: 6, paddingTop: 8 },
  emptyChart: { height: 120, borderWidth: 1, borderStyle: "dashed", borderRadius: 14, alignItems: "center", justifyContent: "center", padding: 16 },
  barGroup: { alignItems: "center", justifyContent: "flex-end", height: "100%", gap: 5, flex: 1 },
  bar: { width: "46%", minHeight: 10, borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  chip: { borderRadius: 99, paddingHorizontal: 11, paddingVertical: 8, borderWidth: 1 },
  logRow: { borderTopWidth: 1, paddingTop: 7 },
  formGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  formField: { flexBasis: "30%", flexGrow: 1, gap: 5 },
  input: { borderRadius: 10, height: 40, textAlign: "center", fontSize: 14, fontWeight: "700", paddingVertical: 0 },
  measureTile: { flexBasis: "30%", flexGrow: 1, borderRadius: 12, padding: 10 },
});
