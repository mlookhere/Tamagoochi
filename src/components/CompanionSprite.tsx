import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  StyleSheet,
} from 'react-native';
import { getCompanionArtwork } from '../assets/companions';
import type { CompanionStage } from '../assets/companions';
import {
  type CompanionPose,
  expressionFor,
  motionFor,
  playbackFor,
} from '../theme/motion';

type Props = Readonly<{
  name: string;
  pose: CompanionPose;
  reactionId: number;
  stage?: CompanionStage;
}>;

export function CompanionSprite({
  name,
  pose,
  reactionId,
  stage = 'seedling',
}: Props) {
  const [reduceMotion, setReduceMotion] = useState(true);
  const [lift] = useState(() => new Animated.Value(0));
  const [phase] = useState(() => new Animated.Value(0));
  const expression = expressionFor(pose);
  const motion = motionFor(pose, reduceMotion);

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
    lift.stopAnimation();
    phase.stopAnimation();
    lift.setValue(0);
    phase.setValue(0);
    const { lift: height, duration } = motionFor(pose, reduceMotion);
    if (!height) return;

    const cycle = Animated.sequence([
      Animated.parallel([
        Animated.timing(lift, {
          toValue: -height,
          duration,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(phase, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(lift, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(phase, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]);
    const animation =
      playbackFor(pose) === 'loop' ? Animated.loop(cycle) : cycle;
    animation.start();
    return () => animation.stop();
  }, [lift, phase, pose, reactionId, reduceMotion]);

  const turn = phase.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${motion.tilt}deg`],
  });
  const zoom = phase.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1 + motion.pulse],
  });

  return (
    <Animated.View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${name}, your companion, ${pose}`}
      style={[
        styles.sprite,
        {
          transform: [{ translateY: lift }, { rotate: turn }, { scale: zoom }],
        },
      ]}
    >
      <Image
        accessible={false}
        source={getCompanionArtwork(expression, stage)}
        resizeMode="contain"
        style={styles.artwork}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sprite: {
    width: 175,
    height: 175,
    justifyContent: 'center',
    alignItems: 'center',
  },
  artwork: { width: 175, height: 175 },
});
