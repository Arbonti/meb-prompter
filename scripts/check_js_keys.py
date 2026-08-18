import json

with open('meb_data.js', encoding='utf-8') as f:
    content = f.read()


json_str = content[len('const MEB_DATA = '):-2]  
data = json.loads(json_str)

print("=== 2021-2022 ILKOKUL ===")
items = data['2021-2022']['ilkokul']
print(f"Count: {len(items)}")
if items:
    print(f"First item keys: {list(items[0].keys())}")
    print(f"First 3 items:")
    for item in items[:3]:
        print(f"  {item}")
    
    # Check ogrenci stats
    with_ogrenci = [i for i in items if i.get('ogrenci_toplam', 0) > 0]
    with_ilce = [i for i in items if i.get('ilce','') not in ('',0,'0')]
    print(f"\nWith ogrenci_toplam > 0: {len(with_ogrenci)}")
    print(f"With ilce: {len(with_ilce)}")
    if with_ilce:
        print(f"  Sample ilce item: {with_ilce[0]}")
    
    
    all_keys = set()
    for item in items:
        for k, v in item.items():
            if v and v != 0:
                all_keys.add(k)
    print(f"\nAll keys with non-zero values: {sorted(all_keys)}")
