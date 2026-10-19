import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { ROOM_SLOTS } from './room';
import type { CompanionPlacement } from './companionResponse';

const OFFSETS = { window: -54, nook: 0, garden: 54 } as const;

type Props = Readonly<{
  placement: CompanionPlacement;
  reduceMotion: boolean;
}>;

export function RoomCompanion({ placement, reduceMotion }: Props) {
  const [offset] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const target = OFFSETS[placement.slot];
    if (reduceMotion) {
      offset.stopAnimation();
      offset.setValue(target);
      return;
    }
    const spring = Animated.spring(offset, {
      toValue: target,
      friction: 8,
      tension: 85,
      useNativeDriver: true,
    });
    spring.start();
    return () => spring.stop();
  }, [offset, placement.slot, reduceMotion]);

  return (
    <View style={styles.scene}>
      <Animated.View
        style={[styles.character, { transform: [{ translateX: offset }] }]}
        accessible
        accessibilityLabel={
          'Mochi is ' + placement.mood + ' near the ' + ROOM_SLOTS[placement.slot]
        }
      >
        <View style={styles.earRow}>
          <View style={styles.ear} />
          <View style={styles.ear} />
        </View>
        <View style={styles.head}>
          <View style={styles.eyes}>
            <View style={styles.eye} />
            <View style={styles.eye} />
          </View>
          <View
            style={[
              styles.mouth,
              placement.mood === 'shy' && styles.shyMouth,
            ]}
          />
        </View>
      </Animated.View>
      <Text style={styles.caption}>
        {placement.mood === 'resting' ? 'Resting' : 'Feeling ' + placement.mood}
        {' · '}
        {ROOM_SLOTS[placement.slot]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scene: {
    minHeight: 142,
    borderRadius: 16,
    backgroundColor: '#DFEBD5',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    overflow: 'hidden',
  },
  character: { width: 90, height: 87, alignItems: 'center' },
  earRow: {
    position: 'absolute',
    top: 1,
    width: 80,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ear: {
    width: 26,
    height: 48,
    borderRadius: 18,
    backgroundColor: '#F8E4B7',
    borderWidth: 2,
    borderColor: '#CFAF80',
  },
  head: {
    width: 86,
    height: 63,
    marginTop: 23,
    borderRadius: 36,
    backgroundColor: '#FFF0C9',
    borderWidth: 2,
    borderColor: '#CFAF80',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyes: { flexDirection: 'row', gap: 25 },
  eye: { width: 9, height: 13, borderRadius: 5, backgroundColor: '#354537' },
  mouth: {
    width: 14,
    height: 7,
    marginTop: 6,
    borderBottomWidth: 2,
    borderColor: '#354537',
    borderBottomLeftRadius: 7,
    borderBottomRightRadius: 7,
  },
  shyMouth: { width: 7, borderRadius: 7, borderWidth: 2 },
  caption: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
    color: '#345E46',
    textAlign: 'center',
  },
});
