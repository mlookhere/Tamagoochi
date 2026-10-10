import assert from 'node:assert/strict';
import test from 'node:test';
import { getPublicConfig } from './public.ts';

test('public config defaults safely for local development', () => {
  assert.deepEqual(getPublicConfig({}), {
    environment: 'development',
    buildLabel: 'local',
  });
});

test('public config accepts declared public build metadata', () => {
  assert.deepEqual(
    getPublicConfig({
      EXPO_PUBLIC_APP_ENV: 'production',
      EXPO_PUBLIC_BUILD_LABEL: 'store-42',
    }),
    {
      environment: 'production',
      buildLabel: 'store-42',
    },
  );
});

test('public config rejects unknown environment values', () => {
  assert.throws(
    () => getPublicConfig({ EXPO_PUBLIC_APP_ENV: 'secret-production' }),
    /must be development, preview, or production/,
  );
});
