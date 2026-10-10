import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, normalize, resolve } from 'node:path';
import { inflateSync } from 'node:zlib';

const root = resolve('dist');
const output = resolve('artifacts/visual');
const baselinePath = resolve('tests/visual-baseline.json');
const screens = [
  { name: 'home', route: '/', text: 'Your little companion' },
  { name: 'adventure', route: '/adventure', text: 'The world is waiting.' },
  { name: 'memories', route: '/memories', text: 'A life in little moments.' },
  { name: 'friends', route: '/friends', text: 'Better together.' },
];
const viewports = [
  { name: 'compact', width: 390, height: 844 },
  { name: 'large', width: 430, height: 932 },
];
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

function findBrowser() {
  for (const name of ['google-chrome', 'google-chrome-stable', 'chromium']) {
    if (spawnSync(name, ['--version'], { stdio: 'ignore' }).status === 0) {
      return name;
    }
  }
  throw new Error('Chrome/Chromium is required for rendered visual regression.');
}

async function webFile(urlPath) {
  const clean = normalize(decodeURIComponent(urlPath)).replace(/^\\/+/, '');
  if (clean.startsWith('..')) return null;
  const candidates = [clean, `${clean}.html`, join(clean, 'index.html')];
  if (!clean || clean === '.') candidates.unshift('index.html');
  for (const candidate of candidates) {
    if (!candidate) continue;
    const file = resolve(root, candidate);
    if (!file.startsWith(`${root}/`)) continue;
    try {
      await access(file);
      return file;
    } catch {
      // Try the next static-export path.
    }
  }
  if (!clean.includes('.')) return join(root, 'index.html');
  return null;
}

async function runChrome(browser, args) {
  const child = spawn(browser, [
    '--headless=new',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    '--virtual-time-budget=5000',
    ...args,
  ], { stdio: ['ignore', 'pipe', 'pipe'] });

  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk) => {
    stdout += chunk.toString();
  });
  child.stderr.on('data', (chunk) => {
    if (stderr.length < 12000) stderr += chunk.toString();
  });
  const exit = await Promise.race([
    new Promise((resolveExit) => {
      child.on('close', (code) => resolveExit(code));
      child.on('error', (error) => resolveExit(error));
    }),
    new Promise((resolveExit) => {
      setTimeout(() => {
        child.kill('SIGKILL');
        resolveExit('timeout');
      }, 35000).unref();
    }),
  ]);
  if (exit !== 0) {
    throw new Error(`Browser capture failed (${String(exit)}): ${stderr.slice(-1600)}`);
  }
  return stdout;
}

function decodePng(buffer) {
  const expectedHeader = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  assert.ok(buffer.subarray(0, 8).equals(expectedHeader), 'Invalid PNG');
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  const channels = buffer[25] === 6 ? 4 : buffer[25] === 2 ? 3 : 0;
  assert.ok(channels, 'Expected true-color browser PNG');
  const chunks = [];
  let offset = 8;
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const kind = buffer.toString('ascii', offset + 4, offset + 8);
    if (kind === 'IDAT') chunks.push(buffer.subarray(offset + 8, offset + 8 + length));
    offset += length + 12;
    if (kind === 'IEND') break;
  }
  const raw = inflateSync(Buffer.concat(chunks));
  const stride = width * channels;
  const pixels = Buffer.alloc(stride * height);
  let rowOffset = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[rowOffset++];
    for (let x = 0; x < stride; x++) {
      const left = x < channels ? 0 : pixels[y * stride + x - channels];
      const up = y === 0 ? 0 : pixels[(y - 1) * stride + x];
      const topLeft = x < channels || y === 0 ? 0 : pixels[(y - 1) * stride + x - channels];
      const value = raw[rowOffset++];
      let predictor = 0;
      if (filter === 1) predictor = left;
      if (filter === 2) predictor = up;
      if (filter === 3) predictor = Math.floor((left + up) / 2);
      if (filter === 4) {
        const p = left + up - topLeft;
        const a = Math.abs(p - left);
        const b = Math.abs(p - up);
        const c = Math.abs(p - topLeft);
        predictor = a <= b && a <= c ? left : b <= c ? up : topLeft;
      }
      assert.ok(filter >= 0 && filter <= 4, 'Unsupported PNG filter');
      pixels[y * stride + x] = (value + predictor) & 255;
    }
  }
  return { width, height, channels, pixels };
}

function signature(png) {
  const cols = 9;
  const rows = 12;
  const samples = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const px = Math.floor((x + 0.5) * png.width / cols);
      const py = Math.floor((y + 0.5) * png.height / rows);
      const start = (py * png.width + px) * png.channels;
      for (let channel = 0; channel < 3; channel++) {
        samples.push(Math.round(png.pixels[start + channel] / 16));
      }
    }
  }
  assert.ok(new Set(samples).size >= 6, 'Screenshot appears blank or monochrome');
  return { width: png.width, height: png.height, samples };
}

function compare(key, actual, expected) {
  assert.equal(actual.width, expected.width, `${key} width changed`);
  assert.equal(actual.height, expected.height, `${key} height changed`);
  assert.equal(actual.samples.length, expected.samples.length);
  let changed = 0;
  for (let index = 0; index < actual.samples.length; index += 3) {
    const deviation = [0, 1, 2].reduce(
      (highest, c) =>
        Math.max(highest, Math.abs(actual.samples[index + c] - expected.samples[index + c])),
      0,
    );
    if (deviation > 3) changed++;
  }
  const ratio = changed / (actual.samples.length / 3);
  assert.ok(ratio <= 0.12, `${key}: ${changed} visual anchor cells changed (${Math.round(ratio * 100)}%)`);
}

async function main() {
  await access(join(root, 'index.html'));
  await mkdir(output, { recursive: true });
  const browser = findBrowser();
  const server = createServer(async (request, response) => {
    try {
      const requested = new URL(request.url ?? '/', 'http://localhost').pathname;
      const file = await webFile(requested);
      if (!file) {
        response.writeHead(404).end();
        return;
      }
      const content = await readFile(file);
      const ext = file.slice(file.lastIndexOf('.'));
      response.writeHead(200, { 'content-type': contentTypes[ext] ?? 'application/octet-stream' });
      response.end(content);
    } catch {
      response.writeHead(500).end();
    }
  });
  await new Promise((resolveStart) => server.listen(0, '127.0.0.1', resolveStart));
  const port = server.address().port;
  const signatures = {};
  try {
    for (const viewport of viewports) {
      for (const screen of screens) {
        const key = `${screen.name}-${viewport.name}`;
        const url = `http://127.0.0.1:${port}${screen.route}`;
        const browserSize = `--window-size=${viewport.width},${viewport.height}`;
        const dom = await runChrome(browser, [browserSize, '--dump-dom', url]);
        assert.ok(dom.includes(screen.text), `${key}: expected screen copy not rendered`);
        const screenshot = join(output, `${key}.png`);
        await runChrome(browser, [browserSize, `--screenshot=${screenshot}`, url]);
        signatures[key] = signature(decodePng(await readFile(screenshot)));
        console.log(`Captured and inspected ${key}`);
      }
    }
  } finally {
    await new Promise((resolveClose) => server.close(resolveClose));
  }

  let baseline;
  try {
    baseline = JSON.parse(await readFile(baselinePath, 'utf8'));
  } catch {
    console.log('VISUAL_BASELINE_BEGIN');
    console.log(JSON.stringify({ version: 1, signatures }, null, 2));
    console.log('VISUAL_BASELINE_END');
    throw new Error('Reviewed visual baseline missing. Commit the captured baseline before enabling this gate.');
  }
  assert.equal(baseline.version, 1);
  assert.deepEqual(Object.keys(signatures), Object.keys(baseline.signatures));
  for (const [key, actual] of Object.entries(signatures)) {
    compare(key, actual, baseline.signatures[key]);
  }
  console.log('Rendered browser screenshots match all approved visual anchors.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
