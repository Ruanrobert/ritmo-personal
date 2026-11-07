import { Alert, Platform } from "react-native";

/** Alert.alert não exibe nada no React Native Web; lá usamos window.confirm/alert. */
export function confirmAction(title: string, message: string, confirmLabel: string, onConfirm: () => void) {
  if (Platform.OS === "web") {
    if (globalThis.confirm?.(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [{ text: "Cancelar", style: "cancel" }, { text: confirmLabel, style: "destructive", onPress: onConfirm }]);
}

export function notify(title: string, message: string) {
  if (Platform.OS === "web") globalThis.alert?.(`${title}\n\n${message}`);
  else Alert.alert(title, message);
}
