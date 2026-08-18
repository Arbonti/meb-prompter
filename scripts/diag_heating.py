"""
Comprehensive diagnostic: parse heating XLS, show first 10 rows,
then check first 10 schools from meb_data.js to see their kurum_kodu.
"""
import re, json, os

data_dir = r"C:\Users\alpte_gwx6ike\OneDrive\Masaüstü\MEB PROMPTER\data"

# 1. Find heating file
heating_file = None
for f in os.listdir(data_dir):
    if "ISINMA" in f.upper() or "ısınma" in f.lower() or "isinma" in f.lower():
        heating_file = os.path.join(data_dir, f)
        print(f"Found heating file: {f}")
        break

if not heating_file:
    print("ERROR: No heating file found!")
    exit()

# 2. Read file bytes
with open(heating_file, "rb") as f:
    raw = f.read()

# Strip EOF char
raw = raw.replace(b"\x1a", b"")
content = raw.decode("cp1254", errors="replace")

print(f"File size: {len(content)} chars")

# 3. Find all TDs
all_tds = re.findall(r"<td[^>]*>(.*?)</td>", content, re.DOTALL | re.IGNORECASE)
def clean(text):
    t = re.sub(r"<.*?>", "", text, flags=re.DOTALL).strip()
    t = t.replace("&nbsp;", " ").replace("&amp;", "&").replace("\r","").replace("\n","")
    return t
all_tds = [clean(td) for td in all_tds]

print(f"Total TDs found: {len(all_tds)}")
print(f"\nFirst 84 TD values (6 rows × 14 cols):")
for i in range(0, min(84, len(all_tds)), 14):
    chunk = all_tds[i:i+14]
    print(f"  Row {i//14}: {chunk}")

# 4. Build heating map
heating_map = {}
num_cols = 14
for i in range(0, len(all_tds), num_cols):
    chunk = all_tds[i:i+num_cols]
    if len(chunk) > 7:
        code_raw = chunk[2]
        code = re.sub(r"\D", "", code_raw)
        isinma = chunk[6]
        yakit = chunk[7] if len(chunk) > 7 else ""
        if code and code != "0":
            heating_map[code] = {"isinma": isinma, "yakit": yakit}

print(f"\nHeating map has {len(heating_map)} entries")
print("Sample entries:")
for k,v in list(heating_map.items())[:5]:
    print(f"  {k}: {v}")

# 5. Check meb_data.js
js_path = r"C:\Users\alpte_gwx6ike\OneDrive\Masaüstü\MEB PROMPTER\meb_data.js"
with open(js_path, encoding="utf-8") as f:
    js_content = f.read()

data = json.loads(js_content.replace("const MEB_DATA = ", "").rstrip(";\n"))

print(f"\nChecking actual meb_data.js kurum_kodu vs heating_map:")
for yr in data:
    for st in data[yr]:
        if isinstance(data[yr][st], list) and data[yr][st]:
            items = data[yr][st]
            match_count = 0
            for item in items:
                code = str(item.get("kurum_kodu","")).strip()
                code = code[:-2] if code.endswith(".0") else code
                if code in heating_map:
                    match_count += 1
            total = len(items)
            print(f"  {yr} / {st}: {total} schools, {match_count} would match heating")
            # Show first few codes
            first_codes = [str(i.get("kurum_kodu","")) for i in items[:3]]
            print(f"    First 3 codes: {first_codes}")
