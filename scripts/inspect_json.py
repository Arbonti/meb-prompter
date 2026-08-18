import json, os, re

raw_path = r"C:\Users\alpte_gwx6ike\OneDrive\Masaüstü\MEB PROMPTER\data_raw.json"
out_path = r"C:\Users\alpte_gwx6ike\OneDrive\Masaüstü\MEB PROMPTER\meb_data.json"

with open(raw_path, encoding="utf-8") as f:
    raw = json.load(f)

def to_num(v):
    if v in (None, "", "None", "nan"):
        return 0
    try:
        f = float(str(v).replace(",","."))
        return int(f) if f == int(f) else f
    except:
        return str(v)

def clean(s):
    return str(s).strip().replace("  "," ") if s else ""


def extract_genel_summary(genel_data):
    """
    The TABLO xlsx has summaries by school type.
    We look for a sheet named like 'İl Geneli' or similar.
    """
    summary = {}
    for sheet_name, rows in genel_data.items():
        
        print(f"\n  Sheet: {sheet_name}")
        for i, row in enumerate(rows[:20]):
            print(f"    R{i+1}: {row[:8]}")
    return summary

print("=== 2021-2022 GENEL ===")
for sheet, rows in raw["2021-2022"]["genel"].items():
    print(f"\nSheet: '{sheet}', rows={len(rows)}")
    for i, row in enumerate(rows[:15]):
        if any(r for r in row if r not in ('', '0.0', '0')):
            print(f"  R{i+1}: {row[:10]}")

print("\n\n=== 2020-2021 GENEL ===")
for sheet, rows in raw["2020-2021"]["genel"].items():
    print(f"\nSheet: '{sheet}', rows={len(rows)}")
    for i, row in enumerate(rows[:15]):
        if any(r for r in row if r not in ('', '0.0', '0')):
            print(f"  R{i+1}: {row[:10]}")

print("\n\n=== 2021-2022 OKULONCESI (first 10 rows) ===")
for sheet, rows in raw["2021-2022"]["okuloncesi"].items():
    print(f"\nSheet: '{sheet}', rows={len(rows)}")
    for i, row in enumerate(rows[:10]):
        print(f"  R{i+1}: {row[:10]}")

print("\n\n=== 2021-2022 ILKOKUL (first 10 rows) ===")
for sheet, rows in raw["2021-2022"]["ilkokul"].items():
    print(f"\nSheet: '{sheet}', rows={len(rows)}")
    for i, row in enumerate(rows[:10]):
        print(f"  R{i+1}: {row[:10]}")

print("\n\n=== 2021-2022 LISE (first 10 rows) ===")
for sheet, rows in raw["2021-2022"]["lise"].items():
    print(f"\nSheet: '{sheet}', rows={len(rows)}")
    for i, row in enumerate(rows[:10]):
        print(f"  R{i+1}: {row[:10]}")
