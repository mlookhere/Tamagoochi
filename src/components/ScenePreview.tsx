import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';
import { sceneCopy, type SceneKind } from '../theme/scenes';

type Props = Readonly<{ kind: SceneKind }>;

function TrailArt() {
  return (
    <>
      <View style={styles.sun} />
      <View style={[styles.hill, styles.backHill]} />
      <View style={[styles.hill, styles.frontHill]} />
      <View style={styles.trail} />
      <View style={[styles.stone, styles.stoneOne]} />
      <View style={[styles.stone, styles.stoneTwo]} />
      <View style={[styles.stone, styles.stoneThree]} />
    </>
  );
}

function MemoryArt() {
  return (
    <>
      <View style={[styles.photo, styles.photoBack]} />
      <View style={[styles.photo, styles.photoFront]}>
        <View style={styles.photoSky} />
        <View style={styles.photoSun} />
        <View style={styles.photoHill} />
      </View>
    </>
  );
}

function FriendArt() {
  return (
    <>
      <View style={[styles.friend, styles.friendLeft]}>
        <View style={[styles.friendEye, styles.eyeLeft]} />
        <View style={[styles.friendEye, styles.eyeRight]} />
      </View>
      <View style={[styles.friend, styles.friendRight]}>
        <View style={[styles.friendEye, styles.eyeLeft]} />
        <View style={[styles.friendEye, styles.eyeRight]} />
      </View>
      <View style={styles.friendHeart} />
    </>
  );
}

export function ScenePreview({ kind }: Props) {
  const scene = sceneCopy[kind];
  return (
    <View style={styles.card}>
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={scene.accessibilityLabel}
        style={[styles.illustration, { backgroundColor: scene.background }]}
      >
        {kind === 'adventure' && <TrailArt />}
        {kind === 'memories' && <MemoryArt />}
        {kind === 'friends' && <FriendArt />}
      </View>
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>IN DEVELOPMENT</Text>
        <Text style={styles.heading}>{scene.title}</Text>
        <Text style={styles.detail}>{scene.detail}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderRadius: 24,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.paper,
  },
  illustration: {
    height: 216,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sun: {
    position: 'absolute',
    top: 25,
    right: 66,
    width: 46,
    height: 46,
    backgroundColor: colors.sun,
    borderRadius: 23,
  },
  hill: {
    position: 'absolute',
    width: 320,
    height: 170,
    borderRadius: 160,
  },
  backHill: {
    top: 100,
    left: -84,
    backgroundColor: '#9ABB9D',
  },
  frontHill: {
    top: 135,
    right: -90,
    backgroundColor: '#72A37D',
  },
  trail: {
    position: 'absolute',
    width: 85,
    height: 175,
    top: 149,
    left: '42%',
    borderRadius: 75,
    backgroundColor: '#F4E7C9',
    transform: [{ rotate: '15deg' }],
  },
  stone: {
    position: 'absolute',
    width: 19,
    height: 11,
    borderRadius: 10,
    backgroundColor: '#D5BE9A',
  },
  stoneOne: { left: '41%', top: 167 },
  stoneTwo: { left: '58%', top: 184 },
  stoneThree: { left: '38%', top: 201 },
  photo: {
    position: 'absolute',
    width: 130,
    height: 154,
    borderWidth: 9,
    borderBottomWidth: 25,
    borderColor: colors.paper,
    borderRadius: 6,
    backgroundColor: '#A9C9BE',
  },
  photoBack: {
    left: '22%',
    transform: [{ rotate: '-18deg' }],
    backgroundColor: '#D9B8A9',
  },
  photoFront: {
    right: '22%',
    transform: [{ rotate: '12deg' }],
    overflow: 'hidden',
  },
  photoSky: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#ACD4D9',
  },
  photoSun: {
    position: 'absolute',
    width: 38,
    height: 38,
    top: 15,
    right: 14,
    borderRadius: 19,
    backgroundColor: colors.sun,
  },
  photoHill: {
    position: 'absolute',
    width: 150,
    height: 95,
    bottom: -35,
    left: -18,
    borderRadius: 75,
    backgroundColor: '#88B092',
  },
  friend: {
    position: 'absolute',
    width: 103,
    height: 112,
    borderRadius: 52,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#BFAB89',
    backgroundColor: colors.pet,
  },
  friendLeft: { left: '15%', transform: [{ rotate: '-9deg' }] },
  friendRight: {
    right: '15%',
    backgroundColor: '#D9EBCB',
    borderColor: '#A5BC96',
    transform: [{ rotate: '9deg' }],
  },
  friendEye: {
    position: 'absolute',
    top: 50,
    height: 15,
    width: 9,
    borderRadius: 5,
    backgroundColor: colors.ink,
  },
  eyeLeft: { left: 31 },
  eyeRight: { right: 31 },
  friendHeart: {
    position: 'absolute',
    top: 41,
    left: '48%',
    width: 17,
    height: 17,
    borderRadius: 5,
    backgroundColor: '#C77D83',
    transform: [{ rotate: '45deg' }],
  },
  copy: { padding: 22, gap: 9 },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '800',
    color: colors.muted,
  },
  heading: {
    fontSize: 22,
    lineHeight: 29,
    fontWeight: '800',
    color: colors.ink,
  },
  detail: { fontSize: 14, lineHeight: 21, color: colors.muted },
});
