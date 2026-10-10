import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  StyleSheet,
} from 'react-native';
import { getCompanionArtwork } from '../assets/companions';
import { type CompanionPose, expressionFor, motionFor } from '../theme/motion';

type Props = Readonly<{
  name: string;
  pose: CompanionPose;
  reactionId: number;
}>;

export function CompanionSprite({ name, pose, reactionId }: Props) {
  const [reduceMotion, setReduceMotion] = useState(true);
  const [lift] = useState(() => new Animated.Value(0));
  const expression = expressionFor(pose);

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
  }, [lift, pose, reactionId, reduceMotion]);

  return (
    <Animated.View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${name}, your companion, ${pose}`}
      style={[styles.sprite, { transform: [{ translateY: lift }] }]}
    >
      <Image
        accessible={false}
        source={getCompanionArtwork(expression)}
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
