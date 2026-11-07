import { router, type Href } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Button, Card, IconBubble, Ionicons, openInstagram, openWhatsApp, Screen, type IconName } from "../components/ui";
import { useFitness } from "../lib/fitness-context";
import { confirmAction } from "../lib/dialogs";
import type { ThemeChoice } from "../lib/types";

const themeOptions: { id: ThemeChoice; label: string; icon: IconName }[] = [
  { id: "light", label: "Claro", icon: "sunny-outline" },
  { id: "dark", label: "Escuro", icon: "moon-outline" },
  { id: "system", label: "Sistema", icon: "phone-portrait-outline" },
];

const menu: { label: string; detail: string; icon: IconName; href?: Href; action?: () => void }[] = [
  { label: "Treinos", detail: "Programa e fichas da semana", icon: "barbell", href: "/workouts" },
  { label: "Meu Progresso", detail: "Cargas, recordes e medidas", icon: "trending-up", href: "/progress" },
  { label: "Exercícios", detail: "Biblioteca com instruções", icon: "library", href: "/exercises" },
  { label: "Mensagens", detail: "Converse com seu personal", icon: "chatbubbles", href: "/messages" },
  { label: "Notificações", detail: "Avisos e lembretes", icon: "notifications", href: "/notifications" },
  { label: "WhatsApp do personal", detail: "Abrir conversa", icon: "logo-whatsapp", action: openWhatsApp },
  { label: "Instagram do personal", detail: "Ver perfil", icon: "logo-instagram", action: openInstagram },
];

export default function ProfileScreen() {
  const { colors, state, setTheme, setDisplayName, resetDemo } = useFitness();
  const [nameDraft, setNameDraft] = useState(state.displayName);
  const initials = state.displayName.trim().split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase();

  const hero = <View style={styles.hero}>
    <View style={[styles.avatar, { backgroundColor: colors.mint, borderColor: colors.tabActive }]}><Text style={styles.avatarText}>{initials || "EU"}</Text></View>
    <View style={{ flex: 1 }}>
      <Text style={{ color: colors.onNavy, fontSize: 22, fontWeight: "700" }}>{state.displayName}</Text>
      <Text style={{ color: colors.onNavyMuted, fontSize: 13, marginTop: 2 }}>Aluno · conta local de demonstração</Text>
    </View>
  </View>;

  return <Screen activeTab="profile" hero={hero}>
    <Card style={{ padding: 6 }}>
      {menu.map((item, index) => <Pressable key={item.label} accessibilityRole="button" onPress={() => item.action ? void item.action() : item.href && router.push(item.href)} style={({ pressed }) => [styles.menuItem, index < menu.length - 1 && { borderBottomWidth: 1, borderColor: colors.line }, pressed && { backgroundColor: colors.raised }]}>
        <IconBubble name={item.icon} size={40} filled={false} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700" }}>{item.label}</Text>
          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>{item.detail}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.dim} />
      </Pressable>)}
    </Card>

    <Card style={{ gap: 10 }}>
      <Text style={[styles.section, { color: colors.text }]}>Seu nome</Text>
      <TextInput accessibilityLabel="Seu nome no app" value={nameDraft} onChangeText={setNameDraft} maxLength={32} placeholder="Como podemos te chamar?" placeholderTextColor={colors.dim} style={[styles.input, { color: colors.text, borderColor: colors.line, backgroundColor: colors.bg }]} />
      <View style={{ flexDirection: "row" }}><Button label="Salvar nome" onPress={() => { setDisplayName(nameDraft); setNameDraft(nameDraft.trim() || "Ruan"); }} /></View>
    </Card>

    <Card style={{ gap: 12 }}>
      <Text style={[styles.section, { color: colors.text }]}>Aparência</Text>
      <View style={{ flexDirection: "row", gap: 8 }}>{themeOptions.map(option => {
        const selected = state.theme === option.id;
        return <Pressable key={option.id} accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={() => setTheme(option.id)} style={[styles.themeOption, { borderColor: selected ? colors.mint : colors.line, backgroundColor: selected ? colors.blueDeep : colors.card }]}>
          <Ionicons name={option.icon} size={20} color={selected ? colors.blue : colors.muted} />
          <Text style={{ color: selected ? colors.blue : colors.text, fontSize: 13, fontWeight: "700" }}>{option.label}</Text>
        </Pressable>;
      })}</View>
    </Card>

    <Card style={{ gap: 7 }}>
      <Text style={{ color: colors.blue, fontSize: 13, fontWeight: "800" }}>Prévia local</Text>
      <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18 }}>Nome, tema, favoritos, vídeos, treinos e medidas ficam neste dispositivo, sem criptografia. Evite registrar dados médicos. Login e sincronização com o personal dependem do backend.</Text>
    </Card>
    <View style={{ flexDirection: "row" }}><Button label="Limpar dados desta prévia" variant="secondary" iconName="trash-outline" onPress={() => confirmAction("Limpar histórico da prévia?", "Remove treinos, medidas, favoritos e vídeos salvos neste aparelho. Tema e nome são mantidos.", "Limpar dados", resetDemo)} /></View>
  </Screen>;
}

const styles = StyleSheet.create({
  hero: { flexDirection: "row", alignItems: "center", gap: 16, paddingTop: 8 },
  avatar: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#FFFFFF", fontSize: 26, fontWeight: "800" },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10 },
  section: { fontSize: 16, fontWeight: "800" },
  input: { height: 46, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, fontSize: 14 },
  themeOption: { flex: 1, alignItems: "center", gap: 6, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5 },
});
