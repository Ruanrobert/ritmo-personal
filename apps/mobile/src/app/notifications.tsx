import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card, Screen, Tag } from "../components/ui";
import { useFitness } from "../lib/fitness-context";
import { sampleNotifications } from "../lib/demo-data";

export default function NotificationsScreen() {
  const { colors } = useFitness();
  const [readIds, setReadIds] = useState<string[]>([]);
  return <Screen showTabs={false} title="Notificações" subtitle="Avisos de treino e atualizações." back>
    <Pressable accessibilityRole="button" onPress={() => setReadIds(sampleNotifications.map(item => item.id))} style={{ alignSelf: "flex-end" }}><Text style={{ color: colors.blue, fontSize: 11, fontWeight: "700" }}>Marcar todas como lidas</Text></Pressable>
    {sampleNotifications.map(item => {
      const read = readIds.includes(item.id);
      return <Pressable key={item.id} onPress={() => { setReadIds(ids => ids.includes(item.id) ? ids : [...ids, item.id]); router.push(item.route as "/workout" | "/messages"); }}><Card style={[styles.row, { opacity: read ? 0.7 : 1 }]}><View style={[styles.icon, { backgroundColor: item.tone === "mint" ? `${colors.mint}1A` : item.tone === "orange" ? `${colors.warning}1A` : `${colors.blue}1A` }]}><Text style={{ color: item.tone === "mint" ? colors.mint : item.tone === "orange" ? colors.warning : colors.blue, fontSize: 16 }}>{item.icon}</Text></View><View style={{ flex: 1, gap: 5 }}><View style={styles.titleRow}><Text style={{ color: colors.text, fontWeight: "800", fontSize: 13, flex: 1 }}>{item.title}</Text>{!read && <View style={[styles.unread, { backgroundColor: colors.mint }]} />}</View><Text style={{ color: colors.muted, fontSize: 11, lineHeight: 16 }}>{item.body}</Text><Text style={{ color: colors.dim, fontSize: 9 }}>{item.time} · Abrir</Text></View><Text style={{ color: colors.blue }}>›</Text></Card></Pressable>;
    })}
    <Card style={styles.note}><Tag label="MODO DEMONSTRAÇÃO" color="blue" /><Text style={{ color: colors.muted, fontSize: 11, lineHeight: 16 }}>Os avisos nesta tela são exemplos locais. Push notifications reais precisam de configuração de projeto e do servidor.</Text></Card>
  </Screen>;
}

const styles = StyleSheet.create({ row: { flexDirection: "row", alignItems: "center", gap: 11 }, icon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" }, titleRow: { flexDirection: "row", alignItems: "center", gap: 8 }, unread: { width: 7, height: 7, borderRadius: 5 }, note: { gap: 9 },
});
