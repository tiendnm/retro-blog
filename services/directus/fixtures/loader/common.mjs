// Tiện ích chung cho loader (đọc manifest, resolve sets, parse args).
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROFILES } from '../framework/profiles.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const CONTENT_DIR = resolve(HERE, '../content');
export const DEFAULT_BASE = process.env.DIRECTUS_URL ?? 'http://localhost:8055';

export function parseArgs(argv) {
  const a = { yes: false };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--yes') a.yes = true;
    else if (k.startsWith('--')) { a[k.slice(2)] = argv[i + 1]; i++; }
  }
  return a;
}

/** Sets cần xử lý: --set ưu tiên; nếu không có → theo --profile; mặc định small. */
export function resolveSets(args) {
  if (args.set) return [args.set];
  const profile = args.profile ?? 'small';
  const p = PROFILES[profile];
  if (!p) throw new Error(`Profile "${profile}" không tồn tại.`);
  return Object.keys(p);
}

/** Đọc manifest + trả dir để nạp body. null nếu chưa generate. */
export function readManifest(set) {
  const dir = resolve(CONTENT_DIR, set);
  const file = resolve(dir, 'manifest.json');
  if (!existsSync(file)) return null;
  return { manifest: JSON.parse(readFileSync(file, 'utf8')), dir };
}

export function readBody(dir, bodyPath) {
  return readFileSync(resolve(dir, bodyPath), 'utf8');
}
