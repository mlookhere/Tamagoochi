import assert from 'node:assert/strict';
import test from 'node:test';
import { companionMotion } from './motion.ts';
import {
  MOTION_REVIEW_POSES,
  MOTION_REVIEW_STAGES,
  motionCaseId,
} from './motion-review.ts';

test('motion review covers all authored poses for every stage', () => {
  assert.deepEqual(MOTION_REVIEW_POSES, Object.keys(companionMotion));
  assert.deepEqual(MOTION_REVIEW_STAGES, ['seedling', 'bud', 'bloom']);
  const cases = MOTION_REVIEW_STAGES.flatMap((stage) =>
    MOTION_REVIEW_POSES.map((pose) => motionCaseId(stage, pose)),
  );
  assert.equal(cases.length, 39);
  assert.equal(new Set(cases).size, 39);
  assert.ok(cases.includes('seedling-eat'));
  assert.ok(cases.includes('bud-startled'));
  assert.ok(cases.includes('bloom-evolution'));
});
