import { ReactNode, useEffect, useState } from 'react';
import { Animated } from 'react-native';

//aparece con un "pop": arranca chico y rebota hasta su tamaño
export function PopIn({ animate, children }: { animate: boolean; children: ReactNode }) {
  const [scale] = useState(() => new Animated.Value(animate ? 0.3 : 1));

  useEffect(() => {
    if (!animate) return;
    Animated.spring(scale, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }).start();
  }, [animate, scale]);

  return <Animated.View style={{ transform: [{ scale }] }}>{children}</Animated.View>;
}

//un dato recién revelado: aparece con fundido y sube un poquito
export function FadeInValue({ animate, children }: { animate: boolean; children: ReactNode }) {
  const [opacity] = useState(() => new Animated.Value(animate ? 0 : 1));
  const [lift] = useState(() => new Animated.Value(animate ? 10 : 0));

  useEffect(() => {
    if (!animate) return;
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(lift, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [animate, opacity, lift]);

  return (
    <Animated.View style={{ flex: 1, opacity, transform: [{ translateY: lift }] }}>
      {children}
    </Animated.View>
  );
}