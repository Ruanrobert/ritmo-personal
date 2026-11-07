import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, Text, View } from "react-native";
import { FitnessProvider, useFitness } from "../lib/fitness-context";

function AppNavigator() {
  const { colors, ready } = useFitness();
  if (!ready) return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.navyDeep, gap: 12 }}><ActivityIndicator color={colors.tabActive} /><Text style={{ color: colors.onNavyMuted, fontSize: 12 }}>Abrindo seu espaço de treino…</Text></View>;
  return <><StatusBar style="light" /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: "fade_from_bottom" }} /></>;
}

export default function RootLayout() {
  return <FitnessProvider><AppNavigator /></FitnessProvider>;
}
