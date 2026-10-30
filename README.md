# Fretwork Guitar Dataset

An open, machine-readable dataset of guitar chord shapes, scales and traditional song
metadata. Released by [Fretwork](https://guitarfretwork.com) under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) — free to use, including
commercially, as long as you credit Fretwork.

Built for developers, app makers, researchers and AI builders who need reliable guitar
data and don't want to scrape it.

## What's in it

| File | Records | What it holds |
|---|---|---|
| [`data/chords.json`](data/chords.json) | 219 chords / **373 shapes** | Every shape as fret positions, with notes, intervals, barre and open flags |
| [`data/scales.json`](data/scales.json) | 156 | 13 scale types in all 12 keys, with notes and fretboard positions |
| [`data/songs.json`](data/songs.json) | 87 | Traditional and public-domain songs: key, time signature, difficulty, chords used |

JSONL copies of each file sit beside them for streaming and for
`datasets.load_dataset()`.

## Every chord shape is verified

The shapes aren't hand-typed and hoped for. Each one is checked by a program that works
out which pitches the shape actually sounds in standard tuning and compares them against
the chord's real tones. A shape is included only if:

- every note it sounds is a genuine chord tone — no stray notes
- the root sounds
- the third (or the suspended note) sounds
- the note that gives the chord its name — the 7th, the 9th — actually sounds
- for a slash chord, the named bass note is the lowest note

**373 of 373 shapes pass.** The checker itself is tested against deliberately broken
shapes — an Am with a major third, an F barre with a stray open string — and catches
all of them. Run both yourself:

```bash
node verify.mjs        # re-verify every shape in the dataset
node verify.mjs --self # prove the checker catches known-bad shapes
```

## Quick start

```python
import json, urllib.request

url = "https://guitarfretwork.com/data/chords.json"
chords = json.load(urllib.request.urlopen(url))

c = next(c for c in chords if c["symbol"] == "F")
for s in c["shapes"]:
    print(s["position"], s["fret_string"])
```

```javascript
const chords = await (await fetch("https://guitarfretwork.com/data/chords.json")).json();
const f = chords.find(c => c.symbol === "F");
console.log(f.shapes.map(s => s.fret_string));
```

With Hugging Face:

```python
from datasets import load_dataset
ds = load_dataset("HooshangBakht/fretwork-guitar-dataset", "chords")
```

## How to read the data

Frets run low E string first: `[null, 3, 2, 0, 1, 0]` is open C. `null` means the string
isn't played, `0` means open. `fret_string` is the same thing written the common way,
`x32010`. Tuning is standard, E A D G B E.

`intervals` are semitones from the root, so a major chord is `[0, 4, 7]`.

Scale `positions` hold one entry per string, listed as you'd read a tab — high e first,
low E last. `string_number` is 1 for the high e and 6 for the low E, so you never have to
guess from the letter. `frets` are the playable frets between 0 and 12 on that string, and
`root_frets` marks which of them are the root note.

`barre` is worked out from the shape itself, not from its name: it is true only when no
string is open and the lowest fretted fret is held across two or more strings. So a
movable shape like `x355xx` is correctly marked as needing no barre.

Full field descriptions are in [`schema/`](schema/).

## The songs

These are traditional songs, spirituals, carols and sea shanties in the public domain —
*Amazing Grace*, *Scarborough Fair*, *House of the Rising Sun*, *Wayfaring Stranger* and
the like. The dataset holds **metadata only**: title, key, time signature, a difficulty
band and which chords the song uses. It contains no lyrics, no melodies and no notation.

A handful of early 20th-century blues entries (*St. Louis Blues*, *Trouble in Mind*,
*Sitting on Top of the World*) are public domain in the United States but may still be in
copyright elsewhere under life-plus-70 rules. The dataset records only factual metadata
about them, but if you need worldwide public-domain certainty, filter those out.

## Licence and credit

CC BY 4.0. Use it in apps, products, research or model training. The one condition is
credit. Something like:

> Guitar data from [Fretwork](https://guitarfretwork.com), CC BY 4.0.

If you build something with it, we'd genuinely like to see it: hello@guitarfretwork.com

## Citation

```bibtex
@misc{fretwork_guitar_dataset,
  title  = {Fretwork Guitar Dataset},
  author = {{True Music School}},
  year   = {2026},
  url    = {https://guitarfretwork.com/data/},
  note   = {CC BY 4.0}
}
```

## Also available

The same data powers the [Fretwork MCP server](https://mcp.guitarfretwork.com), which
lets AI assistants work with guitar chords, scales and practice plans directly.
