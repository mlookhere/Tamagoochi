import { Image, StyleSheet, Text, View } from 'react-native';
import { APP_ASSETS } from '../assets';
import { colors } from '../theme';
import type { CompanionPose } from '../theme/motion';
import { CompanionSprite } from './CompanionSprite';

type Props = Readonly<{
  name: string;
  pose: CompanionPose;
  reactionId: number;
  message: string;
}>;

export function RoomScene({ name, pose, reactionId, message }: Props) {
  return (
    <View style={styles.room}>
      <View
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        style={styles.decor}
      >
        <View style={styles.window}>
          <View style={styles.sun} />
          <View style={styles.hillBack} />
          <View style={styles.hillFront} />
          <View style={styles.windowBar} />
        </View>
        <View style={styles.shelf}>
          <View style={styles.seedPot}>
            <Image source={APP_ASSETS.companionSeed} style={styles.seed} />
          </View>
          <View style={styles.book} />
          <View style={styles.bookSmall} />
          <View style={styles.shelfPlank} />
        </View>
        <View style={styles.floor} />
        <View style={styles.rug} />
        <View style={styles.bowl}>
          <View style={styles.bowlInset} />
        </View>
        <View style={styles.plant}>
          <View style={[styles.leaf, styles.leafLeft]} />
          <View style={[styles.leaf, styles.leafRight]} />
          <View style={styles.stem} />
          <View style={styles.pot} />
        </View>
      </View>

      <View style={styles.foreground}>
        <CompanionSprite name={name} pose={pose} reactionId={reactionId} />
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  room: {
    minHeight: 315,
    overflow: 'hidden',
    borderRadius: 25,
    backgroundColor: colors.meadow,
    borderWidth: 2,
    borderColor: colors.border,
  },
  decor: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  window: {
    position: 'absolute',
    top: 22,
    right: 28,
    width: 94,
    height: 104,
    borderWidth: 6,
    borderColor: colors.paper,
    borderRadius: 48,
    overflow: 'hidden',
    backgroundColor: '#BFDDE7',
  },
  sun: {
    position: 'absolute',
    width: 35,
    height: 35,
    right: 9,
    top: 11,
    borderRadius: 18,
    backgroundColor: colors.sun,
  },
  hillBack: {
    position: 'absolute',
    bottom: -35,
    left: -25,
    width: 130,
    height: 80,
    borderRadius: 70,
    backgroundColor: '#9CBDA4',
  },
  hillFront: {
    position: 'absolute',
    bottom: -52,
    right: -40,
    width: 125,
    height: 88,
    borderRadius: 60,
    backgroundColor: '#679A7A',
  },
  windowBar: {
    position: 'absolute',
    top: 0,
    left: 40,
    height: '100%',
    width: 4,
    backgroundColor: colors.paper,
  },
  shelf: {
    position: 'absolute',
    top: 67,
    left: 17,
    width: 105,
    height: 65,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingBottom: 6,
    gap: 6,
  },
  seedPot: {
    width: 34,
    height: 33,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#E0AB88',
  },
  seed: { width: 26, height: 26 },
  book: { width: 14, height: 38, borderRadius: 3, backgroundColor: '#B77E70' },
  bookSmall: {
    width: 12,
    height: 30,
    borderRadius: 3,
    backgroundColor: '#819B78',
  },
  shelfPlank: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#C39C70',
  },
  floor: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 115,
    backgroundColor: colors.meadowFloor,
    borderTopWidth: 3,
    borderTopColor: '#A7C49B',
  },
  rug: {
    position: 'absolute',
    width: 230,
    height: 52,
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: '#ECD9B8',
    borderRadius: 95,
    borderWidth: 4,
    borderColor: '#F9EBD3',
  },
  bowl: {
    position: 'absolute',
    left: 25,
    bottom: 46,
    width: 56,
    height: 25,
    borderRadius: 13,
    backgroundColor: '#EBA87E',
    alignItems: 'center',
    paddingTop: 5,
  },
  bowlInset: {
    width: 40,
    height: 7,
    borderRadius: 8,
    backgroundColor: '#C67959',
  },
  plant: { position: 'absolute', right: 29, bottom: 49, width: 56, height: 67 },
  leaf: {
    position: 'absolute',
    width: 22,
    height: 38,
    borderRadius: 18,
    backgroundColor: '#579C6B',
  },
  leafLeft: { top: 6, left: 4, transform: [{ rotate: '-40deg' }] },
  leafRight: { top: 0, right: 3, transform: [{ rotate: '37deg' }] },
  stem: {
    position: 'absolute',
    left: 26,
    bottom: 16,
    width: 4,
    height: 38,
    backgroundColor: '#477D5A',
  },
  pot: {
    position: 'absolute',
    width: 37,
    height: 22,
    bottom: 0,
    left: 10,
    borderBottomLeftRadius: 9,
    borderBottomRightRadius: 9,
    backgroundColor: '#C67E67',
  },
  foreground: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 14,
  },
  name: {
    marginTop: 8,
    fontSize: 21,
    fontWeight: '800',
    color: colors.ink,
  },
  message: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
