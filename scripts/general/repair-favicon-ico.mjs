#!/usr/bin/env node
/**
 * repair-favicon-ico.mjs
 *
 * Rewrites five repository favicon files that currently contain a raw 32x32 PNG
 * payload (1,991 bytes) into a valid single-image ICO container. No ICO encoder
 * exists in the dependency tree and `sharp` cannot encode ICO, so this narrow
 * utility constructs the ICO wrapper by hand.
 *
 * Modes:
 *   (default)  stage + validate all five ICONVERSION in .omp/tmp/favicon-repair,
 *              then replace the five original targets only when every staged
 *              file validates.
 *   --check    validate the five original targets in place and print a row per
 *              target. Exits non-zero if any target is not a valid 32x32 ICO
 *              whose single embedded image is a PNG payload.
 *
 * Refuses to modify a file when it is missing, already ICO, non-PNG, not 32x32,
 * or has an unexpected size. Processing is all-or-nothing so a partial failure
 * never publishes a mixed set.
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');
const STAGING_DIR = join(REPO_ROOT, '.omp', 'tmp', 'favicon-repair');
const REPORT_PATH = join(REPO_ROOT, '.omp', 'review', 'favicon-repair.json');

const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const EXPECTED_PNG_LENGTH = 1991;

const TARGETS = [
  'site/app/(site)/favicon.ico',
  'site/public/favicon.ico',
  'site/public/assets/favicon.ico',
  'site/public/assets/marketing/brand/logos/favicon.ico',
  'tech-docs-generator/public/favicon.ico',
];

function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

function pngDimensions(buf) {
  // PNG signature (8) + length (4) + 'IHDR' (4) + width (4) + height (4) ...
  if (buf.length < 26) return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

/**
 * Build a single-image ICO container around the given PNG payload.
 * Header layout:
 *   ICONDIR     6 bytes: reserved(2)=0, type(2)=1, count(2)=1
 *   ICONDIRENTRY 16 bytes: width(1)=32, height(1)=32, colors(1)=0, reserved(1)=0,
 *                          planes(2)=1, bitCount(2)=32, bytesInRes(4)=len, offset(4)=22
 * Then the unmodified PNG payload.
 */
function buildIco(png) {
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // count
  header.writeUInt8(32, 6); // width
  header.writeUInt8(32, 7); // height
  header.writeUInt8(0, 8); // colors
  header.writeUInt8(0, 9); // reserved
  header.writeUInt16LE(1, 10); // planes
  header.writeUInt16LE(32, 12); // bitCount
  header.writeUInt32LE(png.length, 14); // bytesInRes
  header.writeUInt32LE(22, 18); // imageOffset
  return Buffer.concat([header, png]);
}

/**
 * Validate a buffer as a 32x32 single-image ICO whose embedded payload is PNG.
 * Returns { ok, reason, imageCount, pngWidth, pngHeight, pngLength, headerHex }.
 */
function validateIco(buf) {
  if (buf.length < 22) {
    return { ok: false, reason: `too short (${buf.length} bytes)`, imageCount: 0 };
  }
  const reserved = buf.readUInt16LE(0);
  const type = buf.readUInt16LE(2);
  const count = buf.readUInt16LE(4);
  if (reserved !== 0 || type !== 1 || count !== 1) {
    return {
      ok: false,
      reason: `invalid ICONDIR reserved=${reserved} type=${type} count=${count}`,
      imageCount: count,
    };
  }
  const width = buf.readUInt8(6);
  const height = buf.readUInt8(7);
  const bytesInRes = buf.readUInt32LE(14);
  const offset = buf.readUInt32LE(18);
  const payload = buf.subarray(offset, offset + bytesInRes);
  if (width !== 32 || height !== 32) {
    return { ok: false, reason: `ICONDIRENTRY size ${width}x${height}`, imageCount: count };
  }
  if (offset !== 22) {
    return { ok: false, reason: `unexpected imageOffset ${offset}`, imageCount: count };
  }
  if (bytesInRes !== payload.length) {
    return {
      ok: false,
      reason: `bytesInRes ${bytesInRes} != payload length ${payload.length}`,
      imageCount: count,
    };
  }
  if (!payload.subarray(0, 8).equals(PNG_SIG)) {
    return { ok: false, reason: 'embedded payload is not a PNG', imageCount: count };
  }
  const dims = pngDimensions(payload);
  if (!dims || dims.width !== 32 || dims.height !== 32) {
    return {
      ok: false,
      reason: `embedded PNG is ${dims ? `${dims.width}x${dims.height}` : 'unparsed'}`,
      imageCount: count,
    };
  }
  return {
    ok: true,
    reason: 'ok',
    imageCount: count,
    pngWidth: dims.width,
    pngHeight: dims.height,
    pngLength: payload.length,
    headerHex: [...buf.subarray(0, 8)].map((b) => b.toString(16).padStart(2, '0')).join(' '),
  };
}

function printRows(rows) {
  for (const r of rows) {
    const status = r.ok ? 'OK  ' : 'FAIL';
    const detail = r.ok
      ? `ico=1 img=${r.imageCount} png=${r.pngWidth}x${r.pngHeight} hdr=${r.headerHex}`
      : `reason=${r.reason}`;
    console.log(`${status} ${r.target}\n      ${detail}`);
  }
}

async function main() {
  const mode = process.argv[2] === '--check' ? 'check' : 'repair';
  const rows = [];

  // Gather target state.
  for (const target of TARGETS) {
    const abs = join(REPO_ROOT, target);
    let buf;
    try {
      buf = await readFile(abs);
    } catch (err) {
      if (err.code === 'ENOENT') {
        rows.push({ target, ok: false, reason: 'missing' });
        continue;
      }
      rows.push({ target, ok: false, reason: `read error: ${err.message}` });
      continue;
    }

    if (buf.subarray(0, 8).equals(PNG_SIG)) {
      const dims = pngDimensions(buf);
      if (buf.length !== EXPECTED_PNG_LENGTH) {
        rows.push({
          target,
          ok: false,
          reason: `PNG but unexpected size ${buf.length} (expected ${EXPECTED_PNG_LENGTH})`,
        });
        continue;
      }
      if (!dims || dims.width !== 32 || dims.height !== 32) {
        rows.push({
          target,
          ok: false,
          reason: `PNG but not 32x32 (${dims ? `${dims.width}x${dims.height}` : 'unparsed'})`,
        });
        continue;
      }
      rows.push({
        target,
        ok: false,
        state: 'png',
        reason: 'raw PNG payload (needs repair)',
        length: buf.length,
        pngWidth: dims.width,
        pngHeight: dims.height,
        headerHex: [...buf.subarray(0, 8)].map((b) => b.toString(16).padStart(2, '0')).join(' '),
      });
      continue;
    }

    const check = validateIco(buf);
    rows.push({
      target,
      ...check,
      state: check.ok ? 'ico' : 'unknown',
      length: buf.length,
      sha256: sha256(buf),
    });
  }

  if (mode === 'check') {
    printRows(rows);
    const bad = rows.filter((r) => !r.ok);
    if (bad.length > 0) {
      console.error(`\n${bad.length} target(s) are not valid 32x32 single-image ICOs.`);
      process.exit(1);
    }
    console.log(`\nAll ${rows.length} targets are valid 32x32 single-image ICOs.`);
    return;
  }

  // repair mode
  printRows(rows);
  const bad = rows.filter((r) => !r.ok && r.state !== 'png');
  if (bad.length > 0) {
    console.error(`\n${bad.length} target(s) cannot be repaired (missing/already ICO/invalid).`);
    process.exit(1);
  }
  const repairable = rows.filter((r) => r.state === 'png');
  if (repairable.length !== TARGETS.length) {
    console.error(
      `Expected ${TARGETS.length} PNG targets to repair, found ${repairable.length}. Refusing partial repair.`,
    );
    process.exit(1);
  }

  // Stage all five ICOs first.
  await rm(STAGING_DIR, { recursive: true, force: true });
  await mkdir(STAGING_DIR, { recursive: true });
  const staged = [];
  for (const r of repairable) {
    const abs = join(REPO_ROOT, r.target);
    const png = await readFile(abs);
    const ico = buildIco(png);
    const stagedPath = join(STAGING_DIR, `${r.target.replace(/[\\/]/g, '__')}.ico`);
    await writeFile(stagedPath, ico);
    const check = validateIco(ico);
    if (!check.ok) {
      console.error(`Staged ICO for ${r.target} failed validation: ${check.reason}`);
      process.exit(1);
    }
    staged.push({
      target: r.target,
      stagedPath,
      preSha256: sha256(png),
      stagedSha256: sha256(ico),
      length: ico.length,
      headerHex: check.headerHex,
      imageCount: check.imageCount,
      pngWidth: check.pngWidth,
      pngHeight: check.pngHeight,
      pngLength: check.pngLength,
    });
  }
  console.log(`\nStaged ${staged.length} ICOs; all validated.`);

  // Replace targets only after all staged ICOs pass.
  const report = [];
  for (const s of staged) {
    const abs = join(REPO_ROOT, s.target);
    const ico = await readFile(s.stagedPath);
    await writeFile(abs, ico);
    const post = await readFile(abs);
    report.push({
      target: s.target,
      preSha256: s.preSha256,
      postSha256: sha256(post),
      length: post.length,
      headerHex: s.headerHex,
      imageCount: s.imageCount,
      pngWidth: s.pngWidth,
      pngHeight: s.pngHeight,
      pngLength: s.pngLength,
      validation: 'ok',
    });
  }

  await mkdir(dirname(REPORT_PATH), { recursive: true });
  await writeFile(
    REPORT_PATH,
    JSON.stringify({ generatedAt: new Date().toISOString(), targets: report }, null, 2),
  );
  console.log(`Replaced ${report.length} targets; wrote ${relative(REPO_ROOT, REPORT_PATH)}.`);
  console.log(await readdir(STAGING_DIR));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
