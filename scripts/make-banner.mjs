/**
 * Generates the README banner at `.github/banner.svg`.
 *
 * The lettering is drawn from a 5x7 bitmap font rather than set in a typeface,
 * because GitHub strips `<style>` and web fonts from rendered SVGs — anything
 * that depends on a font being available would fall back to something else on
 * someone else's machine. Rectangles always render.
 *
 *   node scripts/make-banner.mjs
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/* ---------------------------------------------------------------------------
   5x7 bitmap font
   --------------------------------------------------------------------------- */

const FONT = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
};

const GLYPH_W = 5;
const GLYPH_H = 7;

/* ---------------------------------------------------------------------------
   Palette — the site's own tokens
   --------------------------------------------------------------------------- */

const BG = "#0d1117";
const FACE = "#62a0ea";
const EXTRUDE = "#1a5fb4";
const RULE = "#242c36";
const MUTED = "#93a1b0";

/** Width in px of a word set at the given cell size. */
function wordWidth(word, cell) {
  return word.length * GLYPH_W * cell + (word.length - 1) * cell;
}

/**
 * Emit one word as two passes: the extruded silhouette first, then the face on
 * top. Drawing every shadow before every face stops a later letter's shadow
 * landing on an earlier letter's face.
 *
 * The shadow blocks are full-cell while the face blocks are inset. That matters:
 * inset shadow blocks show through the face's grid gaps and read as blur rather
 * than depth, so the silhouette has to be solid.
 */
function word(text, { x, y, cell, face, extrude, depth }) {
  const shadows = [];
  const faces = [];
  const inset = Math.max(1, Math.round(cell * 0.1));

  text.split("").forEach((character, index) => {
    const glyph = FONT[character.toUpperCase()];
    if (!glyph) throw new Error(`No glyph for ${JSON.stringify(character)}`);

    const originX = x + index * (GLYPH_W + 1) * cell;
    glyph.forEach((row, rowIndex) => {
      row.split("").forEach((bit, columnIndex) => {
        if (bit !== "1") return;
        const bx = originX + columnIndex * cell;
        const by = y + rowIndex * cell;
        if (depth > 0) {
          shadows.push(
            `<rect x="${bx + depth}" y="${by + depth}" width="${cell}" height="${cell}" fill="${extrude}"/>`,
          );
        }
        faces.push(
          `<rect x="${bx}" y="${by}" width="${cell - inset}" height="${cell - inset}" fill="${face}"/>`,
        );
      });
    });
  });

  return [...shadows, ...faces].join("");
}

/* ---------------------------------------------------------------------------
   Compose
   --------------------------------------------------------------------------- */

const BIG = 13;
const SMALL = 7;
const DEPTH_BIG = Math.round(BIG * 0.62);
const DEPTH_SMALL = 0;

const PAD = 44;
const headline = "STATISTICS";
const subhead = "FOR PROGRAMMERS";

const headlineW = wordWidth(headline, BIG);
const subheadW = wordWidth(subhead, SMALL);
const width = Math.max(headlineW, subheadW) + PAD * 2;

const eyebrowY = PAD + 14;
const headlineY = eyebrowY + 26;
const subheadY = headlineY + GLYPH_H * BIG + DEPTH_BIG + 30;
const ruleY = subheadY + GLYPH_H * SMALL + DEPTH_SMALL + 30;
const footY = ruleY + 26;
const height = footY + 14 + PAD;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Statistics for Programmers — an interactive course with real Python in the browser">
  <rect width="${width}" height="${height}" fill="${BG}"/>
  <text x="${PAD}" y="${eyebrowY}" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" letter-spacing="3.5" fill="${MUTED}">AN INTERACTIVE COURSE IN</text>
  ${word(headline, { x: PAD, y: headlineY, cell: BIG, face: FACE, extrude: EXTRUDE, depth: DEPTH_BIG })}
  ${word(subhead, { x: PAD, y: subheadY, cell: SMALL, face: FACE, extrude: EXTRUDE, depth: DEPTH_SMALL })}
  <rect x="${PAD}" y="${ruleY}" width="${width - PAD * 2}" height="1" fill="${RULE}"/>
  <text x="${PAD}" y="${footY}" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" fill="${MUTED}">14 chapters · 55 lessons · 157 runnable code cells · real Python in the browser</text>
</svg>
`;

const out = path.join(projectRoot, ".github", "banner.svg");
await mkdir(path.dirname(out), { recursive: true });
await writeFile(out, svg, "utf8");
console.log(`Wrote ${path.relative(projectRoot, out)} (${width}x${height}, ${svg.length} bytes)`);
