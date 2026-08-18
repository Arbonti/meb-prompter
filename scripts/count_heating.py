import json
import os

path = r"C:\Users\alpte_gwx6ike\OneDrive\Masaüstü\MEB PROMPTER\meb_data.json"
if not os.path.exists(path):
    # Try meb_data.js and trim prefix
    path = r"C:\Users\alpte_gwx6ike\OneDrive\Masaüstü\MEB PROMPTER\meb_data.js"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    json_str = content.replace("const MEB_DATA = ", "").rstrip(";\n")
    data = json.loads(json_str)
else:
    data = json.load(open(path, encoding="utf-8"))

total = 0
with_h = 0
details = {}

for yr in data:
    for st in data[yr]:
        if isinstance(data[yr][st], list):
            count = len(data[yr][st])
            total += count
            h_count = sum(1 for s in data[yr][st] if "isinma_durumu" in s)
            with_h += h_count
            details[f"{yr} {st}"] = (h_count, count)

print(f"Total schools: {total}")
print(f"With heating: {with_h}")
print("\nBreakdown:")
for k, (h, t) in details.items():
    if t > 0:
        print(f"  {k}: {h}/{t} ({h/t:.1%})")
