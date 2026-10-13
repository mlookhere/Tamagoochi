import { StyleSheet, View } from 'react-native';
import { colors } from '../theme';
import type { CompanionPose } from '../theme/motion';
import { poseAccentFor } from '../theme/pose-art';

type Props = Readonly<{ pose: CompanionPose }>;

const positions = [
  { left: 10, top: 31 },
  { left: 138, top: 19 },
  { left: 150, top: 65 },
] as const;

const accentColors = {
  trail: ['#B58E70', '#CEAE8B', '#C49F7A'],
  berries: ['#CF7D79', '#E6A49A', '#CF7D79'],
  moon: [colors.sun, colors.paper, colors.sun],
  bubbles: ['#AED7DC', '#D0EAF0', '#AED7DC'],
  petals: [colors.blush, colors.sun, colors.fern],
  sparkles: [colors.sun, colors.blush, colors.sun],
  raindrops: ['#93BFC7', '#C1DFE7', '#93BFC7'],
  leaf: [colors.fern, colors.moss, colors.fern],
  rays: [colors.sun, colors.blush, colors.sun],
} as const;

export function CompanionPoseAccent({ pose }: Props) {
  const kind = poseAccentFor(pose);
  if (!kind) return null;

  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={styles.layer}
    >
      {positions.map((spot, index) => (
        <View
          key={index}
          style={[
            styles.mark,
            styles[kind],
            spot,
            { backgroundColor: accentColors[kind][index] },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    width: 175,
    height: 175,
  },
  mark: {
    position: 'absolute',
    width: 11,
    height: 11,
    borderRadius: 6,
  },
  trail: {
    width: 8,
    height: 13,
    borderRadius: 5,
    transform: [{ rotate: '-32deg' }],
  },
  berries: {
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FCECD4',
  },
  moon: {
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#D7BD85',
  },
  bubbles: {
    width: 15,
    height: 15,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#7FB6C4',
  },
  petals: {
    width: 10,
    height: 17,
    borderRadius: 9,
    transform: [{ rotate: '36deg' }],
  },
  sparkles: {
    width: 12,
    height: 12,
    borderRadius: 3,
    transform: [{ rotate: '45deg' }],
  },
  raindrops: {
    width: 9,
    height: 16,
    borderRadius: 8,
    transform: [{ rotate: '22deg' }],
  },
  leaf: {
    width: 11,
    height: 18,
    borderRadius: 10,
    transform: [{ rotate: '45deg' }],
  },
  rays: {
    width: 6,
    height: 20,
    borderRadius: 4,
    transform: [{ rotate: '35deg' }],
  },
});
