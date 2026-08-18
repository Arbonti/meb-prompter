import json, os

path = r"C:\Users\alpte_gwx6ike\OneDrive\Masaüstü\MEB PROMPTER\meb_data_v4.js"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

json_str = content.replace("const MEB_DATA = ", "").rstrip(";\n")
data = json.loads(json_str)

found = False
for yr in ["2021-2022", "2020-2021"]:
    for school in data[yr]["lise"]:
        if school.get("kurum_kodu") == "756097":
            print(f"[{yr}] School: {school.get('okul_adi')}")
            print(f"[{yr}] isinma_durumu: {school.get('isinma_durumu')}")
            print(f"[{yr}] yakit_turu: {school.get('yakit_turu')}")
            found = True

if not found:
    print("Aydın Lisesi (756097) NOT FOUND in JS data!")
