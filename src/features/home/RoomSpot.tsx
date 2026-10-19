import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';

type Props = Readonly<{
  label: string;
  itemName: string | null;
  onPress: () => void;
  reduceMotion: boolean;
}>;

export function RoomSpot({ label, itemName, onPress, reduceMotion }: Props) {
  const [scale] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (reduceMotion) {
      scale.stopAnimation();
      scale.setValue(1);
      return;
    }
    scale.setValue(0.88);
    const spring = Animated.spring(scale, {
      toValue: 1,
      friction: 7,
      tension: 110,
      useNativeDriver: true,
    });
    spring.start();
    return () => spring.stop();
  }, [itemName, reduceMotion, scale]);

  return (
    <Animated.View style={[styles.animated, { transform: [{ scale }] }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label + ', ' + (itemName ?? 'empty')}
        accessibilityHint={
          itemName ? 'Pick up this object' : 'Place the selected object'
        }
        onPress={onPress}
        style={({ pressed }) => [styles.spot, pressed && styles.pressed]}
      >
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.object}>{itemName ?? 'Empty space'}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  animated: { flex: 1 },
  spot: {
    minHeight: 88,
    padding: 9,
    borderRadius: 14,
    backgroundColor: '#E5EEDC',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  pressed: { opacity: 0.82, transform: [{ scale: 0.97 }] },
  label: { fontSize: 12, fontWeight: '700', color: '#365742' },
  object: { fontSize: 12, color: '#4F6954', textAlign: 'center' },
});
