import { ThemedText } from '@/components/themed-text';
import { Palette } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

type Props = {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  text?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ icon, title, text, actionLabel, onAction }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.circle}>
        <Ionicons name={icon} size={44} color={Palette.primary} />
      </View>
      <ThemedText style={styles.title}>{title}</ThemedText>
      {text ? <ThemedText style={styles.text}>{text}</ThemedText> : null}
      {actionLabel && onAction ? (
        <Pressable style={styles.button} onPress={onAction}>
          <ThemedText style={styles.buttonText}>{actionLabel}</ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingHorizontal: 32, paddingTop: 64, gap: 12 },
  circle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(60,135,247,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  text: { fontSize: 15, textAlign: 'center', opacity: 0.7, lineHeight: 22 },
  button: {
    marginTop: 8,
    backgroundColor: Palette.primary,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});