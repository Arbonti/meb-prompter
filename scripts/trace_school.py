import xlrd, json, os, re, glob

data_dir = r"C:\Users\alpte_gwx6ike\OneDrive\Masaüstü\MEB PROMPTER\data"
# Search for heating data
heating_data = {}
all_xls = glob.glob(os.path.join(data_dir, "*2021*.xls"))
h_path = None
for f in all_xls:
    base = os.path.basename(f).upper()
    if ("ISINMA" in base or "ISİNMA" in base) and os.path.getsize(f) > 100000:
        h_path = f
        break

if not h_path: print("Heating file NOT found!"); exit()

# Parse heating
f = open(h_path, "rb")
c = f.read().decode("cp1254", errors="ignore")
tds = re.findall(r"<td.*?>(.*?)</td>", c, re.DOTALL | re.IGNORECASE)
tags = [re.sub(r"<.*?>", "", t, flags=re.DOTALL).strip().replace("&nbsp;", " ") for t in tds]
for i, t in enumerate(tags):
    if re.fullmatch(r"\d{6}", t):
        if t == "756097":
            # i+4 is isinma, i+5 is yakit
            print(f"TRACE: Found 756097 in XLS at index {i}. Val at i+4={tags[i+4]}, i+5={tags[i+5]}")
            heating_data[t] = {"isinma": tags[i+4], "yakit": tags[i+5]}

# Parse detail
lise_path = os.path.join(data_dir, "lise_2122.xls")
wb = xlrd.open_workbook(lise_path)
s = wb.sheet_by_index(0)
items = []
for r in range(s.nrows):
    row = s.row_values(r)
    if len(row) > 1:
        kval = row[1]
        code = str(int(kval)) if isinstance(kval, (int, float)) else str(kval)
        if code == "756097":
            print(f"TRACE: Found 756097 in lise_2122.xls at row {r}")
            item = {"kurum_kodu": code, "okul_adi": row[2]}
            # Merge
            if code in heating_data:
                print(f"TRACE: Merging heating for 756097: {heating_data[code]}")
                item["isinma_durumu"] = heating_data[code]["isinma"]
                item["yakit_turu"] = heating_data[code]["yakit"]
            items.append(item)

# Final Check
found = [it for it in items if it.get("kurum_kodu") == "756097"]
print(f"TRACE: Final item in list: {found}")
