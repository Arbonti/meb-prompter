import json, os

path = r"C:\Users\alpte_gwx6ike\OneDrive\Masaüstü\MEB PROMPTER\meb_data_v4.js"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

json_str = content.replace("const MEB_DATA = ", "").rstrip(";\n")
data = json.loads(json_str)

total_schools = 0
schools_with_heating = 0

for yr in data:
    for st in data[yr]:
        if st in ["genel"]: continue # skip root summary
        for school in data[yr][st]:
            total_schools += 1
            if "isinma_durumu" in school and school["isinma_durumu"] not in [None, "None", "0"]:
                schools_with_heating += 1

print(f"Total schools: {total_schools}")
print(f"Schools with isinma_durumu: {schools_with_heating}")
