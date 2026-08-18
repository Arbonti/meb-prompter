import json
import os

path = r"C:\Users\alpte_gwx6ike\OneDrive\Masaüstü\MEB PROMPTER\meb_data_v2.js"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

json_str = content.replace("const MEB_DATA = ", "").rstrip(";\n")
data = json.loads(json_str)

h = 0
for yr in data:
    for st in data[yr]:
        if isinstance(data[yr][st], list):
            for s in data[yr][st]:
                if "isinma_durumu" in s:
                    h += 1

print(f"Total schools in file: {sum(len(v) for yr in data for v in data[yr].values() if isinstance(v, list))}")
print(f"Total with heating data: {h}")
