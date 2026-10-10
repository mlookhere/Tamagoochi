import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  View,
} from 'react-native';
import { colors } from '../theme';
import { type CompanionPose, motionFor } from '../theme/motion';

type Props = Readonly<{
  name: string;
  pose: CompanionPose;
}>;

export function CompanionSprite({ name, pose }: Props) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const lift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const listener = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );
    return () => {
      mounted = false;
      listener.remove();
    };
  }, []);

  useEffect(() => {
    const { lift: height, duration } = motionFor(pose, reduceMotion);
    lift.stopAnimation();
    lift.setValue(0);
    if (!height) return;

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(lift, {
          toValue: -height,
          duration,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(lift, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [lift, pose, reduceMotion]);

  return (
    <Animated.View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${name}, your companion, ${pose}`}
      style={[styles.sprite, { transform: [{ translateY: lift }] }]}
    >
      <View style={[styles.ear, styles.leftEar]} />
      <View style={[styles.ear, styles.rightEar]} />
      <View style={styles.body}>
        <View style={styles.eyes}>
          <View style={styles.eye} />
          <View style={styles.eye} />
        </View>
        <View style={styles.mouth} />
        <View style={[styles.cheek, styles.leftCheek]} />
        <View style={[styles.cheek, styles.rightCheek]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sprite: {
    width: 138,
    height: 128,
    position: 'relative',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  ear: {
    position: 'absolute',
    top: 3,
    width: 43,
    height: 64,
    backgroundColor: colors.petEar,
    borderRadius: 23,
  },
  leftEar: { left: 20, transform: [{ rotate: '-23deg' }] },
  rightEar: { right: 20, transform: [{ rotate: '23deg' }] },
  body: {
    width: 135,
    height: 110,
    borderRadius: 58,
    backgroundColor: colors.pet,
    borderWidth: 3,
    borderColor: colors.petOutline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyes: {
    width: 65,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  eye: {
    width: 13,
    height: 19,
    backgroundColor: colors.petFace,
    borderRadius: 7,
  },
  mouth: {
    width: 15,
    height: 7,
    borderBottomWidth: 2,
    borderColor: colors.petFace,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    marginTop: 8,
  },
  cheek: {
    width: 14,
    height: 8,
    backgroundColor: colors.blush,
    borderRadius: 8,
    position: 'absolute',
    top: 62,
  },
  leftCheek: { left: 21 },
  rightCheek: { right: 21 },
});
