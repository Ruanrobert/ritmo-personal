import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Linking, StyleSheet, Text, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Button, Card, MaterialCommunityIcons, Screen, Tag, uiStyles } from "../../components/ui";
import { LinearGradient } from "expo-linear-gradient";
import { isDeviceVideo, VideoPlayer } from "../../components/video-player";
import { useFitness } from "../../lib/fitness-context";
import { exercises } from "../../lib/demo-data";

export default function ExerciseDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { colors, state, setVideo, toggleFavorite } = useFitness();
  const exercise = exercises.find(item => item.id === params.id);
  const [editingVideo, setEditingVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState(() => exercise ? state.videos[exercise.id] ?? "" : "");
  if (!exercise) return <Screen showTabs={false} title="Exercício não encontrado" back><View style={uiStyles.row}><Button label="Voltar à biblioteca" onPress={() => router.replace("/exercises")} /></View></Screen>;
  const selectedExercise = exercise;

  async function openVideo() {
    const url = state.videos[selectedExercise.id];
    if (!url) return;
    try {
      if (await Linking.canOpenURL(url)) await Linking.openURL(url);
      else Alert.alert("Link indisponível", "Não foi possível abrir este endereço neste aparelho.");
    } catch { Alert.alert("Não foi possível abrir", "Confira sua conexão e tente novamente."); }
  }

  function saveVideo() {
    const trimmed = videoUrl.trim();
    if (trimmed && !/^https?:\/\//i.test(trimmed) && !isDeviceVideo(trimmed)) {
      Alert.alert("Endereço inválido", "Use um link https:// ou escolha um vídeo da biblioteca do aparelho.");
      return;
    }
    setVideo(selectedExercise.id, trimmed);
    setEditingVideo(false);
  }

  async function chooseVideo() {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permissão necessária", "Permita acesso à biblioteca de mídia para escolher um vídeo.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["videos"], allowsEditing: false });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 300 * 1024 * 1024) {
        Alert.alert("Vídeo muito grande", "Escolha um vídeo com até 300 MB para esta prévia local.");
        return;
      }
      setVideoUrl(asset.uri);
      setEditingVideo(true);
    } catch {
      Alert.alert("Não foi possível escolher", "Tente novamente ou informe um link de vídeo https://.");
    }
  }

  return <Screen activeTab="exercises" showTabs={false} back hero={<View style={{ paddingTop: 6, gap: 4 }}><Text style={{ color: colors.tabActive, fontSize: 11, fontWeight: "800", letterSpacing: 1.2 }}>{selectedExercise.muscle.toUpperCase()}</Text><Text style={{ color: colors.onNavy, fontSize: 26, fontWeight: "700" }}>{selectedExercise.name}</Text><Text style={{ color: colors.onNavyMuted, fontSize: 13, lineHeight: 19 }}>{selectedExercise.description}</Text></View>}>
    <LinearGradient colors={[colors.tile, colors.navyDeep]} style={styles.art}><MaterialCommunityIcons name="weight-lifter" size={72} color="rgba(255,255,255,0.3)" /><Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, letterSpacing: 1.3, fontWeight: "800" }}>{selectedExercise.equipment.toUpperCase()}</Text></LinearGradient>
    <View style={uiStyles.row}><Tag label={selectedExercise.equipment} color="blue" /><Tag label={selectedExercise.level} /><Tag label={`${selectedExercise.sets} × ${selectedExercise.reps}`} color="mint" /><Tag label={`${selectedExercise.restSeconds}s descanso`} /></View>
    <Card style={styles.videoCard}><View style={uiStyles.spread}><View style={{ flex: 1 }}><Text style={{ color: colors.text, fontSize: 14, fontWeight: "800" }}>Vídeo demonstrativo</Text><Text style={{ color: colors.muted, fontSize: 11, marginTop: 4 }}>{state.videos[selectedExercise.id] ? "Link salvo para este exercício" : "Adicione uma referência autorizada"}</Text></View><Text style={{ color: colors.blue, fontSize: 22 }}>▷</Text></View>
      {state.videos[selectedExercise.id] && isDeviceVideo(state.videos[selectedExercise.id]) && <VideoPlayer uri={state.videos[selectedExercise.id]} />}
      {state.videos[selectedExercise.id] && !isDeviceVideo(state.videos[selectedExercise.id]) ? <View style={[uiStyles.row, { marginTop: 8 }]}><Button label="Abrir link" icon="↗" onPress={openVideo} /><Button label="Editar" variant="secondary" onPress={() => { setVideoUrl(state.videos[selectedExercise.id] ?? ""); setEditingVideo(true); }} /></View> : !state.videos[selectedExercise.id] ? <Button label={editingVideo ? "Cancelar" : "Adicionar vídeo"} icon="＋" variant="secondary" onPress={() => setEditingVideo(value => !value)} /> : <Button label="Editar vídeo" variant="secondary" onPress={() => { setVideoUrl(state.videos[selectedExercise.id] ?? ""); setEditingVideo(true); }} />}
      {editingVideo && <View style={{ gap: 8 }}><Button label="Escolher vídeo do aparelho" icon="▣" variant="secondary" onPress={chooseVideo} /><Text style={{ color: colors.muted, fontSize: 10 }}>Ou cole um link autorizado</Text><TextInput autoCapitalize="none" autoCorrect={false} keyboardType="url" placeholder="https://…" placeholderTextColor={colors.dim} value={videoUrl} onChangeText={setVideoUrl} style={[styles.videoInput, { color: colors.text, borderColor: colors.line, backgroundColor: colors.bg }]} /><View style={uiStyles.row}><Button label="Salvar vídeo" onPress={saveVideo} /><Button label="Remover" variant="quiet" onPress={() => { setVideo(selectedExercise.id, ""); setVideoUrl(""); setEditingVideo(false); }} /></View><Text style={{ color: colors.dim, fontSize: 10, lineHeight: 15 }}>Vídeos próprios ou licenciados. O arquivo permanece na biblioteca do aparelho; esta prévia não faz upload.</Text></View>}
    </Card>
    <Card style={{ gap: 12 }}><Text style={{ color: colors.text, fontSize: 14, fontWeight: "800" }}>Como executar</Text>{selectedExercise.instructions.map((instruction, index) => <View key={instruction} style={styles.instruction}><View style={[styles.number, { backgroundColor: colors.blueDeep }]}><Text style={{ color: colors.blue, fontWeight: "900", fontSize: 11 }}>{index + 1}</Text></View><Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18, flex: 1 }}>{instruction}</Text></View>)}</Card>
    <Card style={styles.coachNote}><Text style={{ color: colors.warning, fontSize: 12, fontWeight: "800" }}>Lembrete</Text><Text style={{ color: colors.muted, fontSize: 11, lineHeight: 17 }}>Siga a prescrição do seu profissional. Interrompa se sentir dor aguda ou mal-estar e peça orientação.</Text></Card>
    <View style={uiStyles.row}><Button variant="secondary" label={state.favorites.includes(selectedExercise.id) ? "Remover favorito" : "Salvar favorito"} onPress={() => toggleFavorite(selectedExercise.id)} /><Button label="Iniciar treino" onPress={() => router.push("/workout")} /></View>
  </Screen>;
}

const styles = StyleSheet.create({ back: { minHeight: 30, justifyContent: "center" }, art: { minHeight: 190, borderRadius: 14, alignItems: "center", justifyContent: "center", gap: 9, overflow: "hidden" }, halo: { position: "absolute", width: 230, height: 230, borderRadius: 150, borderWidth: 1, top: -125, left: -60 }, videoCard: { gap: 12 }, videoInput: { borderWidth: 1, borderRadius: 12, height: 44, paddingHorizontal: 12, fontSize: 12 }, instruction: { flexDirection: "row", alignItems: "flex-start", gap: 10 }, number: { width: 25, height: 25, borderRadius: 9, alignItems: "center", justifyContent: "center" }, coachNote: { gap: 6 },
});
