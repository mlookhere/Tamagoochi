import type { ReactNode } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

type Props = Readonly<{
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}>;

export function Page({ eyebrow, title, description, children }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <View style={styles.body}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { flexGrow: 1, padding: 26, paddingTop: 42 },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    color: colors.muted,
  },
  title: {
    marginTop: 13,
    fontSize: 35,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -1,
  },
  description: {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 25,
    color: colors.muted,
  },
  body: { flex: 1, paddingTop: 30 },
});
