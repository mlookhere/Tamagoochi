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
args.push(
  'src/domain/pet/state.test.ts',
  'src/domain/items/inventory.test.ts',
  'src/config/public.test.ts',
  'scripts/vendor-security.test.mjs',
);
const prettier = await import('prettier');
const { readFileSync } = await import('node:fs');
for (const path of [
  'src/domain/items/inventory.ts',
  'src/domain/items/inventory.test.ts',
  'src/app/workshop.tsx',
]) {
  const actual = readFileSync(path, 'utf8');
  const expected = await prettier.format(actual, {
    ...(await prettier.resolveConfig(path)),
    filepath: path,
  });
  if (actual !== expected) {
    process.stdout.write('PRETTIER_EXPECTED_BEGIN:' + path + '\\n' + expected + '\\nPRETTIER_EXPECTED_END:' + path + '\\n');
  }
}

const result = spawnSync(process.execPath, args, { stdio: 'inherit' });
if (result.error) {
  process.stderr.write(String(result.error) + '\n');
  process.exit(1);
}
process.exit(result.status ?? 1);
