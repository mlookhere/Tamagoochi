import { StyleSheet, View } from 'react-native';
import { colors } from '../theme';
import { statusCopy, type StatusKind } from '../theme/status';

type Props = Readonly<{ kind: StatusKind }>;

export function StatusIllustration({ kind }: Props) {
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={statusCopy[kind].label}
      style={styles.frame}
    >
      <View style={styles.halo} />
      <View style={styles.floor} />
      <View style={styles.stem} />
      <View style={[styles.leaf, styles.leafLeft]} />
      <View style={[styles.leaf, styles.leafRight]} />
      {kind === 'empty' ? (
        <View style={styles.emptyBowl}>
          <View style={styles.emptyInside} />
        </View>
      ) : (
        <View style={styles.companion}>
          <View style={[styles.eye, styles.eyeLeft]} />
          <View style={[styles.eye, styles.eyeRight]} />
          <View style={styles.mouth} />
        </View>
      )}
      {kind === 'loading' && <View style={styles.glow} />}
      {kind === 'welcome' && <View style={styles.flower} />}
      {kind === 'error' && <View style={styles.shelter} />}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignSelf: 'center',
    width: 220,
    height: 155,
    overflow: 'hidden',
    position: 'relative',
  },
  halo: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    width: 126,
    height: 126,
    borderRadius: 63,
    backgroundColor: colors.meadow,
  },
  floor: {
    position: 'absolute',
    width: 170,
    height: 18,
    bottom: 9,
    alignSelf: 'center',
    borderRadius: 15,
    backgroundColor: colors.meadowFloor,
  },
  companion: {
    position: 'absolute',
    bottom: 14,
    left: 68,
    width: 86,
    height: 82,
    borderRadius: 42,
    borderWidth: 3,
    borderColor: colors.petOutline,
    backgroundColor: colors.pet,
  },
  eye: {
    position: 'absolute',
    top: 30,
    height: 11,
    width: 7,
    borderRadius: 4,
    backgroundColor: colors.petFace,
  },
  eyeLeft: { left: 23 },
  eyeRight: { right: 23 },
  mouth: {
    position: 'absolute',
    top: 49,
    left: 38,
    height: 6,
    width: 10,
    borderBottomWidth: 2,
    borderColor: colors.petFace,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  stem: {
    position: 'absolute',
    top: 14,
    left: 107,
    height: 50,
    width: 6,
    borderRadius: 5,
    backgroundColor: colors.moss,
  },
  leaf: {
    position: 'absolute',
    top: 13,
    width: 42,
    height: 23,
    borderRadius: 24,
    backgroundColor: colors.fern,
  },
  leafLeft: { left: 70, transform: [{ rotate: '-21deg' }] },
  leafRight: { right: 69, transform: [{ rotate: '21deg' }] },
  emptyBowl: {
    position: 'absolute',
    bottom: 14,
    left: 66,
    width: 88,
    height: 45,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    backgroundColor: colors.petOutline,
    alignItems: 'center',
    paddingTop: 3,
  },
  emptyInside: {
    width: 65,
    height: 12,
    borderRadius: 15,
    backgroundColor: colors.pet,
  },
  glow: {
    position: 'absolute',
    top: 51,
    left: 87,
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 4,
    borderColor: colors.sun,
  },
  flower: {
    position: 'absolute',
    right: 24,
    top: 39,
    width: 23,
    height: 23,
    borderRadius: 12,
    borderWidth: 6,
    borderColor: colors.blush,
    backgroundColor: colors.sun,
  },
  shelter: {
    position: 'absolute',
    top: 45,
    left: 67,
    width: 88,
    height: 8,
    borderRadius: 8,
    backgroundColor: colors.moss,
    transform: [{ rotate: '-5deg' }],
  },
});
