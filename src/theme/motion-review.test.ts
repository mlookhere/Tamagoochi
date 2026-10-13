import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { companionMotion } from './motion.ts';
import {
  MOTION_REVIEW_POSES,
  MOTION_REVIEW_STAGES,
  MOTION_REVIEW_CASES,
  motionCaseId,
  motionReviewPosition,
  nextMotionReviewCase,
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

test('motion review is excluded from player navigation and redirects in production', () => {
  const tabs = readFileSync('src/app/_layout.tsx', 'utf8');
  const route = readFileSync('src/app/motion-review.tsx', 'utf8');
  assert.match(tabs, /name="motion-review" options=\{\{ href: null \}\}/);
  assert.match(route, /if \(!__DEV__\)/);
  assert.match(route, /return <Redirect href="\/" \/>/);
  assert.match(route, /<CompanionSprite/);
  const observer = readFileSync('src/hooks/useSystemReduceMotion.ts', 'utf8');
  assert.match(route, /useSystemReduceMotion\(\)/);
  assert.match(observer, /AccessibilityInfo\.addEventListener/);
  assert.match(observer, /isReduceMotionEnabled\(\)/);
  assert.match(observer, /\.catch\(/);
});

test('ordered motion review advances through all 39 cases and wraps exactly once', () => {
  const caseIds = MOTION_REVIEW_CASES.map(({ stage, pose }) =>
    motionCaseId(stage, pose),
  );
  assert.equal(caseIds.length, 39);
  assert.equal(new Set(caseIds).size, caseIds.length);

  let current = MOTION_REVIEW_CASES[0];
  for (let index = 0; index < caseIds.length; index++) {
    assert.equal(motionCaseId(current.stage, current.pose), caseIds[index]);
    assert.equal(motionReviewPosition(current.stage, current.pose), index + 1);
    current = nextMotionReviewCase(current.stage, current.pose);
  }
  assert.deepEqual(current, MOTION_REVIEW_CASES[0]);
  assert.deepEqual(nextMotionReviewCase('seedling', 'evolution'), {
    stage: 'bud',
    pose: 'idle',
  });
  assert.deepEqual(nextMotionReviewCase('bloom', 'evolution'), {
    stage: 'seedling',
    pose: 'idle',
  });
});

test('native motion review exposes ordered case navigation', () => {
  const route = readFileSync('src/app/motion-review.tsx', 'utf8');
  assert.match(route, /nextMotionReviewCase\(stage, pose\)/);
  assert.match(route, /Next test case/);
  assert.match(route, /motionReviewPosition\(stage, pose\)/);
  assert.match(route, /accessibilityLabel=\{`Next test case, \$\{caseProgress\}`\}/);
  assert.match(route, /choice: \{\s*minHeight: 48,/);
});
