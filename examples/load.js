// Load the Fretwork Guitar Dataset and answer a few questions with it.
const BASE = "https://guitarfretwork.com/data";
const load = async name => (await fetch(`${BASE}/${name}.json`)).json();

const [chords, scales, songs] = await Promise.all(
  ["chords", "scales", "songs"].map(load)
);

// How do I play F?
const f = chords.find(c => c.symbol === "F");
console.log(`${f.symbol} — notes ${f.notes.join(", ")}`);
for (const s of f.shapes) console.log(`  ${s.position.padEnd(38)} ${s.fret_string}`);

// Which songs can I play knowing only G, C and D?
const known = new Set(["G", "C", "D"]);
const playable = songs.filter(s => s.chords.every(c => known.has(c)));
console.log(`\n${playable.length} songs use only G, C and D:`);
for (const s of playable.slice(0, 5)) console.log(`  ${s.title} (${s.key}, ${s.difficulty})`);

// Where is A minor pentatonic on the neck?
const aPent = scales.find(s => s.id === "a-minor-pentatonic");
console.log(`\n${aPent.type_name} in ${aPent.root}: ${aPent.notes.join(", ")}`);
console.log(`  ${aPent.positions.length} playable notes between frets 0 and 12`);
