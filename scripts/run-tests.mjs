import { spawnSync } from 'node:child_process';

// Temporary exact formatter diagnostic; remove before final verification.
if (process.env.CI === 'true') {
  const targets = ['src/features/home/RoomCompanion.tsx'];
  const formatted = spawnSync('node_modules/.bin/prettier', ['--write', ...targets], {
    encoding: 'utf8',
  });
  if (formatted.status === 0) {
    const diff = spawnSync('git', ['diff', '--', ...targets], {
      encoding: 'utf8',
    });
    process.stdout.write('PRETTIER_DIFF_BEGIN\n' + diff.stdout + '\nPRETTIER_DIFF_END\n');
    spawnSync('git', ['restore', '--', ...targets]);
  }
}

const coverage = process.argv.includes('--coverage');
const args = ['--experimental-strip-types', '--test'];
if (coverage) {
  args.push(
    '--experimental-test-coverage',
    '--test-coverage-lines=80',
    '--test-coverage-functions=80',
    '--test-coverage-branches=70',
    '--test-coverage-include=src/domain/**/*.ts',
    '--test-coverage-exclude=src/domain/**/*.test.ts',
  );
}
args.push(
  'src/domain/pet/state.test.ts',
  'src/domain/items/inventory.test.ts',
  'src/features/minigames/echo.test.ts',
  'src/features/minigames/skips.test.ts',
  'src/features/minigames/pairs.test.ts',
  'src/features/home/room.test.ts',
  'src/features/home/companionResponse.test.ts',
  'src/config/public.test.ts',
  'scripts/vendor-security.test.mjs',
);
const result = spawnSync(process.execPath, args, { stdio: 'inherit' });
if (result.error) {
  process.stderr.write(String(result.error) + '\n');
  process.exit(1);
}
process.exit(result.status ?? 1);
