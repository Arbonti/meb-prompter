import json, os, re

raw_path = r"C:\Users\alpte_gwx6ike\OneDrive\Masaüstü\MEB PROMPTER\data_raw.json"

with open(raw_path, encoding="utf-8") as f:
    raw = json.load(f)

def to_num(v):
    if v in (None, "", "None", "nan", "0.0"):
        return 0
    try:
        s = str(v).replace(",", ".")
        f = float(s)
        return int(f) if f == int(f) else round(f, 1)
    except:
        return str(v).strip()

def clean_str(s):
    s = str(s).strip()
    s = s.replace("None", "").replace("nan", "").strip()
    return s

ILCE_LIST = [
    "BOZDOĞAN","BUHARKENT","ÇİNE","DİDİM","EFELER","GERMENCİK",
    "İNCİRLİOVA","İLÇE","KARACASU","KARPUZLU","KOÇARLI","KÖŞK",
    "KUŞADASI","KUYUCAK","NAZİLLİ","SÖKE","SULTANHİSAR","YENİPAZAR"
]

def is_ilce(s):
    s = str(s).upper().strip()
    for ilce in ILCE_LIST:
        if s == ilce or s.startswith(ilce):
            return True
    return False

def parse_genel_tablo(genel_data, year):
    """Parse TABLO xlsx - özet istatistikler okul türüne göre"""
    result = {"okul_turleri": {}, "il_geneli": {}, "ilceler": {}}

    for sheet_name, rows in genel_data.items():
        
        header = None
        for i, row in enumerate(rows):
            clean_row = [clean_str(c) for c in row]
           
            combined = " ".join(clean_row).upper()
            if "İLÇE" in combined or "OKUL" in combined:
                if "DERSLİK" in combined or "ÖĞRENCİ" in combined or "ÖĞRETMEN" in combined:
                    header = clean_row
                    data_start = i + 1
                    break

        if header is None:
            
            if len(rows) > 3:
                header = [clean_str(c) for c in rows[2]]
                data_start = 3

        if header and data_start:
            entries = []
            for row in rows[data_start:]:
                clean_row = [clean_str(c) for c in row]
                if not any(c for c in clean_row):
                    continue
                if any(c for c in clean_row):
                    entry = {}
                    for j, col in enumerate(header):
                        if j < len(clean_row) and col:
                            entry[col] = to_num(clean_row[j])
                    if entry:
                        entries.append(entry)
            result["okul_turleri"][sheet_name] = entries

    return result

def parse_detail_file(detail_data, school_type):
    """Parse detail xls - her okul için detay bilgi"""
    schools = []
    for sheet_name, rows in detail_data.items():
        if not rows:
            continue

        
        header = None
        data_start = 0
        for i, row in enumerate(rows[:10]):
            combined = " ".join([str(c).upper() for c in row])
            if ("DERSLİK" in combined or "OKUL ADI" in combined or
                "ÖĞRENCİ" in combined or "ÖĞRETMEN" in combined or
                "OKUL" in combined):
                header = [clean_str(c) for c in row]
                data_start = i + 1
                break

        if header is None and len(rows) > 0:
            
            for i, row in enumerate(rows[:5]):
                if any(str(c).strip() for c in row):
                    header = [clean_str(c) for c in row]
                    data_start = i + 1
                    break

        if header:
            for row in rows[data_start:]:
                if not any(c for c in row if str(c).strip()):
                    continue
                entry = {"type": school_type, "sheet": sheet_name}
                for j, col in enumerate(header):
                    if j < len(row) and col:
                        entry[col] = to_num(row[j])
                if entry and len([k for k in entry.keys() if k not in ("type","sheet")]) > 0:
                    schools.append(entry)
        else:
            
            for row in rows:
                if any(str(c).strip() for c in row):
                    schools.append({"row": [clean_str(c) for c in row], "type": school_type})

    return schools


final_data = {}

for year in ["2021-2022", "2020-2021"]:
    print(f"\nProcessing year: {year}")
    year_data = raw[year]

    final_data[year] = {
        "genel": {},
        "ilkokul": [],
        "okuloncesi": [],
        "ortaokul": [],
        "lise": []
    }

   
    if "genel" in year_data:
        genel = year_data["genel"]
        for sheet_name, rows in genel.items():
            print(f"  Genel sheet: {sheet_name}, rows: {len(rows)}")
            final_data[year]["genel"][sheet_name] = []

            
            header = None
            data_start = 0
            for i, row in enumerate(rows[:15]):
                clean_row = [clean_str(c) for c in row]
                combined = " ".join(clean_row).upper()
                if ("DERSLİK" in combined or "ÖĞRENCİ" in combined) and len([c for c in clean_row if c]) > 3:
                    header = clean_row
                    data_start = i + 1
                    break

            if header:
                print(f"    Header found at row {data_start}: {header[:8]}")
                for row in rows[data_start:]:
                    clean_row = [clean_str(c) for c in row]
                    if not any(c for c in clean_row):
                        continue
                    entry = {}
                    for j, col in enumerate(header):
                        if j < len(clean_row):
                            entry[col] = to_num(clean_row[j])
                    if any(v for v in entry.values() if v != 0 and v != ""):
                        final_data[year]["genel"][sheet_name].append(entry)
            else:
                
                final_data[year]["genel"][sheet_name] = [
                    [clean_str(c) for c in row] for row in rows
                ]

    
    for school_type in ["okuloncesi", "ilkokul", "ortaokul", "lise"]:
        if school_type in year_data:
            schools = parse_detail_file(year_data[school_type], school_type)
            final_data[year][school_type] = schools
            print(f"  {school_type}: {len(schools)} entries")


out_path = r"C:\Users\alpte_gwx6ike\OneDrive\Masaüstü\MEB PROMPTER\meb_data.json"
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(final_data, f, ensure_ascii=False, indent=2)

print(f"\n\nSaved to {out_path}")


print("\n=== SAMPLE DATA ===")
for year in final_data:
    print(f"\nYear: {year}")
    print(f"  Genel sheets: {list(final_data[year]['genel'].keys())}")
    for st in ["okuloncesi","ilkokul","ortaokul","lise"]:
        cnt = len(final_data[year][st])
        sample = final_data[year][st][:2] if cnt > 0 else []
        print(f"  {st}: {cnt} entries")
        for s in sample:
            print(f"    {dict(list(s.items())[:6])}")
