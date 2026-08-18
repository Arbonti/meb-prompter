import json

with open('data_raw.json', encoding='utf-8') as f:
    d = json.load(f)


ilkokul = d['2021-2022']['ilkokul']
print(f"ilkokul type: {type(ilkokul)}")
if isinstance(ilkokul, dict):
    print(f"ilkokul sheets: {list(ilkokul.keys())}")
    for sheet, rows in ilkokul.items():
        print(f"\nSheet '{sheet}': {len(rows)} rows")
        for i, row in enumerate(rows[:10]):
            print(f"  R{i+1}: {row[:12]}")
elif isinstance(ilkokul, list):
    print(f"ilkokul is list: {len(ilkokul)} rows")
    if ilkokul:
        print(f"  First: {ilkokul[0]}")
        print(f"  Keys: {list(ilkokul[0].keys()) if isinstance(ilkokul[0], dict) else 'not dict'}")
