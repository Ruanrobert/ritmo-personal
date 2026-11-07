import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Card, DemoNote, Ionicons, openInstagram, openWhatsApp, Screen, SectionHeading, Tag, Tile, uiStyles, type IconName } from "../components/ui";
import { useFitness } from "../lib/fitness-context";
import { program, sampleNotifications, trainer } from "../lib/demo-data";
import { dayStats, formatDate, isoWeekday, programStatus, todayOrNextDay, trainedWeekdays, WEEKDAY_SHORT, weekStreak } from "../lib/training";

const NOTICE_ICON: Record<string, IconName> = { mint: "barbell", orange: "time", violet: "chatbubble-ellipses" };

export default function HomeScreen() {
  const { colors, state } = useFitness();
  const { day, isToday } = todayOrNextDay();
  const trained = trainedWeekdays(state.sessions);
  const streak = weekStreak(state.sessions);
  const status = programStatus();
  const stats = dayStats(state.sessions, day.id);
  const plannedDays = new Set(program.days.map(item => item.weekday));
  const today = isoWeekday();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const trainerInitials = trainer.name.split(" ").map(part => part[0]).join("").slice(0, 2);
  const startDay = () => router.push({ pathname: "/workout", params: { day: day.id } });

  const hero = <View style={styles.hero}>
    <View style={[styles.avatarRing, { borderColor: colors.tabActive }]}>
      <LinearGradient colors={[colors.mint, colors.tile]} style={styles.avatar}><Text style={styles.avatarText}>{trainerInitials}</Text></LinearGradient>
    </View>
    <Text style={[styles.trainerName, { color: colors.onNavy }]}>{trainer.name}</Text>
    <Text style={{ color: colors.onNavyMuted, fontSize: 13 }}>CREF: {trainer.cref}</Text>
    <View style={[uiStyles.row, { marginTop: 10 }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={`WhatsApp de ${trainer.name}`} onPress={openWhatsApp} style={styles.socialPill}><Ionicons name="logo-whatsapp" size={15} color="#FFFFFF" /><Text style={styles.socialText}>WhatsApp</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`Instagram de ${trainer.name}`} onPress={openInstagram} style={styles.socialPill}><Ionicons name="logo-instagram" size={15} color="#FFFFFF" /><Text style={styles.socialText}>Instagram</Text></Pressable>
    </View>
    <Text style={[styles.greeting, { color: colors.onNavy }]}>{greeting}, {state.displayName}!</Text>
  </View>;

  return <Screen activeTab="home" hero={hero}>
    <Card style={styles.weekCard}>
      <View style={uiStyles.spread}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Frequência de Treinos</Text>
        {streak > 0 && <Tag label={`🔥 ${streak} ${streak === 1 ? "semana" : "semanas"}`} color="warning" />}
      </View>
      <View style={styles.weekDays}>{WEEKDAY_SHORT.map((label, index) => {
        const weekday = index + 1;
        const done = trained.has(weekday);
        const planned = plannedDays.has(weekday);
        const missed = planned && !done && weekday < today;
        const isNow = weekday === today;
        return <View key={`${label}-${index}`} style={styles.dayCell} accessibilityLabel={`${label}: ${done ? "treinou" : missed ? "treino pendente" : planned ? "treino planejado" : "descanso"}`}>
          <View style={[styles.dayCircle, { backgroundColor: done ? colors.mint : "transparent", borderColor: done || missed || planned ? colors.mint : colors.line, borderWidth: isNow ? 3 : 2 }]}>
            {done ? <Ionicons name="checkmark" size={22} color="#FFFFFF" /> : missed ? <Text style={{ color: colors.mint, fontSize: 17, fontWeight: "900" }}>!</Text> : null}
          </View>
          <Text style={{ color: colors.text, fontSize: 13, fontWeight: isNow ? "900" : "600" }}>{label.charAt(0)}</Text>
        </View>;
      })}</View>
    </Card>

    <Pressable accessibilityRole="button" accessibilityLabel={`Começar ${day.label}: ${day.title}`} onPress={startDay} style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] }]}>
      <LinearGradient colors={["#1E9BFF", "#0A5FC4"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.todayCard}>
        <View style={styles.todayGlow} />
        <View style={{ flex: 1 }}>
          <Text style={styles.todayEyebrow}>{isToday ? "TREINO DE HOJE" : `PRÓXIMO · ${day.label.toUpperCase()}`}</Text>
          <Text style={styles.todayTitle} numberOfLines={2}>{day.title}</Text>
          <Text style={styles.todayMeta}>{day.items.length} exercícios · {stats.count ? `feito ${stats.count}× · última ${formatDate(stats.last!)}` : "ainda não executado"}</Text>
        </View>
        <View style={styles.playCircle}><Ionicons name="play" size={22} color="#0A5FC4" style={{ marginLeft: 3 }} /></View>
      </LinearGradient>
    </Pressable>

    {(status.endingSoon || status.expired) && <Card style={[styles.alertCard, { borderColor: `${colors.warning}66`, backgroundColor: `${colors.warning}12` }]}>
      <Ionicons name="alert-circle" size={22} color={colors.warning} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.warning, fontWeight: "900", fontSize: 13 }}>{status.expired ? "Seu programa venceu" : `Seu programa vence em ${status.remaining} ${status.remaining === 1 ? "dia" : "dias"}`}</Text>
        <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>Avise seu personal para receber a próxima fase.</Text>
      </View>
    </Card>}

    <View style={styles.grid}>
      <Tile icon="barbell" label="Treinos" detail={`${program.days.length} fichas`} onPress={() => router.push("/workouts")} />
      <Tile icon="trending-up" label="Meu Progresso" detail="Cargas e recordes" onPress={() => router.push("/progress")} />
      <Tile icon="body" label="Medidas" detail={state.measurements[0] ? `Última ${formatDate(state.measurements[0].date)}` : "Registrar"} onPress={() => router.push("/progress")} />
      <Tile icon="library" label="Exercícios" detail="Biblioteca" onPress={() => router.push("/exercises")} />
      <Tile icon="chatbubbles" label="Mensagens" detail="Fale com o personal" onPress={() => router.push("/messages")} />
      <Tile icon="notifications" label="Avisos" detail={`${sampleNotifications.length} novos`} onPress={() => router.push("/notifications")} />
    </View>

    <SectionHeading title="Avisos do personal" action="Ver todos" onAction={() => router.push("/notifications")} />
    {sampleNotifications.slice(0, 2).map(item => <Pressable key={item.id} accessibilityRole="button" onPress={() => router.push(item.route as "/workout" | "/messages")}>
      <Card style={styles.noticeCard}>
        <View style={[styles.noticeIcon, { backgroundColor: colors.blueDeep }]}><Ionicons name={NOTICE_ICON[item.tone] ?? "notifications"} size={18} color={colors.blue} /></View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: colors.text, fontSize: 14 }]}>{item.title}</Text>
          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 3, lineHeight: 17 }}>{item.body}</Text>
        </View>
        <Text style={{ color: colors.dim, fontSize: 10 }}>{item.time}</Text>
      </Card>
    </Pressable>)}

    <DemoNote>Prévia local do Ritmo: personal, programa e avisos são de demonstração. Treinos e medidas ficam salvos neste aparelho até conectarmos o backend.</DemoNote>
  </Screen>;
}

const styles = StyleSheet.create({
  hero: { alignItems: "center", paddingTop: 4 },
  avatarRing: { width: 108, height: 108, borderRadius: 54, borderWidth: 3, padding: 3 },
  avatar: { flex: 1, borderRadius: 50, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#FFFFFF", fontSize: 34, fontWeight: "800" },
  trainerName: { fontSize: 18, fontWeight: "600", marginTop: 12 },
  socialPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 99, backgroundColor: "rgba(255,255,255,0.12)", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" },
  socialText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  greeting: { alignSelf: "flex-start", fontSize: 26, fontWeight: "500", marginTop: 22 },
  weekCard: { gap: 16 },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  weekDays: { flexDirection: "row", justifyContent: "space-between" },
  dayCell: { alignItems: "center", gap: 8 },
  dayCircle: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  todayCard: { borderRadius: 12, paddingVertical: 24, paddingHorizontal: 22, flexDirection: "row", alignItems: "center", gap: 14, overflow: "hidden" },
  todayGlow: { position: "absolute", right: -40, top: -60, width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(255,255,255,0.10)" },
  todayEyebrow: { color: "rgba(255,255,255,0.85)", fontSize: 11, fontWeight: "800", letterSpacing: 1.2 },
  todayTitle: { color: "#FFFFFF", fontSize: 26, fontWeight: "800", marginTop: 4 },
  todayMeta: { color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 6 },
  playCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  alertCard: { borderWidth: 1.5, flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  noticeCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  noticeIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
});
