import { Image, StyleSheet, Text, View } from 'react-native';
import { WORLD_ART } from '../assets/world';
import { WORLD_ILLUSTRATIONS, type WorldArtCategory } from '../theme/world';
import { colors } from '../theme';

type KindProps = Readonly<{ category: WorldArtCategory }>;

function IllustrationGroup({ category }: KindProps) {
  const entries = WORLD_ILLUSTRATIONS.filter((entry) => entry.category === category);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {category === 'item' ? 'Little things to find' : 'Places to remember'}
      </Text>
      <View style={styles.collection}>
        {entries.map((entry) => (
          <View key={entry.key} style={styles.cell}>
            <View style={styles.tile}>
              <Image
                accessible
                accessibilityRole="image"
                accessibilityLabel={entry.label + ': ' + entry.detail}
                source={WORLD_ART[entry.key]}
                resizeMode="contain"
                style={styles.artwork}
              />
              <View style={styles.words}>
                <Text style={styles.label}>{entry.label}</Text>
                <Text style={styles.detail}>{entry.detail}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export function WorldDiscoveryPreview() {
  return (
    <View style={styles.gallery}>
      <Text style={styles.kicker}>THE DISCOVERY SKETCHBOOK</Text>
      <Text style={styles.heading}>Small wonders, close to home.</Text>
      <Text style={styles.notice}>
        Original artwork previews. Finding and collecting them is coming later.
      </Text>
      <IllustrationGroup category="item" />
      <IllustrationGroup category="landmark" />
    </View>
  );
}

const styles = StyleSheet.create({
  gallery: { marginTop: 26, paddingBottom: 28 },
  kicker: {
    color: colors.moss,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.7,
  },
  heading: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 7,
  },
  notice: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
  section: { marginTop: 22 },
  sectionTitle: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  collection: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  cell: { width: '50%', padding: 4 },
  tile: {
    minHeight: 106,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 17,
    backgroundColor: colors.paper,
    padding: 7,
    flexDirection: 'row',
    alignItems: 'center',
  },
  artwork: { width: 54, height: 54 },
  words: { flex: 1, paddingLeft: 6 },
  label: { color: colors.ink, fontSize: 12, fontWeight: '800' },
  detail: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 3 },
});
