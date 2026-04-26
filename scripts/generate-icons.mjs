#!/usr/bin/env node
/**
 * generate-icons.mjs
 *
 * Renders all PNG icon exports from the master SVG and removes the
 * legacy fourth_gen_v1_*.png assets that nothing references anymore.
 *
 * Outputs (all in assets/):
 *   icon.png            1024x1024  — iOS app icon (deep indigo bg, mark centered)
 *   adaptive-icon.png   1024x1024  — Android adaptive foreground (mark, transparent bg)
 *                                    Foreground is sized to the inner 66% safe zone.
 *   favicon.png         48x48      — Web favicon (deep indigo bg)
 *   splash-icon.png     1242x1242  — Expo splash (transparent, composed onto theme bg)
 *
 * Usage: `npm run icons`
 *
 * Requires: sharp (added as a devDependency)
 */

import sharp from "sharp";
import { readFile, writeFile, unlink, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS = resolve(__dirname, "..", "assets");

const BRAND_BG_DARK = "#06091A"; // matches lightColors->background's dark counterpart

// ---------------------------------------------------------------------------
// Master SVG → variants
// ---------------------------------------------------------------------------
// We build slightly different SVGs per output so the mark sits correctly
// inside each platform's expected canvas.
function buildSvg({ size = 1024, padding = 0, background = null }) {
  const inner = size - padding * 2;
  const bgRect = background
    ? `<rect x="0" y="0" width="${size}" height="${size}" fill="${background}"/>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="q2grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#00E6C8" stop-opacity="0.20"/>
      <stop offset="1" stop-color="#00E6C8" stop-opacity="0.36"/>
    </linearGradient>
  </defs>
  ${bgRect}
  <g transform="translate(${padding} ${padding}) scale(${inner / 64})">
    <rect x="6" y="6"  width="24" height="24" rx="5" ry="5"
          fill="rgba(255,107,107,0.07)" stroke="rgba(232,236,248,0.30)" stroke-width="1.2"/>
    <rect x="6" y="34" width="24" height="24" rx="5" ry="5"
          fill="rgba(106,154,255,0.07)" stroke="rgba(232,236,248,0.30)" stroke-width="1.2"/>
    <rect x="34" y="34" width="24" height="24" rx="5" ry="5"
          fill="rgba(138,147,171,0.08)" stroke="rgba(232,236,248,0.30)" stroke-width="1.2"/>
    <rect x="34" y="6" width="24" height="24" rx="5" ry="5"
          fill="url(#q2grad)" stroke="#00E6C8" stroke-width="2"/>
    <circle cx="46" cy="18" r="6" fill="none" stroke="#00E6C8" stroke-width="1.6"/>
    <circle cx="46" cy="18" r="2" fill="#00E6C8"/>
    <line x1="46" y1="8"  x2="46" y2="10.5" stroke="#00E6C8" stroke-width="1.6" stroke-linecap="round"/>
    <line x1="46" y1="28" x2="46" y2="25.5" stroke="#00E6C8" stroke-width="1.6" stroke-linecap="round"/>
    <line x1="36" y1="18" x2="38.5" y2="18" stroke="#00E6C8" stroke-width="1.6" stroke-linecap="round"/>
    <line x1="56" y1="18" x2="53.5" y2="18" stroke="#00E6C8" stroke-width="1.6" stroke-linecap="round"/>
  </g>
</svg>`;
}

async function render(svg, outFile) {
  const out = resolve(ASSETS, outFile);
  await sharp(Buffer.from(svg)).png().toFile(out);
  console.log(`  ✓ ${outFile}`);
}

async function maybeUnlink(file) {
  const p = resolve(ASSETS, file);
  try {
    await access(p);
    await unlink(p);
    console.log(`  ✗ removed ${file}`);
  } catch {
    // already gone — fine
  }
}

// ---------------------------------------------------------------------------
async function main() {
  console.log("Rendering icons →");

  // iOS app icon: filled background, mark fills ~70% of canvas
  await render(
    buildSvg({ size: 1024, padding: 160, background: BRAND_BG_DARK }),
    "icon.png"
  );

  // Android adaptive foreground: transparent bg, mark inside inner 66% safe zone
  // (Android adds the background separately and clips to a mask, so we leave
  // ~17% padding on each edge — total 33% reserved for the OS mask)
  await render(
    buildSvg({ size: 1024, padding: 174, background: null }),
    "adaptive-icon.png"
  );

  // Favicon: small, filled background
  await render(
    buildSvg({ size: 48, padding: 4, background: BRAND_BG_DARK }),
    "favicon.png"
  );

  // Splash icon: transparent, mark at ~55% of canvas (Expo composes onto bg)
  await render(
    buildSvg({ size: 1242, padding: 280, background: null }),
    "splash-icon.png"
  );

  console.log("\nCleaning up unused legacy assets →");
  for (const f of [
    "fourth_gen_v1_black_fg_trans_bg.png",
    "fourth_gen_v1_black_bg.png",
    "fourth_gen_v1_white_fg_trans_bg.png",
    "fourth_gen_v1_white_bg.png",
  ]) {
    await maybeUnlink(f);
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
