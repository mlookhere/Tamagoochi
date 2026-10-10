import { Image, StyleSheet, Text, View } from 'react-native';
import { ONBOARDING_ART } from '../assets/onboarding';
import { colors } from '../theme';
import { ONBOARDING_ILLUSTRATIONS } from '../theme/onboarding';

export function OnboardingStoryboard() {
  return (
    <View style={styles.section}>
      <Text style={styles.eyebrow}>ONBOARDING ART STUDIES</Text>
      <Text style={styles.title}>First moments together</Text>
      <Text style={styles.notice}>
        Original visual concepts for a future first-run experience. These
        illustrations are not an interactive onboarding flow.
      </Text>
      {ONBOARDING_ILLUSTRATIONS.map((scene) => (
        <View key={scene.key} style={styles.card}>
          <Image
            accessible
            accessibilityRole="image"
            accessibilityLabel={scene.description}
            source={ONBOARDING_ART[scene.key]}
            resizeMode="contain"
            style={styles.artwork}
          />
          <Text style={styles.caption}>{scene.caption}</Text>
          <Text style={styles.heading}>{scene.title}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 36, paddingBottom: 14 },
  eyebrow: {
    color: colors.moss,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  title: { color: colors.ink, fontSize: 22, fontWeight: '800', marginTop: 8 },
  notice: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 16,
  },
  card: {
    alignItems: 'center',
    backgroundColor: colors.paper,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 22,
    padding: 15,
    marginBottom: 14,
  },
  artwork: { width: '100%', maxWidth: 320, aspectRatio: 4 / 3 },
  caption: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 8,
  },
  heading: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 7,
    textAlign: 'center',
  },
});
