import json
with open('meb_data.json', encoding='utf-8') as f:
    d = json.load(f)


all_cols = set()
for yr in d:
    for st in ['okuloncesi','ilkokul','ortaokul','lise']:
        for item in d[yr][st]:
            for k in item.keys():
                all_cols.add(k)
    for sheet in d[yr]['genel']:
        rows = d[yr]['genel'][sheet]
        if rows and isinstance(rows[0], dict):
            for item in rows:
                for k in item.keys():
                    all_cols.add(k)

print('ALL COLUMN NAMES:')
for c in sorted(all_cols):
    print(f'  {repr(c)}')

print('\n\n=== SAMPLE DATA ===')

print('2021-2022 ilkokul sample:')
for item in d['2021-2022']['ilkokul'][:5]:
    print(f'  {json.dumps(item, ensure_ascii=False)[:120]}')

print('\n2021-2022 genel sheets:')
for sheet in d['2021-2022']['genel']:
    rows = d['2021-2022']['genel'][sheet]
    print(f'  Sheet: {sheet}, {len(rows)} rows')
    if rows:
        for r in rows[:3]:
            print(f'    {json.dumps(r, ensure_ascii=False)[:150]}')
