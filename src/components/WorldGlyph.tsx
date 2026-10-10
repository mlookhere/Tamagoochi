import { StyleSheet, View, type ColorValue } from 'react-native';
import { type GlyphKind } from '../theme/iconography';

type Props = Readonly<{ kind: GlyphKind; color: ColorValue }>;

export function WorldGlyph({ kind, color }: Props) {
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={styles.frame}
    >
      {kind === 'home' && (
        <>
          <View
            style={[
              styles.roof,
              { borderTopColor: color, borderLeftColor: color },
            ]}
          />
          <View style={[styles.house, { borderColor: color }]} />
          <View style={[styles.door, { backgroundColor: color }]} />
        </>
      )}
      {kind === 'adventure' && (
        <>
          <View style={[styles.compass, { borderColor: color }]} />
          <View style={[styles.compassNeedle, { backgroundColor: color }]} />
          <View style={[styles.compassDot, { backgroundColor: color }]} />
        </>
      )}
      {kind === 'memories' && (
        <>
          <View style={[styles.photoBack, { borderColor: color }]} />
          <View style={[styles.photoFront, { borderColor: color }]} />
          <View style={[styles.photoSun, { backgroundColor: color }]} />
        </>
      )}
      {kind === 'friends' && (
        <>
          <View style={[styles.friendLeft, { backgroundColor: color }]} />
          <View style={[styles.friendRight, { backgroundColor: color }]} />
          <View style={[styles.friendBase, { borderColor: color }]} />
        </>
      )}
      {kind === 'seed' && (
        <>
          <View style={[styles.seedBody, { borderColor: color }]} />
          <View style={[styles.seedLeaf, { backgroundColor: color }]} />
        </>
      )}
      {kind === 'leaf' && (
        <>
          <View style={[styles.leafBody, { borderColor: color }]} />
          <View style={[styles.leafVein, { backgroundColor: color }]} />
        </>
      )}
      {kind === 'bowl' && (
        <>
          <View style={[styles.bowlRim, { borderColor: color }]} />
          <View style={[styles.bowlBody, { borderColor: color }]} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { width: 26, height: 26, position: 'relative' },
  roof: {
    position: 'absolute',
    top: 5,
    left: 6,
    width: 15,
    height: 15,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
    transform: [{ rotate: '45deg' }],
  },
  house: {
    position: 'absolute',
    bottom: 2,
    left: 5,
    width: 17,
    height: 15,
    borderWidth: 2,
    borderTopWidth: 0,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  door: {
    position: 'absolute',
    bottom: 2,
    left: 11,
    width: 5,
    height: 10,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  compass: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 22,
    height: 22,
    borderWidth: 2,
    borderRadius: 12,
  },
  compassNeedle: {
    position: 'absolute',
    top: 5,
    left: 12,
    width: 2,
    height: 15,
    transform: [{ rotate: '33deg' }],
    borderRadius: 2,
  },
  compassDot: {
    position: 'absolute',
    top: 11,
    left: 11,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  photoBack: {
    position: 'absolute',
    top: 2,
    left: 3,
    width: 17,
    height: 19,
    borderWidth: 2,
    borderRadius: 3,
    transform: [{ rotate: '-13deg' }],
  },
  photoFront: {
    position: 'absolute',
    top: 6,
    left: 8,
    width: 17,
    height: 19,
    borderWidth: 2,
    borderRadius: 3,
  },
  photoSun: {
    position: 'absolute',
    top: 10,
    left: 17,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  friendLeft: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 9,
    height: 10,
    borderRadius: 5,
  },
  friendRight: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 9,
    height: 10,
    borderRadius: 5,
  },
  friendBase: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    width: 22,
    height: 10,
    borderWidth: 2,
    borderTopLeftRadius: 11,
    borderTopRightRadius: 11,
    borderBottomWidth: 0,
  },
  seedBody: {
    position: 'absolute',
    bottom: 2,
    left: 6,
    width: 14,
    height: 16,
    borderWidth: 2,
    borderRadius: 9,
  },
  seedLeaf: {
    position: 'absolute',
    top: 2,
    left: 13,
    width: 11,
    height: 7,
    borderRadius: 7,
    transform: [{ rotate: '-25deg' }],
  },
  leafBody: {
    position: 'absolute',
    top: 3,
    left: 6,
    width: 16,
    height: 20,
    borderWidth: 2,
    borderRadius: 12,
    transform: [{ rotate: '38deg' }],
  },
  leafVein: {
    position: 'absolute',
    top: 7,
    left: 12,
    width: 2,
    height: 16,
    transform: [{ rotate: '37deg' }],
  },
  bowlRim: {
    position: 'absolute',
    top: 7,
    left: 2,
    width: 22,
    height: 8,
    borderWidth: 2,
    borderRadius: 10,
  },
  bowlBody: {
    position: 'absolute',
    top: 11,
    left: 3,
    width: 20,
    height: 12,
    borderWidth: 2,
    borderTopWidth: 0,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
});
