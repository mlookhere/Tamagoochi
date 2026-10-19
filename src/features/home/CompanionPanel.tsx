import { Pressable, StyleSheet, Text, View } from 'react-native';
import { itemCount, type Inventory } from '../../domain/items/inventory';
import {
  companionPlacement,
  roomMood,
  type WorkshopBond,
} from './companionResponse';
import { RoomCompanion } from './RoomCompanion';
import type { Room } from './room';

type Props = Readonly<{
  bond: WorkshopBond;
  room: Room;
  inventory: Inventory;
  reduceMotion: boolean;
  onShare: () => void;
}>;

export function CompanionPanel({
  bond,
  room,
  inventory,
  reduceMotion,
  onShare,
}: Props) {
  const snacks = itemCount(inventory, 'picnicSnack');
  const unavailable = snacks === 0;

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>Mochi&apos;s corner</Text>
      <Text style={styles.progress}>
        Bond {bond.bond}/100 · Curiosity {bond.personality.curiosity}
        {' · '}Courage {bond.personality.courage}
        {' · '}Focus {bond.personality.focus}
      </Text>
      <RoomCompanion
        placement={companionPlacement(room)}
        reduceMotion={reduceMotion}
      />
      <Text style={styles.mood}>{roomMood(room)}</Text>
      <Text style={styles.ingredients}>
        Craft a picnic snack to share with Mochi. The first one adds bond.
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Share picnic snack with Mochi"
        accessibilityHint="Spends one crafted picnic snack"
        accessibilityState={{ disabled: unavailable }}
        disabled={unavailable}
        onPress={onShare}
        style={[styles.button, unavailable && styles.unavailable]}
      >
        <Text style={styles.buttonText}>Share snack ({snacks})</Text>
      </Pressable>
      <Text style={styles.ingredients}>
        Each minigame strengthens your bond once. Replays have no penalty.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginTop: 14,
    padding: 14,
    gap: 6,
    backgroundColor: '#EFF2E7',
    borderRadius: 14,
  },
  title: { fontSize: 14, fontWeight: '700', color: '#324B38' },
  progress: { color: '#365742', fontWeight: '700', fontSize: 12 },
  mood: { color: '#526E58', fontSize: 13, lineHeight: 19 },
  ingredients: { fontSize: 12, color: '#6B7A6D' },
  button: {
    alignSelf: 'flex-start',
    marginTop: 6,
    minWidth: 72,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#345E46',
  },
  unavailable: { opacity: 0.45 },
  buttonText: { color: '#FFFFFF', fontWeight: '800' },
});
