import { Redirect } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import type { CompanionStage } from '../assets/companions';
import { CompanionSprite } from '../components/CompanionSprite';
import { Page } from '../components/Page';
import { OnboardingStoryboard } from '../components/OnboardingStoryboard';
import { useSystemReduceMotion } from '../hooks/useSystemReduceMotion';
import { colors } from '../theme';
import { reduceMotionDescription } from '../theme/accessibility';
import type { CompanionPose } from '../theme/motion';
import {
  MOTION_REVIEW_POSES,
  MOTION_REVIEW_STAGES,
  motionCaseId,
} from '../theme/motion-review';

type ReviewButtonProps = Readonly<{
  label: string;
  selected: boolean;
  onPress: () => void;
}>;

function ReviewButton({ label, selected, onPress }: ReviewButtonProps) {
  return (
    <Pressable
      accessible
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.choice, selected && styles.selected]}
    >
      <Text style={[styles.choiceText, selected && styles.selectedText]}>
        {label}
      </Text>
    </Pressable>
  );
}

function MotionReviewContent() {
  const [stage, setStage] = useState<CompanionStage>('seedling');
  const [pose, setPose] = useState<CompanionPose>('idle');
  const [reactionId, setReactionId] = useState(0);
  const reducedMotion = useSystemReduceMotion();
  const { width, height, fontScale } = useWindowDimensions();

  const choosePose = (value: CompanionPose) => {
    setPose(value);
    setReactionId((current) => current + 1);
  };
  const chooseStage = (value: CompanionStage) => {
    setStage(value);
    setReactionId((current) => current + 1);
  };
  const motionState = reduceMotionDescription(reducedMotion);

  return (
    <Page
      eyebrow="Developer visual QA"
      title="Companion motion review"
      description="Preview every original character stage and movement on this device. This screen is unavailable in production."
    >
      <View style={styles.preview}>
        <CompanionSprite
          name="Pip"
          pose={pose}
          stage={stage}
          reactionId={reactionId}
        />
        <Text style={styles.caseId}>{motionCaseId(stage, pose)}</Text>
        <Text accessibilityRole="text" style={styles.status}>
          System Reduce Motion: {motionState}
        </Text>
        <Text style={styles.metrics}>
          {Math.round(width)} × {Math.round(height)} pt • Font scale{' '}
          {fontScale.toFixed(2)}
        </Text>
      </View>
      <Text style={styles.groupLabel}>Character stage</Text>
      <View style={styles.options}>
        {MOTION_REVIEW_STAGES.map((option) => (
          <ReviewButton
            key={option}
            label={option}
            selected={stage === option}
            onPress={() => chooseStage(option)}
          />
        ))}
      </View>
      <Text style={styles.groupLabel}>Motion state</Text>
      <View style={styles.options}>
        {MOTION_REVIEW_POSES.map((option) => (
          <ReviewButton
            key={option}
            label={option}
            selected={pose === option}
            onPress={() => choosePose(option)}
          />
        ))}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Replay companion motion"
        onPress={() => setReactionId((current) => current + 1)}
        style={styles.replay}
      >
        <Text style={styles.replayText}>Replay selected motion</Text>
      </Pressable>
      <Text style={styles.instructions}>
        Check all 39 combinations. Turn Reduce Motion on and off in your device
        settings while this screen stays open. Confirm animations stop, artwork
        stays visible, labels remain understandable, and enlarged text does not
        overlap controls. Record OS, device, font scale, and any failing case.
      </Text>
      <OnboardingStoryboard />
    </Page>
  );
}

export default function MotionReview() {
  if (!__DEV__) {
    return <Redirect href="/" />;
  }
  return <MotionReviewContent />;
}

const styles = StyleSheet.create({
  preview: {
    minHeight: 250,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.meadow,
  },
  caseId: {
    marginTop: 4,
    fontSize: 17,
    fontWeight: '800',
    color: colors.ink,
  },
  status: { marginTop: 9, color: colors.ink, fontWeight: '700' },
  metrics: { marginTop: 5, color: colors.muted, fontSize: 12 },
  groupLabel: {
    marginTop: 21,
    marginBottom: 10,
    color: colors.ink,
    fontWeight: '800',
    fontSize: 17,
  },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: {
    minHeight: 46,
    minWidth: 94,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: { backgroundColor: colors.moss, borderColor: colors.moss },
  choiceText: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  selectedText: { color: colors.white },
  replay: {
    marginTop: 24,
    minHeight: 48,
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.moss,
  },
  replayText: { color: colors.white, fontSize: 15, fontWeight: '800' },
  instructions: {
    marginTop: 15,
    marginBottom: 14,
    lineHeight: 22,
    fontSize: 14,
    color: colors.ink,
  },
});
