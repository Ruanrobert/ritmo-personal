import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Button, Card, Screen, Tag, uiStyles } from "../components/ui";
import { useFitness } from "../lib/fitness-context";
import { exercises, muscles } from "../lib/demo-data";

export default function ExercisesScreen() {
  const { colors, state, toggleFavorite } = useFitness();
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState("Todos");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const visibleExercises = useMemo(() => exercises.filter(exercise =>
    (muscle === "Todos" || exercise.muscle === muscle) &&
    (!favoritesOnly || state.favorites.includes(exercise.id)) &&
    `${exercise.name} ${exercise.muscle} ${exercise.equipment} ${exercise.level}`.toLowerCase().includes(query.toLowerCase().trim())
  ), [muscle, query, favoritesOnly, state.favorites]);

  return <Screen activeTab="exercises" title="Exercícios" subtitle="Encontre movimentos e veja instruções seguras." back>
    <TextInput accessibilityLabel="Buscar exercício" placeholder="⌕  Buscar por nome, músculo ou equipamento" placeholderTextColor={colors.dim} value={query} onChangeText={setQuery} style={[styles.search, { backgroundColor: colors.card, borderColor: colors.line, color: colors.text }]} />
    <View style={styles.filterRow}><Pressable accessibilityRole="button" accessibilityState={{ selected: favoritesOnly }} onPress={() => setFavoritesOnly(value => !value)} style={[styles.favFilter, { backgroundColor: favoritesOnly ? colors.mint : colors.raised, borderColor: colors.line }]}><Text style={{ color: favoritesOnly ? "#FFFFFF" : colors.text, fontSize: 11, fontWeight: "700" }}>♡ Favoritos</Text></Pressable><Text style={{ color: colors.muted, fontSize: 10 }}>{visibleExercises.length} exercícios</Text></View>
    <View style={styles.chipWrap}>{muscles.map(item => <Pressable key={item} onPress={() => setMuscle(item)} style={[styles.chip, { backgroundColor: muscle === item ? colors.blueDeep : colors.raised, borderColor: muscle === item ? colors.blue : colors.line }]}><Text style={{ color: muscle === item ? colors.blue : colors.muted, fontSize: 10, fontWeight: "700" }}>{item}</Text></Pressable>)}</View>
    <View style={styles.grid}>{visibleExercises.map((exercise, index) => {
      const gradientTone = [colors.blueDeep, colors.raised, `${colors.mint}20`, `${colors.warning}18`][index % 4];
      return <Card key={exercise.id} style={styles.exerciseCard}>
        <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/exercise/[id]", params: { id: exercise.id } })}>
          <View style={[styles.exerciseArt, { backgroundColor: gradientTone, borderColor: colors.line }]}><View style={[styles.artRing, { borderColor: `${colors.blue}45` }]} /><Text style={{ color: colors.blue, fontSize: 27, fontWeight: "300" }}>⌁</Text><Text style={[styles.artMuscle, { color: colors.muted }]}>{exercise.muscle.toUpperCase()}</Text></View>
          <Text style={[styles.exerciseName, { color: colors.text }]}>{exercise.name}</Text><Text style={{ color: colors.muted, fontSize: 10, marginTop: 3 }}>{exercise.equipment} · {exercise.level}</Text>
        </Pressable>
        <View style={[uiStyles.row, { marginTop: 10 }]}><Tag label={`${exercise.sets} × ${exercise.reps}`} color="blue" /><View style={{ flex: 1 }} /><Pressable accessibilityRole="button" accessibilityLabel={`${state.favorites.includes(exercise.id) ? "Remover dos" : "Adicionar aos"} favoritos: ${exercise.name}`} onPress={() => toggleFavorite(exercise.id)} style={styles.favorite}><Text style={{ color: state.favorites.includes(exercise.id) ? colors.danger : colors.muted, fontSize: 19 }}>{state.favorites.includes(exercise.id) ? "♥" : "♡"}</Text></Pressable></View>
      </Card>;
    })}</View>
    {visibleExercises.length === 0 && <Card><Text style={{ color: colors.text, fontWeight: "800" }}>Nenhum exercício encontrado</Text><Text style={{ color: colors.muted, marginTop: 5, fontSize: 11 }}>Altere o termo da busca, o músculo ou o filtro de favoritos.</Text></Card>}
    <Button variant="secondary" label="Abrir treino de hoje" onPress={() => router.push("/workout")} />
  </Screen>;
}

const styles = StyleSheet.create({ search: { height: 46, borderRadius: 13, borderWidth: 1, paddingHorizontal: 13, fontSize: 12 }, filterRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, favFilter: { borderWidth: 1, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 8 }, chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 7 }, chip: { borderRadius: 99, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 7 }, grid: { gap: 11 }, exerciseCard: { padding: 10 }, exerciseArt: { height: 117, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center", overflow: "hidden" }, artRing: { position: "absolute", width: 150, height: 150, borderRadius: 100, borderWidth: 1, top: -79, left: -45 }, artMuscle: { position: "absolute", left: 11, top: 10, fontSize: 8, fontWeight: "800", letterSpacing: 1 }, exerciseName: { fontSize: 14, fontWeight: "800", marginTop: 11 }, favorite: { width: 33, height: 32, alignItems: "center", justifyContent: "center" },
});
