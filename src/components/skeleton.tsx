import { Palette } from '@/constants/theme';
import { useEffect, useState } from 'react';
import { Animated, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

//una barra gris que "respira", para marcar que algo está cargando
export function SkeletonBox({ style }: { style?: StyleProp<ViewStyle> }) {
  const [opacity] = useState(() => new Animated.Value(0.4));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={[{ backgroundColor: Palette.skeleton, opacity }, style]} />;
}

//seis filas con la forma de un chat: círculo + dos líneas
export function ChatListSkeleton() {
  return (
    <View>
      {Array.from({ length: 6 }).map((_, i) => (
        <View key={i} style={styles.row}>
          <SkeletonBox style={styles.avatar} />
          <View style={styles.lines}>
            <SkeletonBox style={styles.lineShort} />
            <SkeletonBox style={styles.lineLong} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 10 },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  lines: { flex: 1, gap: 8 },
  lineShort: { height: 14, width: '40%', borderRadius: 7 },
  lineLong: { height: 12, width: '75%', borderRadius: 6 },
});