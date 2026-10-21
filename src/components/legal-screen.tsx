import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { LEGAL } from '@/constants/legal';
import type { Block, Section } from '@/constants/legal-texts';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function renderBlock(block: Block, key: number) {
  if (typeof block === 'string') {
    return <ThemedText key={key} style={styles.paragraph}>{block}</ThemedText>;
  }
  if (Array.isArray(block)) {
    return (
      <ThemedView key={key} style={styles.list}>
        {block.map((item, i) => (
          <ThemedView key={i} style={styles.bulletRow}>
            <ThemedText style={styles.bullet}>•</ThemedText>
            <ThemedText style={styles.bulletText}>{item}</ThemedText>
          </ThemedView>
        ))}
      </ThemedView>
    );
  }
  return (
    <ThemedView key={key} style={styles.list}>
      {block.table.map(([label, value], i) => (
        <ThemedView key={i} style={styles.tableRow}>
          <ThemedText style={styles.tableLabel}>{label}</ThemedText>
          <ThemedText style={styles.tableValue}>{value}</ThemedText>
        </ThemedView>
      ))}
    </ThemedView>
  );
}

export function LegalScreen({ title, sections }: { title: string; sections: Section[] }) {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScreenHeader title={title} />
      <ScrollView contentContainerStyle={styles.content}>
        {sections.map((section, i) => (
          <ThemedView key={i} style={styles.section}>
            {section.heading && <ThemedText style={styles.heading}>{section.heading}</ThemedText>}
            {section.blocks.map((block, j) => renderBlock(block, j))}
          </ThemedView>
        ))}
        <ThemedText style={styles.footer}>
          {LEGAL.appName} · vigente desde {LEGAL.effectiveDate}
        </ThemedText>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 48 },
  section: { marginBottom: 20, gap: 8 },
  heading: { fontSize: 18, lineHeight: 26, fontWeight: '700' },
  paragraph: { fontSize: 15, lineHeight: 23, opacity: 0.9 },
  list: { gap: 6 },
  bulletRow: { flexDirection: 'row', gap: 8 },
  bullet: { fontSize: 15, lineHeight: 23 },
  bulletText: { flex: 1, fontSize: 15, lineHeight: 23, opacity: 0.9 },
  tableRow: {
    gap: 2,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  tableLabel: { fontSize: 15, lineHeight: 22, fontWeight: '600' },
  tableValue: { fontSize: 14, lineHeight: 21, opacity: 0.7 },
  footer: { fontSize: 12, opacity: 0.5, textAlign: 'center', marginTop: 8 },
});