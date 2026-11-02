import { useEffect, useState } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';

export function RevealPhoto({ uri, size, animate }: { uri: string; size: number; animate: boolean }) {
  const [overlay] = useState(() => new Animated.Value(animate ? 1 : 0));

  useEffect(() => {
    if (!animate) return;
    Animated.timing(overlay, {
      toValue: 0,
      duration: 1000,
      delay: 200,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={{ width: size, height: size, borderRadius: 12, overflow: 'hidden' }}>
      <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: overlay }]} pointerEvents="none">
        <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" blurRadius={30} />
      </Animated.View>
    </View>
  );
}