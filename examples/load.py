"""Load the Fretwork Guitar Dataset and answer a few questions with it."""
import json
import urllib.request

BASE = "https://guitarfretwork.com/data"

def load(name):
    with urllib.request.urlopen(f"{BASE}/{name}.json") as r:
        return json.load(r)

chords, scales, songs = load("chords"), load("scales"), load("songs")

# How do I play F?
f = next(c for c in chords if c["symbol"] == "F")
print(f"{f['symbol']} — notes {', '.join(f['notes'])}")
for s in f["shapes"]:
    print(f"  {s['position']:<38} {s['fret_string']}")

# Which songs can I play knowing only G, C and D?
known = {"G", "C", "D"}
playable = [s for s in songs if set(s["chords"]) <= known]
print(f"\n{len(playable)} songs use only G, C and D:")
for s in playable[:5]:
    print(f"  {s['title']} ({s['key']}, {s['difficulty']})")

# Where is A minor pentatonic on the neck?
a_pent = next(s for s in scales if s["id"] == "a-minor-pentatonic")
print(f"\n{a_pent['type_name']} in {a_pent['root']}: {', '.join(a_pent['notes'])}")
print(f"  {len(a_pent['positions'])} playable notes between frets 0 and 12")

# Every chord shape you can play without barring
easy = [c["symbol"] for c in chords if any(s["open"] and not s["barre"] for s in c["shapes"])]
print(f"\n{len(easy)} chords have an open shape: {', '.join(easy[:12])}...")
