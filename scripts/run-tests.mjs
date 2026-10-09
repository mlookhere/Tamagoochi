import { spawnSync } from 'node:child_process';

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
args.push(\n  'src/domain/pet/state.test.ts',\n  'src/config/public.test.ts',\n  'scripts/vendor-security.test.mjs',\n);
const result = spawnSync(process.execPath, args, { stdio: 'inherit' });
if (result.error) {
  process.stderr.write(String(result.error) + '\n');
  process.exit(1);
}
process.exit(result.status ?? 1);
