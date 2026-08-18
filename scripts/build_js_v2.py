"""
ham JSON'u alıp JS dosyasına dönüştüren script
Excel başlıkları her yıl farklı geliyor, bunu normalize ediyorum
"""
import json, re

raw_path = r"C:\Users\alpte_gwx6ike\OneDrive\Masaüstü\MEB PROMPTER\data_raw.json"
out_js   = r"C:\Users\alpte_gwx6ike\OneDrive\Masaüstü\MEB PROMPTER\meb_data.js"

with open(raw_path, encoding="utf-8") as f:
    raw = json.load(f)

def to_num(v):
    # boş ve nan değerleri 0 döndür
    if v in (None, "", "None", "nan"): return 0
    try:
        s = str(v).replace(",",".")
        f = float(s)
        if f != f: return 0  # NaN
        return int(f) if f == int(f) else round(f,1)
    except:
        return str(v).strip() if str(v).strip() else 0

def clean_col(k):
    # Excel başlıklarında \n vs. oluyor, temizle
    if k is None: return ""
    return re.sub(r'\s+', ' ', str(k)).strip()

def norm(k):
    # farklı yazılmış başlıkları standart anahtara çevir
    # örn: 'Öğrenci\nToplam' → 'ogrenci_toplam'
    k = clean_col(k)
    kl = k.lower()

    if re.search(r'il[cç]e', kl): return "ilce"
    if re.search(r'okul.*(ad[iı]|isim)', kl) or re.search(r'ad[iı].*okul', kl): return "okul_adi"
    if re.search(r'okul.*(t[uü]r|tip)', kl): return "okul_turu"
    if re.search(r'okul.*say', kl) or (re.search(r'okul', kl) and re.search(r'adet|say', kl)): return "okul_sayisi"
    if re.search(r'derslik', kl): return "derslik_sayisi"
    # öğrenci — erkek/kız önce kontrol et
    if re.search(r'erkek', kl) and re.search(r'[öo]grenci|[öo][gğ]renci', kl): return "ogrenci_erkek"
    if re.search(r'k[iı]z', kl) and re.search(r'[öo]grenci|[öo][gğ]renci', kl): return "ogrenci_kiz"
    if re.search(r'toplam', kl) and re.search(r'[öo]grenci|[öo][gğ]renci', kl): return "ogrenci_toplam"
    if re.search(r'[öo]grenci|[öo][gğ]renci', kl) and re.search(r'toplam', kl): return "ogrenci_toplam"
    if re.search(r'[öo]grenci|[öo][gğ]renci', kl):
        if 'erkek' in kl: return "ogrenci_erkek"
        if 'kız' in kl or 'kiz' in kl: return "ogrenci_kiz"
        return "ogrenci_toplam"
    if re.search(r'[öo][gğ]retmen', kl): return "ogretmen_sayisi"
    if re.search(r'[şs]ube', kl): return "sube_sayisi"
    if re.search(r'kurum.*kod|okul.*kod', kl): return "kurum_kodu"
    if re.search(r'telefon|tel\.', kl): return "telefon"
    if re.search(r'e.?posta|e.?mail', kl): return "email"

    return k  # bilmiyorsak olduğu gibi bırak

def process_genel(genel_dict):
    # il geneli özet tablosunu işle
    results = []
    for sheet_name, rows in genel_dict.items():
        if not rows: continue

        if isinstance(rows[0], dict):
            keys = list(rows[0].keys())
            rows = [[r.get(k,"") for k in keys] for r in rows]
            rows.insert(0, keys)

        # ilk 25 satırda başlık satırını ara
        header = None
        data_start = 0
        for i, row in enumerate(rows[:25]):
            raw_text = " ".join([str(c) for c in row])
            clean_text = clean_col(raw_text).upper()
            n_filled = len([c for c in row if str(c).strip()])
            has_stat = any(w in clean_text for w in ["DERSLİK","DERSLIK","ÖĞRENCİ","OGRENCI","ÖĞRETMEN","OGRETMEN"])
            if n_filled >= 3 and has_stat:
                header = [norm(c) for c in row]
                data_start = i + 1
                break

        if not header:
            continue

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

LABELS = {"okuloncesi":"Okul Öncesi","ilkokul":"İlkokul","ortaokul":"Ortaokul","lise":"Lise"}

def process_detail(sheets_dict, school_type_key):
    # okul bazlı detay tablosunu işle
    label = LABELS.get(school_type_key, school_type_key)
    results = []
    for sheet_name, rows in sheets_dict.items():
        if not rows: continue

        if isinstance(rows[0], dict):
            for item in rows:
                entry = {"okul_turu": item.get("type", label)}
                for k, v in item.items():
                    if k in ("type","sheet"): continue
                    entry[norm(k)] = to_num(v)
                results.append(entry)
            continue

        header = None
        data_start = 0
        for i, row in enumerate(rows[:25]):
            raw_text = " ".join([str(c) for c in row])
            clean_text = clean_col(raw_text).upper()
            n_filled = len([c for c in row if str(c).strip()])
            has_key = any(w in clean_text for w in ["OKUL","İLÇE","ILCE","ILÇE","DERSLİK","DERSLIK","ÖĞRENCİ","OGRENCI"])
            if n_filled >= 2 and has_key:
                header = [norm(c) for c in row]
                data_start = i + 1
                break

        # başlık bulunamazsa ilk satırı kullan
        if not header:
            if len(rows) > 1:
                header = [norm(c) for c in rows[0]]
                data_start = 1
            else:
                continue

        for row in rows[data_start:]:
            cleaned = [str(c).strip() if c is not None else "" for c in row]
            if not any(c for c in cleaned): continue
            entry = {"okul_turu": label}
            for j, col in enumerate(header):
                if j < len(cleaned) and col:
                    entry[col] = to_num(cleaned[j])
            results.append(entry)
    return results

# her yıl için tüm kategoriyi işle, tek JSON'a topla
final = {}
for year in raw:
    print(f"Processing {year}...")
    yr = raw[year]

    genel      = process_genel(yr.get("genel", {}))
    okuloncesi = process_detail(yr.get("okuloncesi", {}), "okuloncesi")
    ilkokul    = process_detail(yr.get("ilkokul",    {}), "ilkokul")
    ortaokul   = process_detail(yr.get("ortaokul",   {}), "ortaokul")
    lise       = process_detail(yr.get("lise",       {}), "lise")

    final[year] = {
        "genel": genel,
        "okuloncesi": okuloncesi,
        "ilkokul": ilkokul,
        "ortaokul": ortaokul,
        "lise": lise,
    }

    # kontrol çıktısı — öğrenci sayısı doğru geliyor mu?
    print(f"  genel:{len(genel)}")
    for st, items in [("okuloncesi",okuloncesi),("ilkokul",ilkokul),("ortaokul",ortaokul),("lise",lise)]:
        has_ogrenci   = sum(1 for i in items if i.get("ogrenci_toplam",0) > 0)
        total_ogrenci = sum(i.get("ogrenci_toplam",0) for i in items)
        print(f"  {st}: {len(items)} rows, has_ogrenci={has_ogrenci}, total={total_ogrenci}")
        if items:
            print(f"    keys: {list(items[0].keys())[:12]}")
            print(f"    sample: {dict(list(items[0].items())[:8])}")

# tarayıcı direkt okusun diye const olarak JS'e yaz
js = "const MEB_DATA = " + json.dumps(final, ensure_ascii=False, indent=2) + ";\n"
with open(out_js, "w", encoding="utf-8") as f:
    f.write(js)
print(f"\nDone! {len(js)//1024} KB")
