import json

with open('meb_data.json', encoding='utf-8') as f:
    d = json.load(f)


all_keys = {}
for yr in d:
    for st in ['okuloncesi','ilkokul','ortaokul','lise']:
        for item in d[yr][st]:
            for k in item.keys():
                if k not in all_keys:
                    all_keys[k] = 0
                all_keys[k] += 1

print("=== ALL UNIQUE KEYS ===")
for k, cnt in sorted(all_keys.items()):
    print(f"  [{cnt:4d}x] {repr(k)}")
