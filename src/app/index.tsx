import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { RoomScene } from '../components/RoomScene';
import { Page } from '../components/Page';
import { clean, createCompanion, feed, play } from '../domain/pet/state';
import { useSystemReduceMotion } from '../hooks/useSystemReduceMotion';
import { colors } from '../theme';
import { motionDisabled } from '../theme/accessibility';
import { stackCareActions } from '../theme/layout';
import { type CompanionPose, reactionResetDelay } from '../theme/motion';

type StatProps = Readonly<{ label: string; value: number }>;
type Reaction = { pose: CompanionPose; nonce: number };

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
  const { fontScale } = useWindowDimensions();
  const stackedActions = stackCareActions(fontScale);
  const reducedMotion = motionDisabled(useSystemReduceMotion());
  const [pet, setPet] = useState(() => createCompanion());
  const [message, setMessage] = useState(
    'A new little friend is waiting for you.',
  );

  const [reaction, setReaction] = useState<Reaction>({
    pose: 'idle',
    nonce: 0,
  });

  useEffect(() => {
    const delay = reactionResetDelay(reaction.pose, reducedMotion);
    if (!delay) return;
    const nonce = reaction.nonce;
    const timer = setTimeout(() => {
      setReaction((current) =>
        current.nonce === nonce ? { ...current, pose: 'idle' } : current,
      );
    }, delay);
    return () => clearTimeout(timer);
  }, [reaction, reducedMotion]);

  return (
    <Page
      eyebrow="Your tiny world"
      title="Home is wherever you are."
      description="Meet your little companion. Taking care of each other is just the beginning."
    >
      <RoomScene
        name={pet.name}
        pose={reaction.pose}
        reactionId={reaction.nonce}
        message={message}
      />

      <View style={styles.stats}>
        <Stat label="Fullness" value={pet.hunger} />
        <Stat label="Joy" value={pet.happiness} />
        <Stat label="Energy" value={pet.energy} />
        <Stat label="Cleanliness" value={pet.cleanliness} />
      </View>

      <View style={[styles.actions, stackedActions && styles.actionsStacked]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Feed companion"
          style={[styles.action, stackedActions && styles.actionStacked]}
          onPress={() => {
            setPet(feed);
            setMessage('A happy little snack break.');
            setReaction((current) => ({
              pose: 'eat',
              nonce: current.nonce + 1,
            }));
          }}
        >
          <Text style={styles.actionTitle}>Feed</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Play with companion"
          style={[styles.action, stackedActions && styles.actionStacked]}
          onPress={() => {
            setPet(play);
            setMessage('That was fun!');
            setReaction((current) => ({
              pose: 'play',
              nonce: current.nonce + 1,
            }));
          }}
        >
          <Text style={styles.actionTitle}>Play</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clean companion"
          style={[styles.action, stackedActions && styles.actionStacked]}
          onPress={() => {
            setPet(clean);
            setMessage('Fresh and ready for adventure.');
            setReaction((current) => ({
              pose: 'clean',
              nonce: current.nonce + 1,
            }));
          }}
        >
          <Text style={styles.actionTitle}>Clean</Text>
        </Pressable>
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  stats: { paddingTop: 22, gap: 14 },
  stat: { gap: 6 },
  statLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  statLabel: { fontSize: 13, fontWeight: '700', color: colors.ink },
  statValue: { fontSize: 12, color: colors.muted },
  track: {
    height: 8,
    borderRadius: 8,
    backgroundColor: colors.track,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 8, backgroundColor: colors.fern },
  actions: { flexDirection: 'row', gap: 10, marginTop: 28, marginBottom: 25 },
  actionsStacked: { flexDirection: 'column' },
  action: {
    flex: 1,
    borderRadius: 15,
    backgroundColor: colors.moss,
    paddingVertical: 15,
    alignItems: 'center',
  },
  actionStacked: { flex: 0, width: '100%', minHeight: 48, justifyContent: 'center' },
  actionTitle: { color: colors.white, fontSize: 14, fontWeight: '800' },
});
