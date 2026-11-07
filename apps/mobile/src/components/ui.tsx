import type { ComponentProps, ReactNode } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { useFitness } from "../lib/fitness-context";
import { sampleNotifications, trainer } from "../lib/demo-data";

export type IconName = ComponentProps<typeof Ionicons>["name"];
export type MciName = ComponentProps<typeof MaterialCommunityIcons>["name"];
export { Ionicons, MaterialCommunityIcons };

const MAX_WIDTH = 620;

/** Logo do Ritmo: halter estilizado + wordmark. */
export function Logo({ color = "#FFFFFF" }: { color?: string }) {
  return <View style={styles.logo} accessibilityRole="header" accessibilityLabel="Ritmo">
    <View style={[styles.logoMark, { borderColor: color }]}><MaterialCommunityIcons name="pulse" size={16} color={color} /></View>
    <Text style={[styles.logoText, { color }]}>RITMO<Text style={{ fontWeight: "400" }}> PERSONAL</Text></Text>
  </View>;
}

type ScreenProps = {
  children: ReactNode;
  activeTab?: string;
  showTabs?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  /** Título exibido na faixa azul-marinho do topo. */
  title?: string;
  subtitle?: string;
  /** Mostra "‹ Voltar" na faixa do topo. */
  back?: boolean;
  onBack?: () => void;
  /** Conteúdo livre dentro da faixa (substitui título/subtítulo). */
  hero?: ReactNode;
  /** Esconde a faixa do topo (telas de foco total). */
  bare?: boolean;
  /** Elemento fixo acima da barra de abas (ex.: botão Iniciar). */
  footer?: ReactNode;
};

export function Screen({ children, activeTab, showTabs = true, contentStyle, title, subtitle, back, onBack, hero, bare, footer }: ScreenProps) {
  const { colors } = useFitness();
  const hasBand = !bare;
  const overlap = hasBand && (hero || title) ? 52 : 0;
  return <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1, backgroundColor: colors.navy }}>
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 28 }} keyboardShouldPersistTaps="handled">
        {hasBand && <LinearGradient colors={[colors.navy, colors.navyDeep]} style={{ paddingBottom: overlap + 18 }}>
          <View style={styles.bandInner}>
            <View style={styles.topBar}>
              <View style={styles.topSide}>{back ? <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={onBack ?? (() => router.canGoBack() ? router.back() : router.replace("/"))} style={styles.backBtn} hitSlop={10}>
                <Ionicons name="chevron-back" size={20} color={colors.onNavy} /><Text style={{ color: colors.onNavy, fontSize: 14 }}>Voltar</Text>
              </Pressable> : null}</View>
              <Logo color={colors.onNavy} />
              <View style={[styles.topSide, { alignItems: "flex-end" }]}>
                <Pressable accessibilityRole="button" accessibilityLabel={`Avisos, ${sampleNotifications.length} novos`} onPress={() => router.push("/notifications")} style={styles.bell}>
                  <Ionicons name="notifications" size={20} color={colors.navy} />
                  <View style={[styles.badge, { backgroundColor: colors.danger }]}><Text style={styles.badgeText}>{sampleNotifications.length}</Text></View>
                </Pressable>
              </View>
            </View>
            {hero ?? (title ? <View style={styles.bandTitleWrap}>
              <Text style={[styles.bandTitle, { color: colors.onNavy }]}>{title}</Text>
              {subtitle ? <Text style={{ color: colors.onNavyMuted, fontSize: 13, marginTop: 4 }}>{subtitle}</Text> : null}
            </View> : null)}
          </View>
        </LinearGradient>}
        <View style={[styles.content, { marginTop: -overlap }, contentStyle]}>{children}</View>
      </ScrollView>
      {footer ? <View style={[styles.footer, { backgroundColor: colors.bg, borderColor: colors.line }]}><View style={styles.footerInner}>{footer}</View></View> : null}
      {showTabs && <TabBar active={activeTab ?? ""} />}
    </View>
  </SafeAreaView>;
}

/** Cabeçalho dentro do conteúdo (telas de conclusão, estados vazios). */
export function Header({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string; showProfile?: boolean }) {
  const { colors } = useFitness();
  return <View style={{ gap: 4 }}>
    {eyebrow ? <Text style={[styles.eyebrow, { color: colors.blue }]}>{eyebrow}</Text> : null}
    <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
    {subtitle ? <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 19 }}>{subtitle}</Text> : null}
  </View>;
}

export function Card({ children, style, tone = "default" }: { children: ReactNode; style?: StyleProp<ViewStyle>; tone?: "default" | "raised" }) {
  const { colors } = useFitness();
  return <View style={[styles.card, { backgroundColor: tone === "raised" ? colors.raised : colors.card, borderColor: colors.line }, style]}>{children}</View>;
}

type ButtonVariant = "primary" | "secondary" | "quiet" | "success" | "outline";

export function Button({ label, onPress, variant = "primary", icon, iconName }: { label: string; onPress: () => void; variant?: ButtonVariant; icon?: string; iconName?: IconName }) {
  const { colors } = useFitness();
  const bg = variant === "primary" ? colors.mint : variant === "success" ? colors.success : variant === "secondary" ? colors.raised : variant === "outline" ? colors.card : "transparent";
  const fg = variant === "primary" || variant === "success" ? "#FFFFFF" : variant === "outline" ? colors.blue : variant === "quiet" ? colors.muted : colors.text;
  const border = variant === "outline" ? colors.blue : variant === "secondary" ? colors.line : "transparent";
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.button, { backgroundColor: bg, borderColor: border, opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] }, variant === "quiet" && styles.quietButton]}>
    {iconName ? <Ionicons name={iconName} size={17} color={fg} /> : null}
    <Text style={{ color: fg, fontSize: variant === "success" ? 15 : 14, fontWeight: "800", letterSpacing: variant === "success" ? 0.6 : 0 }}>{icon ? `${icon}  ` : ""}{label}</Text>
  </Pressable>;
}

export function SectionHeading({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const { colors } = useFitness();
  return <View style={styles.sectionHeading}><Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>{action && onAction ? <Pressable accessibilityRole="button" onPress={onAction}><Text style={{ color: colors.blue, fontSize: 13, fontWeight: "700" }}>{action} ›</Text></Pressable> : null}</View>;
}

export function Tag({ label, color = "muted" }: { label: string; color?: "muted" | "mint" | "blue" | "warning" | "success" }) {
  const { colors } = useFitness();
  const textColor = color === "mint" || color === "blue" ? colors.blue : color === "warning" ? colors.warning : color === "success" ? colors.success : colors.muted;
  const bgColor = color === "muted" ? colors.raised : `${textColor}1A`;
  return <View style={[styles.tag, { backgroundColor: bgColor }]}><Text style={{ color: textColor, fontSize: 11, fontWeight: "700" }}>{label}</Text></View>;
}

export function Metric({ label, value, detail, accent }: { label: string; value: string; detail?: string; accent?: boolean }) {
  const { colors } = useFitness();
  return <Card style={styles.metric}><Text style={[styles.eyebrow, { color: colors.muted }]}>{label}</Text><Text style={[styles.metricValue, { color: colors.text }]}>{value}</Text>{detail ? <Text style={{ color: accent ? colors.success : colors.muted, fontSize: 11, marginTop: 4 }}>{detail}</Text> : null}</Card>;
}

/** Círculo azul com ícone — usado em atalhos e listas. */
export function IconBubble({ name, size = 52, filled = true }: { name: IconName; size?: number; filled?: boolean }) {
  const { colors } = useFitness();
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: filled ? colors.mint : colors.blueDeep, alignItems: "center", justifyContent: "center" }}>
    <Ionicons name={name} size={size * 0.44} color={filled ? "#FFFFFF" : colors.blue} />
  </View>;
}

/** Atalho azul-marinho com ícone em círculo (grade da Home). */
export function Tile({ label, detail, icon, onPress }: { label: string; detail?: string; icon: IconName; onPress: () => void }) {
  const { colors } = useFitness();
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.tile, { backgroundColor: colors.tile, opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
    <IconBubble name={icon} size={46} />
    <View style={{ flex: 1 }}>
      <Text style={{ color: colors.onNavy, fontSize: 15, fontWeight: "800" }} numberOfLines={1}>{label}</Text>
      {detail ? <Text style={{ color: colors.onNavyMuted, fontSize: 11, marginTop: 2 }} numberOfLines={1}>{detail}</Text> : null}
    </View>
  </Pressable>;
}

export async function openWhatsApp() {
  try { await Linking.openURL(`https://wa.me/${trainer.whatsapp}`); } catch { /* app ausente */ }
}

export async function openInstagram() {
  try { await Linking.openURL(`https://instagram.com/${trainer.instagram}`); } catch { /* app ausente */ }
}

export function TabBar({ active }: { active: string }) {
  const { colors } = useFitness();
  const tabs: { label: string; icon: IconName; iconActive: IconName; href?: Href; action?: () => void; id: string }[] = [
    { label: "Início", icon: "home-outline", iconActive: "home", href: "/", id: "home" },
    { label: "Treinos", icon: "barbell-outline", iconActive: "barbell", href: "/workouts", id: "workouts" },
    { label: "Evolução", icon: "stats-chart-outline", iconActive: "stats-chart", href: "/progress", id: "progress" },
    { label: "WhatsApp", icon: "logo-whatsapp", iconActive: "logo-whatsapp", action: openWhatsApp, id: "whatsapp" },
    { label: "Menu", icon: "menu-outline", iconActive: "menu", href: "/profile", id: "profile" },
  ];
  return <SafeAreaView edges={["bottom"]} style={{ backgroundColor: colors.navy }}>
    <View style={styles.tabBar}>{tabs.map(tab => {
      const selected = active === tab.id;
      const color = selected ? colors.tabActive : colors.onNavy;
      return <Pressable key={tab.id} accessibilityRole="tab" accessibilityLabel={tab.label} accessibilityState={{ selected }} onPress={() => tab.action ? void tab.action() : tab.href && router.push(tab.href)} style={styles.tab}>
        <Ionicons name={selected ? tab.iconActive : tab.icon} size={24} color={color} />
        <Text style={{ color, fontSize: 11, fontWeight: selected ? "800" : "500" }}>{tab.label}</Text>
        {selected && <View style={[styles.tabDot, { backgroundColor: colors.tabActive }]} />}
      </Pressable>;
    })}</View>
  </SafeAreaView>;
}

export function DemoNote({ children }: { children: ReactNode }) {
  const { colors } = useFitness();
  return <View style={[styles.demoNote, { backgroundColor: colors.blueDeep }]}><Ionicons name="information-circle-outline" size={16} color={colors.blue} /><Text style={{ color: colors.blue, fontSize: 11, lineHeight: 16, flex: 1 }}>{children}</Text></View>;
}

export const uiStyles = StyleSheet.create({ row: { flexDirection: "row", alignItems: "center", gap: 10 }, spread: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, small: { fontSize: 11 }, body: { fontSize: 13, lineHeight: 19 } });

const styles = StyleSheet.create({
  logo: { flexDirection: "row", alignItems: "center", gap: 8 },
  logoMark: { width: 28, height: 28, borderRadius: 8, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  logoText: { fontSize: 18, fontWeight: "900", letterSpacing: 0.5 },
  bandInner: { width: "100%", maxWidth: MAX_WIDTH, alignSelf: "center", paddingHorizontal: 18 },
  topBar: { flexDirection: "row", alignItems: "center", minHeight: 64 },
  topSide: { flex: 1 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 2 },
  bell: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", top: -3, right: -3, minWidth: 17, height: 17, borderRadius: 9, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  badgeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "900" },
  bandTitleWrap: { paddingTop: 10 },
  bandTitle: { fontSize: 26, fontWeight: "700", letterSpacing: -0.3 },
  content: { width: "100%", maxWidth: MAX_WIDTH, alignSelf: "center", paddingHorizontal: 16, gap: 14 },
  footer: { borderTopWidth: 1, paddingHorizontal: 16, paddingVertical: 10 },
  footerInner: { width: "100%", maxWidth: MAX_WIDTH, alignSelf: "center" },
  eyebrow: { fontSize: 10, fontWeight: "800", letterSpacing: 1.2 },
  title: { fontSize: 24, fontWeight: "800", letterSpacing: -0.4 },
  card: { borderRadius: 14, borderWidth: 1, padding: 18, boxShadow: "0px 4px 14px rgba(26, 38, 57, 0.08)" },
  button: { minHeight: 50, borderRadius: 10, borderWidth: 1.5, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, paddingHorizontal: 16, flex: 1 },
  quietButton: { minHeight: 40, paddingHorizontal: 8 },
  sectionHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6 },
  sectionTitle: { fontSize: 18, fontWeight: "800" },
  tag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 },
  metric: { flex: 1, padding: 14, minHeight: 91 },
  metricValue: { fontSize: 22, fontWeight: "900", marginTop: 6 },
  tile: { flexBasis: "47%", flexGrow: 1, minHeight: 92, borderRadius: 10, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 14 },
  tabBar: { minHeight: 66, flexDirection: "row", alignItems: "center", justifyContent: "space-around", width: "100%", maxWidth: 900, alignSelf: "center" },
  tab: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3, minHeight: 62 },
  tabDot: { position: "absolute", top: 4, width: 18, height: 3, borderRadius: 2 },
  demoNote: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, flexDirection: "row", gap: 8, alignItems: "flex-start" },
});
