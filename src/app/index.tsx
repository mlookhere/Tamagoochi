import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Page } from '../components/Page';
import { clean, createCompanion, feed, play } from '../domain/pet/state';

type StatProps = Readonly<{ label: string; value: number }>;

function Stat({ label, value }: StatProps) {
  return (
    <View style={styles.stat}>
      <View style={styles.statLabels}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${value}%` }]} />
      </View>
    </View>
  );
}

export default function Home() {
  const [pet, setPet] = useState(() => createCompanion());
  const [message, setMessage] = useState('A new little friend is waiting for you.');

  return (
    <Page
      eyebrow="Your tiny world"
      title="Home is wherever you are."
      description="Meet your little companion. Taking care of each other is just the beginning."
    >
      <View style={styles.habitat}>
        <View style={styles.sun} />
        <View style={styles.floor} />
        <View style={styles.pet}>
          <View style={styles.earLeft} />
          <View style={styles.earRight} />
          <View style={styles.body}>
            <View style={styles.face}>
              <View style={styles.eye} />
              <View style={styles.eye} />
            </View>
            <View style={styles.mouth} />
          </View>
        </View>
        <Text style={styles.name}>{pet.name}</Text>
        <Text style={styles.mood}>{message}</Text>
      </View>

      <View style={styles.stats}>
        <Stat label="Fullness" value={pet.hunger} />
        <Stat label="Joy" value={pet.happiness} />
        <Stat label="Energy" value={pet.energy} />
        <Stat label="Cleanliness" value={pet.cleanliness} />
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Feed companion"
          style={styles.action}
          onPress={() => {
            setPet(feed);
            setMessage('A happy little snack break.');
          }}
        >
          <Text style={styles.actionTitle}>Feed</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Play with companion"
          style={styles.action}
          onPress={() => {
            setPet(play);
            setMessage('That was fun!');
          }}
        >
          <Text style={styles.actionTitle}>Play</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clean companion"
          style={styles.action}
          onPress={() => {
            setPet(clean);
            setMessage('Fresh and ready for adventure.');
          }}
        >
          <Text style={styles.actionTitle}>Clean</Text>
        </Pressable>
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  habitat: {
    height: 275,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderRadius: 25,
    paddingBottom: 15,
    backgroundColor: '#DCEBCD',
  },
  sun: { position: 'absolute', top: 24, right: 32, width: 54, height: 54, backgroundColor: '#FCEB9A', borderRadius: 27 },
  floor: { position: 'absolute', bottom: 0, height: 82, width: '100%', backgroundColor: '#C4DBB2' },
  pet: { height: 128, width: 138, position: 'relative', justifyContent: 'flex-end', alignItems: 'center' },
  earLeft: { position: 'absolute', top: 3, left: 20, width: 43, height: 64, backgroundColor: '#FAE8BC', borderRadius: 23, transform: [{ rotate: '-23deg' }] },
  earRight: { position: 'absolute', top: 3, right: 20, width: 43, height: 64, backgroundColor: '#FAE8BC', borderRadius: 23, transform: [{ rotate: '23deg' }] },
  body: { width: 135, height: 110, borderRadius: 58, backgroundColor: '#FFF0C9', borderWidth: 3, borderColor: '#CFAF80', alignItems: 'center', justifyContent: 'center' },
  face: { width: 65, flexDirection: 'row', justifyContent: 'space-between', marginTop: 0 },
  eye: { width: 13, height: 19, backgroundColor: '#354537', borderRadius: 7 },
  mouth: { width: 15, height: 7, borderBottomWidth: 2, borderColor: '#354537', borderBottomLeftRadius: 8, borderBottomRightRadius: 8, marginTop: 8 },
  name: { marginTop: 9, fontSize: 21, fontWeight: '800', color: '#2D4A38' },
  mood: { marginTop: 3, color: '#567159', fontSize: 12, fontWeight: '600' },
  stats: { paddingTop: 22, gap: 14 },
  stat: { gap: 6 },
  statLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  statLabel: { fontSize: 13, fontWeight: '700', color: '#415849' },
  statValue: { fontSize: 12, color: '#708778' },
  track: { height: 8, borderRadius: 8, backgroundColor: '#E5E9DC', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 8, backgroundColor: '#8DBB81' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 28, marginBottom: 25 },
  action: { flex: 1, borderRadius: 15, backgroundColor: '#345E46', paddingVertical: 15, alignItems: 'center' },
  actionTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
