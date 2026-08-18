import json
with open('meb_data.json', encoding='utf-8') as f:
    d = json.load(f)

for yr in ['2021-2022', '2020-2021']:
    for st in ['okuloncesi','ilkokul','ortaokul','lise']:
        items = d[yr][st]
        if not items: continue
        keys = list(items[0].keys())
        sample = items[0]
        ogrenci = sample.get('ogrenci_toplam', 'YOOK')
        type_val = sample.get('type', sample.get('okul_turu','?'))
        
        ogr_keys = [k for k in keys if 'öğrenci' in k.lower() or 'ogrenci' in k.lower() or 'enci' in k.lower()]
        print(f"{yr}/{st}: {len(items)} rows, ogrenci_toplam={ogrenci}, ogr_keys={ogr_keys}")
        print(f"  ALL KEYS: {keys[:15]}")
        print(f"  sample: {dict(list(sample.items())[:8])}")
        print()
