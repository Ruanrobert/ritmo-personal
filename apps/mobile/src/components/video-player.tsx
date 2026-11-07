import { StyleSheet } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";

export function isDeviceVideo(uri: string) {
  return /^(file|content|ph|blob):/i.test(uri);
}

export function VideoPlayer({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, videoPlayer => { videoPlayer.loop = false; });
  return <VideoView player={player} style={styles.video} contentFit="contain" nativeControls fullscreenOptions={{ enable: true }} />;
}

const styles = StyleSheet.create({ video: { width: "100%", height: 218, borderRadius: 14, overflow: "hidden" } });
