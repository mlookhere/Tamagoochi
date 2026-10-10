import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

// Original sprouting-seed mark rendered natively on iOS, Android and web.
export function BrandMark() {
  return (
    <View style={styles.row} accessibilityRole="header">
      <View
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        style={styles.emblem}
      >
        <View style={styles.stem} />
        <View style={[styles.leaf, styles.leafLeft]} />
        <View style={[styles.leaf, styles.leafRight]} />
        <View style={styles.seed} />
      </View>
      <Text style={styles.word}>tamagoochi</Text>
      <View style={styles.period} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 7,
  },
  emblem: { width: 31, height: 29 },
  stem: {
    position: 'absolute',
    width: 3,
    height: 18,
    left: 14,
    top: 5,
    borderRadius: 3,
    backgroundColor: colors.moss,
  },
  leaf: {
    position: 'absolute',
    width: 16,
    height: 11,
    borderRadius: 10,
    backgroundColor: colors.fern,
  },
  leafLeft: { left: 1, top: 3, transform: [{ rotate: '28deg' }] },
  leafRight: { right: 0, top: 2, transform: [{ rotate: '-32deg' }] },
  seed: {
    position: 'absolute',
    bottom: 0,
    left: 9,
    width: 13,
    height: 12,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.moss,
    backgroundColor: colors.sun,
  },
  word: {
    fontSize: 21,
    fontWeight: '900',
    color: colors.ink,
    letterSpacing: -1.1,
  },
  period: {
    width: 5,
    height: 5,
    borderRadius: 3,
    alignSelf: 'flex-end',
    marginBottom: 7,
    backgroundColor: colors.fern,
  },
});
