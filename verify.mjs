#!/usr/bin/env node
// Standalone verification for the Fretwork Guitar Dataset.
// Depends on nothing but Node and the JSON files in data/.
//   node verify.mjs        re-verify every shape
//   node verify.mjs --self prove the checker catches known-bad shapes
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TUNING = [40, 45, 50, 55, 59, 64];          // E2 A2 D3 G3 B3 E4, low string first
const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const mod = n => ((n % 12) + 12) % 12;

function notePc(name) {
  const m = /^([A-G])([#b]*)/.exec(name.trim());
  if (!m) return null;
  let pc = PC[m[1]];
  for (const ch of m[2]) pc += ch === '#' ? 1 : -1;
  return mod(pc);
}

function soundedPcs(frets) {
  const out = [];
  frets.forEach((f, i) => { if (f !== null && f !== undefined) out.push(mod(TUNING[i] + f)); });
  return out;
}

function lowestMidi(frets) {
  let lo = Infinity;
  frets.forEach((f, i) => { if (f !== null && f !== undefined) lo = Math.min(lo, TUNING[i] + f); });
  return lo;
}

// A shape is valid when every note it sounds is a chord tone, the root sounds,
// the third or suspended note sounds, and the tones that name the chord sound.
function check(rec, shape) {
  const frets = shape.frets;
  if (!Array.isArray(frets) || frets.length !== 6) return 'frets must be 6 entries';
  const sounded = soundedPcs(frets);
  if (!sounded.length) return 'no strings sound';

  const expected = new Set(rec.notes.map(notePc));
  for (const pc of sounded) if (!expected.has(pc)) return 'sounds a note that is not in the chord';

  const rootPc = notePc(rec.root);
  const isSlash = rec.symbol.includes('/');
  const heard = new Set(sounded);
  if (!isSlash && !heard.has(rootPc)) return 'root does not sound';

  const iv = rec.intervals;
  if (iv) {
    const third = iv.includes(3) ? 3 : iv.includes(4) ? 4 : null;
    if (third !== null && !heard.has(mod(rootPc + third))) return 'third does not sound';
    if (third === null && rec.quality !== '5') {
      const sus = iv.includes(2) ? 2 : iv.includes(5) ? 5 : null;
      if (sus !== null && !heard.has(mod(rootPc + sus))) return 'suspended note does not sound';
    }
    for (const need of [10, 11]) {
      if (iv.includes(need) && !heard.has(mod(rootPc + need))) return 'the 7th does not sound';
    }
  }

  if (isSlash) {
    const bass = notePc(rec.symbol.split('/')[1]);
    if (bass !== null && mod(lowestMidi(frets)) !== bass) return 'named bass note is not the lowest';
  }
  return true;
}

function selfTest() {
  // Each case is a minimal record plus a shape that is either right or deliberately wrong.
  const R = (symbol, root, quality, intervals, notes) => ({ symbol, root, quality, intervals, notes });
  const cases = [
    [R('C', 'C', 'major', [0,4,7], ['C','E','G']),        [null,3,2,0,1,0], true,  'correct open C'],
    [R('C', 'C', 'major', [0,4,7], ['C','E','G']),        [null,3,2,0,2,0], false, 'C with a D added'],
    [R('Am','A', 'm',     [0,3,7], ['A','C','E']),        [null,0,2,2,1,0], true,  'correct open Am'],
    [R('Am','A', 'm',     [0,3,7], ['A','C','E']),        [null,0,2,2,2,0], false, 'Am played as A major'],
    [R('Em','E', 'm',     [0,3,7], ['E','G','B']),        [0,2,2,0,0,0],    true,  'correct open Em'],
    [R('E', 'E', 'major', [0,4,7], ['E','G#','B']),       [0,2,2,0,0,0],    false, 'E major played as Em'],
    [R('G7','G', '7',     [0,4,7,10], ['G','B','D','F']), [3,2,0,0,0,1],    true,  'correct open G7'],
    [R('G7','G', '7',     [0,4,7,10], ['G','B','D','F']), [3,2,0,0,0,3],    false, 'G7 with the 7th removed'],
    [R('F', 'F', 'major', [0,4,7], ['F','A','C']),        [1,3,3,2,1,1],    true,  'correct F barre'],
    [R('F', 'F', 'major', [0,4,7], ['F','A','C']),        [1,3,3,2,1,0],    false, 'F barre with a stray open string'],
    [R('D', 'D', 'major', [0,4,7], ['D','F#','A']),       [null,null,0,2,3,2], true,  'correct open D'],
    [R('D', 'D', 'major', [0,4,7], ['D','F#','A']),       [null,null,0,2,3,0], false, 'D with an open E on top'],
  ];
  let pass = 0, fail = 0;
  for (const [rec, frets, shouldPass, label] of cases) {
    const r = check(rec, { frets });
    const ok = (r === true) === shouldPass;
    ok ? pass++ : fail++;
    console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label.padEnd(38)} ${r === true ? 'verified' : r}`);
  }
  console.log(`\nself-test: ${pass} passed, ${fail} failed`);
  return fail;
}

function verifyAll() {
  const chords = JSON.parse(fs.readFileSync(path.join(HERE, 'data', 'chords.json'), 'utf8'));
  let shapes = 0, bad = 0;
  for (const rec of chords) {
    for (const shape of rec.shapes) {
      shapes++;
      const r = check(rec, shape);
      if (r !== true) { bad++; console.log(`FAIL ${rec.symbol} ${shape.fret_string}: ${r}`); }
    }
  }
  console.log(`${shapes - bad} of ${shapes} shapes verified across ${chords.length} chords.`);
  return bad;
}

const failures = process.argv.includes('--self') ? selfTest() : verifyAll();
process.exit(failures ? 1 : 0);
