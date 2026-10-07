# Affiche les mots horodatés entre deux instants : python3 mots.py trans.json 95 125
import json, sys
segs = json.load(open(sys.argv[1])); a, b = float(sys.argv[2]), float(sys.argv[3])
ws = [w for s in segs for w in s['words'] if a <= w[0] <= b]
line = []
for w in ws:
    line.append(f"{w[0]:.1f}{w[2]}")
    if len(line) == 10: print(' '.join(line)); line = []
print(' '.join(line))
