import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Button, Card, Screen, Tag } from "../components/ui";
import { useFitness } from "../lib/fitness-context";
import { sampleMessages, trainer } from "../lib/demo-data";

type Message = { id: string; author: "trainer" | "student"; text: string; time: string };

export default function MessagesScreen() {
  const { colors } = useFitness();
  const [messages, setMessages] = useState<Message[]>(sampleMessages as Message[]);
  const [draft, setDraft] = useState("");
  function sendMessage() {
    const text = draft.trim();
    if (!text) return;
    setMessages(current => [...current, { id: `${Date.now()}`, author: "student", text, time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) }]);
    setDraft("");
  }
  return <Screen showTabs={false} contentStyle={styles.screen} title="Seu personal" subtitle={`${trainer.name} · Online agora`} back>
    <Tag label="CONVERSA DE DEMONSTRAÇÃO · NÃO ENVIADA" color="blue" />
    <View style={styles.thread}>{messages.map(message => <View key={message.id} style={[styles.messageRow, message.author === "student" && styles.studentRow]}><Card style={[styles.bubble, message.author === "student" ? { backgroundColor: colors.blueDeep, borderColor: colors.blue } : { backgroundColor: colors.card, borderColor: colors.line }]}><Text style={{ color: colors.text, fontSize: 12, lineHeight: 18 }}>{message.text}</Text><Text style={{ color: colors.muted, fontSize: 9, textAlign: "right", marginTop: 5 }}>{message.time}</Text></Card></View>)}</View>
    <Card style={styles.quickAction}><Text style={{ color: colors.text, fontSize: 12, fontWeight: "800" }}>Treino A atualizado</Text><Text style={{ color: colors.muted, fontSize: 10, marginTop: 3 }}>Peito + tríceps · 4 exercícios</Text><Button label="Abrir treino" variant="secondary" onPress={() => router.push("/workout")} /></Card>
    <View style={{ flex: 1 }} />
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={12}>
      <View style={[styles.composer, { backgroundColor: colors.card, borderColor: colors.line }]}><TextInput accessibilityLabel="Escreva sua mensagem" placeholder="Escreva uma mensagem…" placeholderTextColor={colors.dim} value={draft} onChangeText={setDraft} multiline maxLength={500} style={[styles.input, { color: colors.text }]} onSubmitEditing={sendMessage} /><Pressable accessibilityRole="button" accessibilityLabel="Enviar mensagem de demonstração" disabled={!draft.trim()} onPress={sendMessage} style={[styles.send, { backgroundColor: draft.trim() ? colors.mint : colors.raised }]}><Text style={{ color: draft.trim() ? "#FFFFFF" : colors.dim, fontSize: 16, fontWeight: "900" }}>↑</Text></Pressable></View>
    </KeyboardAvoidingView>
    <Text style={{ color: colors.dim, fontSize: 9, textAlign: "center" }}>As mensagens ficam na memória desta prévia e não são enviadas ao personal.</Text>
  </Screen>;
}

const styles = StyleSheet.create({ screen: { flexGrow: 1 }, thread: { gap: 11 }, messageRow: { flexDirection: "row", justifyContent: "flex-start" }, studentRow: { justifyContent: "flex-end" }, bubble: { maxWidth: "86%", padding: 12, borderRadius: 16 }, quickAction: { gap: 8 }, composer: { borderWidth: 1, borderRadius: 17, padding: 7, flexDirection: "row", alignItems: "flex-end", gap: 6 }, input: { flex: 1, maxHeight: 100, minHeight: 38, paddingHorizontal: 9, paddingVertical: 9, fontSize: 12 }, send: { width: 37, height: 37, borderRadius: 13, alignItems: "center", justifyContent: "center" },
});
