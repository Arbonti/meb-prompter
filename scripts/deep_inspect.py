import json, os

json_path = r"C:\Users\alpte_gwx6ike\OneDrive\Masaüstü\MEB PROMPTER\meb_data.json"
out_js = r"C:\Users\alpte_gwx6ike\OneDrive\Masaüstü\MEB PROMPTER\meb_data.js"

with open(json_path, encoding="utf-8") as f:
    data = json.load(f)


for year in data:
    print(f"=== {year} GENEL ===")
    for sheet in data[year]["genel"]:
        rows = data[year]["genel"][sheet]
        print(f"  Sheet: '{sheet}', {len(rows)} rows")
        if rows and isinstance(rows[0], dict):
            print(f"    Keys: {list(rows[0].keys())}")
            for r in rows[:5]:
                print(f"    {r}")
        elif rows and isinstance(rows[0], list):
            for r in rows[:5]:
                print(f"    {r}")
    print()

print("=== 2021-2022 OKULONCESI SAMPLE (first 5) ===")
for item in data["2021-2022"]["okuloncesi"][:5]:
    print(f"  {item}")

print("\n=== 2021-2022 ILKOKUL SAMPLE (first 5) ===")
for item in data["2021-2022"]["ilkokul"][:5]:
    print(f"  {item}")

print("\n=== 2021-2022 ORTAOKUL SAMPLE (first 5) ===")
for item in data["2021-2022"]["ortaokul"][:5]:
    print(f"  {item}")

print("\n=== 2021-2022 LISE SAMPLE (first 5) ===")
for item in data["2021-2022"]["lise"][:5]:
    print(f"  {item}")
