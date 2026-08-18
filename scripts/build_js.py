"""
Build meb_data.js directly from meb_data.json
Data structure:
  genel: dict {sheet_name: list_of_lists}
  okuloncesi/ilkokul/ortaokul/lise: list of dicts (from previous build step)
"""
import json

raw_path = r"C:\Users\alpte_gwx6ike\OneDrive\Masaüstü\MEB PROMPTER\meb_data.json"
out_js   = r"C:\Users\alpte_gwx6ike\OneDrive\Masaüstü\MEB PROMPTER\meb_data.js"

with open(raw_path, encoding="utf-8") as f:
    raw = json.load(f)

def to_num(v):
    if v in (None, "", "None", "nan"): return 0
    try:
        s = str(v).replace(",",".")
        f = float(s)
        if f != f: return 0
        return int(f) if f == int(f) else round(f,1)
    except:
        return str(v).strip() if str(v).strip() else 0

def norm(k):
    k = str(k).strip()
    kl = k.lower()
    if "ilçe" in kl: return "ilce"
    if "okul adı" in kl or "okul adi" in kl: return "okul_adi"
    if "okul türü" in kl or "okul turu" in kl: return "okul_turu"
    if "okul sayı" in kl: return "okul_sayisi"
    if "derslik" in kl: return "derslik_sayisi"
    if "erkek" in kl and "öğrenci" in kl: return "ogrenci_erkek"
    if "kız" in kl and "öğrenci" in kl: return "ogrenci_kiz"
    if "toplam" in kl and "öğrenci" in kl: return "ogrenci_toplam"
    if "öğrenci" in kl and "toplam" in kl: return "ogrenci_toplam"
    if "öğrenci" in kl: return "ogrenci_toplam"
    if "öğretmen" in kl: return "ogretmen_sayisi"
    if "şube" in kl: return "sube_sayisi"
    if "telefon" in kl: return "telefon"
    if "e-posta" in kl or ("mail" in kl): return "email"
    if "kurum" in kl and "kod" in kl: return "kurum_kodu"
    return k

def process_genel(genel_dict):
    """genel is {sheet_name: list_of_lists}"""
    results = []
    for sheet_name, rows in genel_dict.items():
        if not rows: continue
        # Convert dicts to lists if needed
        if isinstance(rows[0], dict):
            keys = list(rows[0].keys())
            new_rows = [keys] + [[r.get(k,"") for k in keys] for r in rows]
            rows = new_rows
        # Find header
        header = None
        data_start = 0
        for i, row in enumerate(rows[:20]):
            text = " ".join([str(c).upper() for c in row])
            n_filled = len([c for c in row if str(c).strip()])
            has_stat = ("DERSLİK" in text or "DERSLIK" in text or
                        "ÖĞRENCİ" in text or "OGRENCI" in text or
                        "ÖĞRETMEN" in text or "OGRETMEN" in text)
            if n_filled >= 3 and has_stat:
                header = [norm(c) for c in row]
                data_start = i + 1
                break
        if not header: continue
        for row in rows[data_start:]:
            cleaned = [str(c).strip() if c is not None else "" for c in row]
            if not any(c for c in cleaned): continue
            entry = {"okul_turu": sheet_name}
            for j, col in enumerate(header):
                if j < len(cleaned) and col:
                    entry[col] = to_num(cleaned[j])
            nums = [v for k,v in entry.items() if k not in ("okul_turu",) and isinstance(v,(int,float)) and v > 0]
            if nums:
                results.append(entry)
    return results

LABELS = {
    "okuloncesi": "Okul Öncesi",
    "ilkokul": "İlkokul",
    "ortaokul": "Ortaokul",
    "lise": "Lise",
}

def process_detail(data_list, school_type_key):
    """data_list is list of dicts"""
    label = LABELS.get(school_type_key, school_type_key)
    results = []
    for entry in data_list:
        if not isinstance(entry, dict): continue
        new_entry = {"okul_turu": entry.get("type", label)}
        for k, v in entry.items():
            if k in ("type","sheet"): continue
            nk = norm(k)
            new_entry[nk] = to_num(v)
        results.append(new_entry)
    return results

final = {}
for year in raw:
    print(f"Processing {year}...")
    yr = raw[year]
    genel      = process_genel(yr.get("genel", {}))
    okuloncesi = process_detail(yr.get("okuloncesi", []), "okuloncesi")
    ilkokul    = process_detail(yr.get("ilkokul",    []), "ilkokul")
    ortaokul   = process_detail(yr.get("ortaokul",   []), "ortaokul")
    lise       = process_detail(yr.get("lise",       []), "lise")
    final[year] = {
        "genel": genel,
        "okuloncesi": okuloncesi,
        "ilkokul": ilkokul,
        "ortaokul": ortaokul,
        "lise": lise,
    }
    print(f"  genel:{len(genel)} okuloncesi:{len(okuloncesi)} ilkokul:{len(ilkokul)} ortaokul:{len(ortaokul)} lise:{len(lise)}")
    # Sample
    if genel: print(f"  genel[0]: {genel[0]}")
    if ilkokul: print(f"  ilkokul[0]: {ilkokul[0]}")

js = "const MEB_DATA = " + json.dumps(final, ensure_ascii=False, indent=2) + ";\n"
with open(out_js, "w", encoding="utf-8") as f:
    f.write(js)
print(f"\nDone! {len(js)//1024} KB written to meb_data.js")
