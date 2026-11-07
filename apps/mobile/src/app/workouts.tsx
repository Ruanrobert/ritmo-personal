import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Button, Card, Ionicons, MaterialCommunityIcons, Screen, SectionHeading, Tag, uiStyles } from "../components/ui";
import { useFitness } from "../lib/fitness-context";
import { program } from "../lib/demo-data";
import { dayStats, findExercise, formatDate, formatLoad, formatReps, lastPerformance, programStatus, suggestLoad, todayOrNextDay } from "../lib/training";

export default function WorkoutsScreen() {
  const { colors, state } = useFitness();
  const { day: nextDay } = todayOrNextDay();
  const [openDay, setOpenDay] = useState<string | null>(nextDay.id);
  const [notesOpen, setNotesOpen] = useState(false);
  const status = programStatus();

  return <Screen activeTab="workouts" title="Treinos" back>
    <Card style={styles.programCard}>
      <View style={styles.programHead}>
        <View style={[styles.programIcon, { backgroundColor: colors.blueDeep }]}><MaterialCommunityIcons name="arm-flex" size={34} color={colors.blue} /></View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[styles.title, { color: colors.text }]}>{program.name}</Text>
          <View style={uiStyles.row}><Ionicons name="calendar-outline" size={15} color={colors.muted} /><Text style={{ color: colors.muted, fontSize: 14 }}>{formatDate(program.startsOn)} - {formatDate(program.endsOn)}</Text></View>
          <Text style={{ color: colors.dim, fontSize: 13 }}>{program.goal} | {program.level}</Text>
        </View>
        <Tag label={status.expired ? "Vencido" : `${status.remaining} dias`} color={status.expired || status.endingSoon ? "warning" : "blue"} />
      </View>
      <View style={[styles.track, { backgroundColor: colors.raised }]}><View style={[styles.fill, { width: `${Math.round(status.progress * 100)}%`, backgroundColor: status.endingSoon || status.expired ? colors.warning : colors.mint }]} /></View>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: notesOpen }} onPress={() => setNotesOpen(value => !value)} style={[styles.notes, { backgroundColor: colors.raised }]}>
        <View style={uiStyles.spread}><Text style={{ color: colors.text, fontSize: 14, fontWeight: "700" }}>Orientações gerais</Text><Ionicons name={notesOpen ? "eye-off-outline" : "eye-outline"} size={20} color={colors.text} /></View>
        {notesOpen && program.generalNotes.split("\n").map(line => <Text key={line} style={{ color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 8 }}>• {line}</Text>)}
      </Pressable>
    </Card>

    {program.days.map(day => {
      const stats = dayStats(state.sessions, day.id);
      const open = openDay === day.id;
      return <Card key={day.id} style={[styles.dayCard, day.id === nextDay.id && { borderColor: `${colors.mint}88`, borderWidth: 1.5 }]}>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpenDay(open ? null : day.id)} style={uiStyles.spread}>
          <View style={{ flex: 1, gap: 6 }}>
            <View style={uiStyles.row}><Text style={{ color: colors.text, fontSize: 19, fontWeight: "700" }}>{day.label}</Text>{day.id === nextDay.id && <Tag label="Hoje / próximo" color="blue" />}</View>
            <Text style={{ color: colors.text, fontSize: 13 }}>{day.title.toUpperCase()}</Text>
            <Text style={{ color: stats.count ? colors.blue : colors.dim, fontSize: 13 }}>{stats.count ? `Executado ${stats.count} ${stats.count === 1 ? "vez" : "vezes"}, última execução em ${formatDate(stats.last!)}` : "Ainda não executado"}</Text>
          </View>
          <Ionicons name={open ? "chevron-up" : "chevron-down"} size={22} color={colors.blue} />
        </Pressable>
        <View style={[uiStyles.row, { marginTop: 14 }]}>
          <Button label="Evolução" variant="outline" iconName="trending-up" onPress={() => router.push({ pathname: "/progress", params: { exercise: day.items[0].exerciseId } })} />
          <Button label={open ? "Ocultar" : "Ver ficha"} variant="outline" iconName="list" onPress={() => setOpenDay(open ? null : day.id)} />
        </View>

        {open && <View style={{ gap: 10, marginTop: 14 }}>
          {day.items.map((item, index) => {
            const exercise = findExercise(item.exerciseId);
            const last = lastPerformance(state.sessions, item.exerciseId);
            const suggestion = suggestLoad(state.sessions, item);
            return <Pressable key={`${item.exerciseId}-${index}`} accessibilityRole="button" accessibilityLabel={`Ver detalhes de ${exercise?.name}`} onPress={() => router.push({ pathname: "/exercise/[id]", params: { id: item.exerciseId } })} style={({ pressed }) => [styles.exerciseCard, { backgroundColor: colors.card, borderColor: colors.line, opacity: pressed ? 0.9 : 1 }]}>
              <View style={{ flex: 1, gap: 4, padding: 14 }}>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700" }}>{exercise?.name ?? item.exerciseId}</Text>
                <Text style={{ color: colors.text, fontSize: 13 }}><Text style={{ fontWeight: "700" }}>Séries: </Text>{item.sets}/{formatReps(item)}</Text>
                <Text style={{ color: colors.text, fontSize: 13 }}><Text style={{ fontWeight: "700" }}>Carga: </Text>{formatLoad(suggestion.loadKg, item.loadPerSide)}{suggestion.increased ? <Text style={{ color: colors.success, fontWeight: "800" }}>  ↑ subiu</Text> : null}</Text>
                <Text style={{ color: colors.text, fontSize: 13 }}><Text style={{ fontWeight: "700" }}>Intervalo: </Text>{item.restSeconds}s</Text>
                {last && <Text style={{ color: colors.dim, fontSize: 12 }}>Última vez: {last.summary}</Text>}
                {item.note && <Text style={{ color: colors.blue, fontSize: 12 }}>{item.note}</Text>}
              </View>
              <LinearGradient colors={[colors.tile, colors.navyDeep]} style={styles.thumb}>
                <MaterialCommunityIcons name="weight-lifter" size={40} color="rgba(255,255,255,0.35)" />
                <View style={styles.thumbPlay}><Ionicons name="play" size={16} color="#FFFFFF" style={{ marginLeft: 2 }} /></View>
                <Text style={styles.thumbLabel} numberOfLines={1}>{exercise?.muscle}</Text>
              </LinearGradient>
            </Pressable>;
          })}
        </View>}

        <View style={[styles.startWrap]}>
          <Button label="INICIAR" variant="success" iconName="play" onPress={() => router.push({ pathname: "/workout", params: { day: day.id } })} />
        </View>
      </Card>;
    })}

    <SectionHeading title="Histórico de sessões" />
    {state.sessions.length === 0 ? <Card style={styles.empty}><Text style={{ color: colors.text, fontWeight: "800", fontSize: 15 }}>Seu histórico começa aqui</Text><Text style={{ color: colors.muted, fontSize: 13, lineHeight: 19 }}>Conclua uma ficha para ver duração, esforço e cargas registradas.</Text></Card> : state.sessions.slice(0, 10).map(session => <Card key={session.id} style={styles.historyCard}>
      <View style={[styles.historyIcon, { backgroundColor: session.pain ? `${colors.danger}1F` : colors.blueDeep }]}><Ionicons name={session.pain ? "alert" : "checkmark"} size={20} color={session.pain ? colors.danger : colors.blue} /></View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ color: colors.text, fontSize: 14, fontWeight: "700" }}>{session.name}</Text>
        <Text style={{ color: colors.muted, fontSize: 12 }}>{formatDate(session.completedAt, { weekday: "short", day: "2-digit", month: "2-digit" })} · {session.durationMinutes} min · {session.logs.length} exercícios</Text>
        <Text style={{ color: colors.dim, fontSize: 11 }}>{session.rpe ? `Esforço ${session.rpe}/10` : session.rating ? `${session.rating}/5` : "Sem feedback"}{session.pain ? " · relatou dor" : ""}{session.note ? ` · "${session.note}"` : ""}</Text>
      </View>
    </Card>)}
  </Screen>;
}

const styles = StyleSheet.create({
  programCard: { gap: 16 },
  programHead: { flexDirection: "row", alignItems: "center", gap: 16 },
  programIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 21, fontWeight: "800" },
  track: { height: 6, borderRadius: 5, overflow: "hidden" },
  fill: { height: 6, borderRadius: 5 },
  notes: { borderRadius: 8, paddingHorizontal: 18, paddingVertical: 16 },
  dayCard: { gap: 0 },
  exerciseCard: { flexDirection: "row", borderRadius: 10, borderWidth: 1, overflow: "hidden", minHeight: 130 },
  thumb: { width: 118, alignItems: "center", justifyContent: "center" },
  thumbPlay: { position: "absolute", width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center" },
  thumbLabel: { position: "absolute", bottom: 8, color: "rgba(255,255,255,0.75)", fontSize: 10, fontWeight: "700", paddingHorizontal: 6 },
  startWrap: { flexDirection: "row", marginTop: 12 },
  empty: { gap: 8 },
  historyCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  historyIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
});
