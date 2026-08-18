"""
Parse all XLS/XLSX files directly from raw files.
ilkokul, ortaokul, lise XLS files have merged header cells with:
  Col 0: İlçe
  Col 1: Okul Adı (or Bağımsız Anasınıfı İlkokul...)
  Col 2: Derslik sayısı
  Col 3: Erkek Öğrenci
  Col 4: Kız Öğrenci
  Col 5: Toplam Öğrenci
  Col 6: Öğretmen sayısı
  ... possibly more
"""
import xlrd, openpyxl, json, os, re, glob
print(f"RUNNING SCRIPT FROM: {os.path.abspath(__file__)}")

data_dir = r"C:\Users\alpte_gwx6ike\OneDrive\Masaüstü\MEB PROMPTER\data"
out_js   = r"C:\Users\alpte_gwx6ike\OneDrive\Masaüstü\MEB PROMPTER\meb_data_REAL_FINAL.js"

def to_num(v):
    if v in (None, "", "None", "nan"): return 0
    try:
        s = str(v).replace(",",".")
        f = float(s)
        if f != f: return 0
        return int(f) if f == int(f) else round(f, 1)
    except:
        return 0

def read_sheets_xls(path):
    """Read all rows from all sheets of XLS. Returns list of sheets (which are lists of rows)"""
    wb = xlrd.open_workbook(path)
    sheets = []
    for sheet_name in wb.sheet_names():
        ws = wb.sheet_by_name(sheet_name)
        rows = []
        for i in range(ws.nrows):
            rows.append(ws.row_values(i))
        sheets.append(rows)
    return sheets

def read_sheets_xlsx(path):
    """Read all rows from all sheets of XLSX"""
    wb = openpyxl.load_workbook(path, data_only=True)
    sheets = []
    for sheet_name in wb.sheetnames:
        ws = wb[sheet_name]
        rows = []
        for row in ws.iter_rows(values_only=True):
            rows.append(list(row))
        sheets.append(rows)
    return sheets

def is_ilce_row(v):
    """Check if a cell value looks like an ilçe name"""
    if not isinstance(v, str): return False
    v = v.strip().upper()
    ilceler = ["BOZDOĞAN","BUHARKENT","ÇİNE","DİDİM","EFELER","GERMENCİK",
               "İNCİRLİOVA","KARACASU","KARPUZLU","KOÇARLI","KÖŞK",
               "KUŞADASI","KUYUCAK","NAZİLLİ","SÖKE","SULTANHİSAR","YENİPAZAR"]
    return any(v == ilce or v.startswith(ilce[:5]) for ilce in ilceler)

def smart_parse_detail(rows, school_type):
    """
    Parse generic school detail rows using heuristic header detection.
    Used mainly for Okul Öncesi.
    """
    header = None
    data_start = 0
    for i, row in enumerate(rows[:20]):
        text = " ".join([str(c).upper() for c in row if c])
        if ("DERSLİK" in text or "DERSLIK" in text) and ("ÖĞRENCİ" in text or "OGRENCI" in text):
            header = []
            for c in row:
                cs = str(c).strip() if c else ""
                # Robust lowercase comparison for Turkish
                cl = cs.replace("İ","i").replace("I","i").lower().replace("i̇","i").replace("ı","i")
                if "ilçe" in cl or "ilce" in cl: header.append("ilce")
                elif "kurum" in cl and "kod" in cl: header.append("kurum_kodu")
                elif "okul" in cl and ("ad" in cl or "isim" in cl): header.append("okul_adi")
                elif "derslik" in cl: header.append("derslik_sayisi")
                elif "erkek" in cl and "öğretmen" not in cl and "ogretmen" not in cl: header.append("ogrenci_erkek")
                elif ("kız" in cl or "kiz" in cl) and "öğretmen" not in cl and "ogretmen" not in cl: header.append("ogrenci_kiz")
                elif "toplam" in cl and ("öğrenci" in cl or "ogrenci" in cl): header.append("ogrenci_toplam")
                elif "öğrenci" in cl or "ogrenci" in cl: header.append("ogrenci_toplam")
                elif "öğretmen" in cl or "ogretmen" in cl: header.append("ogretmen_sayisi")
                elif "şube" in cl or "sube" in cl: header.append("sube_sayisi")
                elif "tel" in cl: header.append("telefon")
                elif "adres" in cl and "e-" not in cl and "eposta" not in cl: header.append("adres")
                elif "web" in cl: header.append("web")
                elif "faks" in cl or "fax" in cl: header.append("faks")
                elif "resmi" in cl or "özel" in cl or "ozel" in cl: header.append("resmi_ozel")
                elif "yerleşim" in cl or "yerlesim" in cl: header.append("yerlesim_yeri")
                else: header.append(cs[:30] if cs else "")
            data_start = i + 1
            break
    
    if not header:
        header = ["ilce","kurum_kodu","okul_adi","derslik_sayisi","ogrenci_erkek","ogrenci_kiz","ogrenci_toplam","ogretmen_sayisi","sube_sayisi","telefon","email"]
        for i, row in enumerate(rows):
            if is_ilce_row(row[0] if row else ""):
                data_start = i
                break
    
    results = []
    current_ilce = ""
    for row in rows[data_start:]:
        if not any(c for c in row if c not in (None, "", 0, 0.0)):
            continue
        col0 = str(row[0]).strip() if row[0] else ""
        if is_ilce_row(col0):
            current_ilce = col0.upper()
        
        entry = {"okul_turu": school_type, "ilce": current_ilce}
        for j, col in enumerate(header):
            if j < len(row) and col:
                val = row[j]
                if col == "ilce":
                    if val and str(val).strip(): entry["ilce"] = str(val).strip().upper()
                elif col in ("okul_adi","mudur","telefon","email","kurum_tipi","resmi_ozel","yerlesim_yeri"):
                    sval = str(val).strip() if val else ""
                    if col == "okul_adi" and "@" in sval:
                        # Skip this as name, maybe it was identified wrong
                        entry[col] = ""
                    else:
                        entry[col] = sval
                elif col == "kurum_kodu":
                    if isinstance(val, (int, float)):
                        entry[col] = str(int(val))
                    else:
                        entry[col] = str(val).strip() if val else ""
                else:
                    entry[col] = to_num(val)
        
        has_data = any(isinstance(entry.get(k,0), (int,float)) and entry.get(k,0) > 0 
                       for k in ("derslik_sayisi","ogrenci_toplam","ogretmen_sayisi","sube_sayisi"))
        has_okul = entry.get("okul_adi","") not in ("","0")
        if has_data or has_okul:
            results.append(entry)
    
    return results

def hardcoded_parse_detail(rows, school_type):
    """
    Parse detail rows bypassing the header search, using dynamic offset from the first numeric column.
    """
    results = []
    current_ilce = ""
    for row in rows:
        if not row: continue
        col0 = str(row[0]).strip() if row[0] else ""
        
        is_val = is_ilce_row(col0)
        if is_val:
            current_ilce = col0.upper()
            
        # Kurum kodu is usually at Col 1
        kurum_kodu_val = ""
        if len(row) > 1:
            kval = row[1]
            if isinstance(kval, (int, float)): kurum_kodu_val = str(int(kval))
            elif kval: kurum_kodu_val = str(kval).strip()

        # Okul adi is always at Col 2
        okul_adi_idx = 2
        if len(row) <= okul_adi_idx: continue
        okul_adi_val = str(row[okul_adi_idx]).strip() if row[okul_adi_idx] else ""
        
        # Guard: If name is an email, it's wrong. 
        if "@" in okul_adi_val:
            # Try Col 3? Sometimes names/emails swapped
            if len(row) > 3 and row[3] and "@" not in str(row[3]):
                okul_adi_val = str(row[3]).strip()
            else:
                okul_adi_val = "" # Skip or will be handled by has_okul check
        
        if not okul_adi_val or "OKUL ADI" in okul_adi_val.upper() or "TOPLAM" == okul_adi_val.upper():
            continue
            
        # Find first numeric column after okul_adi
        first_num_idx = -1
        for i in range(okul_adi_idx + 1, min(len(row), okul_adi_idx + 5)):
            val = row[i]
            if isinstance(val, (int, float)) or (isinstance(val, str) and val.replace(".","",1).isdigit()):
                first_num_idx = i
                break
                
        # If no numeric column is found, we fall back to a default offset (e.g., 3) so we don't drop the school entirely
        if first_num_idx == -1:
            first_num_idx = okul_adi_idx + 1
            
        if len(row) <= first_num_idx:
            # We pad the row if it's too short so we don't index out of bounds later
            row = list(row) + [0]*10
        
        entry = {
            "okul_turu": school_type, 
            "ilce": current_ilce,
            "kurum_kodu": kurum_kodu_val,
            "okul_adi": okul_adi_val,
            "derslik_sayisi": to_num(row[first_num_idx]),
            "sube_sayisi": to_num(row[first_num_idx + 1]),
            "ogretmen_sayisi": to_num(row[first_num_idx + 2]),
            "ogretmen_erkek": to_num(row[first_num_idx + 3]),
            "ogretmen_kadin": to_num(row[first_num_idx + 4]),
            "ogrenci_toplam": to_num(row[first_num_idx + 5]),
            "ogrenci_erkek": to_num(row[first_num_idx + 6]),
            "ogrenci_kiz": to_num(row[first_num_idx + 7])
        }
        
        # Dynamic offsets for detailed info
        grades_start = first_num_idx + 11
        grades = ["1. Sınıf", "2. Sınıf", "3. Sınıf", "4. Sınıf", "5. Sınıf", "6. Sınıf", "7. Sınıf", "8. Sınıf"]
        tel_idx = first_num_idx + 44
        ogretim_sekli_idx = first_num_idx + 27 # Col 30
        entry["kurum_tipi"] = str(row[first_num_idx + 8]).strip() if len(row) > first_num_idx + 8 else ""
        entry["resmi_ozel"] = str(row[first_num_idx + 9]).strip() if len(row) > first_num_idx + 9 else ""
        entry["yerlesim_yeri"] = str(row[first_num_idx + 10]).strip() if len(row) > first_num_idx + 10 else ""
        
        if school_type == "Lise":
            grades_start = first_num_idx + 12
            grades = ["9. Sınıf (Lise 1)", "10. Sınıf (Lise 2)", "11. Sınıf (Lise 3)", "12. Sınıf (Lise 4)"]
            tel_idx = first_num_idx + 28
            ogretim_sekli_idx = first_num_idx + 9 # Col 12
            entry["yerlesim_yeri"] = str(row[first_num_idx + 11]).strip() if len(row) > first_num_idx + 11 else ""
        
        entry["ogretim_sekli"] = str(row[ogretim_sekli_idx]).strip() if len(row) > ogretim_sekli_idx else ""
        entry["telefon"] = str(row[tel_idx]).strip() if len(row) > tel_idx else ""
        entry["faks"] = str(row[tel_idx + 1]).strip() if len(row) > tel_idx + 1 else ""
        entry["adres"] = str(row[tel_idx + 2]).strip() if len(row) > tel_idx + 2 else ""
        entry["web"] = str(row[tel_idx + 3]).strip() if len(row) > tel_idx + 3 else ""
        entry["email"] = str(row[tel_idx + 4]).strip() if len(row) > tel_idx + 4 else ""

        # Extract Class Distribution
        sinif_detay = {}
        for g_idx, grade_name in enumerate(grades):
            base = grades_start + (g_idx * 4)
            if len(row) > base + 3:
                sube = to_num(row[base])
                toplam = to_num(row[base + 1])
                erkek = to_num(row[base + 2])
                kiz = to_num(row[base + 3])
                if toplam > 0 or sube > 0:
                    sinif_detay[grade_name] = {"sube": sube, "toplam": toplam, "erkek": erkek, "kiz": kiz}
        
        if sinif_detay:
            entry["sinif_detay"] = sinif_detay
        
        if entry["ilce"]: 
            results.append(entry)
            
    return results

def parse_heating_data(path):
    """
    Parse the HTML-based XOR file containing heating status.
    Returns a dict: {kurum_kodu: {"isinma": str, "yakit": str}}
    """
    if not os.path.exists(path):
        print(f"  Warning: Heating file not found at {path}")
        return {}
    
    try:
        # Open in binary mode to avoid truncation at Ctrl+Z (0x1A)
        with open(path, "rb") as f:
            content = f.read().decode("cp1254", errors="ignore")
    except Exception as e:
        print(f"  Error reading heating file: {e}")
        return {}

    # Flattened search for all <td> cells since <tr> tags are unreliable
    all_tds = re.findall(r"<td.*?>(.*?)</td>", content, re.DOTALL | re.IGNORECASE)
    def clean(text):
        t = re.sub(r"<.*?>", "", text, flags=re.DOTALL).strip()
        t = t.replace("&nbsp;", " ").replace("&amp;", "&").replace("\r", "").replace("\n", "")
        return t
    
    all_tds = [clean(td) for td in all_tds]
    
    # Explicitly find columns for Code, Isinma, Yakit
    col_code = -1
    col_isinma = -1
    col_yakit = -1
    col_bina = -1 # Building Name (Index 7 typically)
    
    for idx in range(min(150, len(all_tds))):
        val = all_tds[idx].upper()
        if "KURUM_KODU" in val or "KURUM KODU" in val: col_code = idx
        if "ISINMA_DURUMU" in val or "ISINMA DURUMU" in val or "ISİNMA" in val: col_isinma = idx
        if "YAKIT" in val: col_yakit = idx
        if "BINA_ADI" in val or "BİNA ADI" in val: col_bina = idx
    
    if col_code == -1: 
        col_code, col_isinma, col_yakit = 4, 8, 9 # Hard fallback to CP1254 discovery
        print("    Warning: Headers not found, using hardcoded offsets 4, 8, 9")
    else:
        print(f"    Detected columns: Code={col_code}, Isinma={col_isinma}, Yakit={col_yakit}, Bina={col_bina}")

    offset_isinma = col_isinma - col_code
    offset_yakit = col_yakit - col_code
    offset_bina = (col_bina - col_code) if col_bina != -1 else -1
    
    heating_map = {}
    for i, td in enumerate(all_tds):
        if re.fullmatch(r"\d{6}", td):
            code = td
            isinma = all_tds[i + offset_isinma] if 0 <= (i + offset_isinma) < len(all_tds) else ""
            yakit = all_tds[i + offset_yakit] if 0 <= (i + offset_yakit) < len(all_tds) else ""
            bina = all_tds[i + offset_bina] if offset_bina != -1 and 0 <= (i + offset_bina) < len(all_tds) else ""
            
            if not isinma or isinma.lower() in ["yok", "0", "None"]: continue

            # Prioritization logic:
            # 1. Main buildings (Hizmet Binası, Müdürlük, Ana Bina) get high score
            # 2. Status with 'Kalorifer' or 'Doğalgaz' get bonus
            prio = 0
            if any(x in bina.lower() for x in ["hizmet", "müdürlük", "ana bina", "eğitim"]): prio += 10
            if any(x in isinma.lower() for x in ["kalorifer", "merkezi", "doğalgaz"]): prio += 5
            
            if code not in heating_map or prio > heating_map[code]["prio"]:
                heating_map[code] = {"isinma": isinma, "yakit": yakit, "prio": prio, "bina": bina}
    
    result_map = {}
    for k, v in heating_map.items():
        # Include building name in results if it's not the main building to avoid confusion
        final_isinma = v["isinma"]
        if v["bina"] and not any(x in v["bina"].lower() for x in ["hizmet", "müdürlük"]):
            final_isinma += f" ({v['bina']})"
        result_map[k] = {"isinma": final_isinma, "yakit": v["yakit"]}

    print(f"  --> Heating parsing result: found {len(result_map)} schools")
    return result_map

def parse_genel_tablo(rows):
    """Parse the summary tablo XLSX"""
    # Find header
    header = None
    data_start = 0
    for i, row in enumerate(rows[:25]):
        text = " ".join([str(c) for c in row if c])
        text_up = text.upper()
        n_filled = len([c for c in row if c not in (None, "")])
        if n_filled >= 3 and any(w in text_up for w in ["DERSLİK","ÖĞRENCİ","ÖĞRETMEN","OKUL"]):
            header = []
            for c in row:
                cs = str(c).strip() if c else ""
                cl = cs.lower()
                if "okul türü" in cl or "okul turu" in cl: header.append("okul_turu")
                elif "okul sayı" in cl: header.append("okul_sayisi")
                elif "derslik" in cl: header.append("derslik_sayisi")
                elif "erkek" in cl: header.append("ogrenci_erkek")
                elif "kız" in cl or "kiz" in cl: header.append("ogrenci_kiz")
                elif "toplam" in cl and ("öğrenci" in cl or "ogrenci" in cl): header.append("ogrenci_toplam")
                elif "öğrenci" in cl or "ogrenci" in cl: header.append("ogrenci_toplam")
                elif "öğretmen" in cl or "ogretmen" in cl: header.append("ogretmen_sayisi")
                elif "şube" in cl or "sube" in cl: header.append("sube_sayisi")
                else: header.append(cs[:30])
            data_start = i + 1
            break
    if not header: return []
    results = []
    for row in rows[data_start:]:
        if not any(c for c in row if c not in (None, "")): continue
        entry = {}
        for j, col in enumerate(header):
            if j < len(row) and col:
                if col == "okul_turu":
                    entry[col] = str(row[j]).strip() if row[j] else ""
                else:
                    entry[col] = to_num(row[j])
        if any(isinstance(v,(int,float)) and v > 0 for k,v in entry.items() if k != "okul_turu"):
            results.append(entry)
    return results

# ============ Main Processing ============
FILES = {
    "2021-2022": {
        "genel_xlsx": "2021-2022_TABLO.xlsx",
        "okuloncesi_xlsx": "okuloncesi_2122.xlsx",
        "ilkokul_xls": "ilkokul_2122.xls",
        "ortaokul_xls": "ortaokul_2122.xls",
        "lise_xls": "lise_2122.xls",
    },
    "2020-2021": {
        "genel_xlsx": "2020-2021_TABLO.xlsx",
        "okuloncesi_xlsx": "okuloncesi_2021.xlsx",
        "ilkokul_xls": "ilkokul_2021.xls",
        "ortaokul_xls": "ortaokul_2021.xls",
        "lise_xls": "lise_2021.xls",
    }
}

LABELS = {"okuloncesi":"Okul Öncesi","ilkokul":"İlkokul","ortaokul":"Ortaokul","lise":"Lise"}

final = {}
# Try to find the heating file flexibly due to Turkish characters in filename
heating_data = {}
all_xls = glob.glob(os.path.join(data_dir, "*2021*.xls"))
heating_path = None
for f in all_xls:
    base = os.path.basename(f).upper()
    # Flexible check for Turkish ISINMA (dotless I) and ISİNMA (dotted İ)
    if "ISINMA" in base or "ISİNMA" in base or "ISİMNA" in base:
        # Also check file size to avoid choosing wrong small files
        if os.path.getsize(f) > 100000: # Usually > 100KB
            heating_path = f
            break

if heating_path:
    print(f"  --> Using heating file: {heating_path}")
    heating_data = parse_heating_data(heating_path)
else:
    print("  Warning: Heating file (*2021*.xls containing ISINMA) not found!")

for year, files in FILES.items():
    print(f"\n====== {year} ======")
    yr_data = {}

    # Parse genel
    gp = os.path.join(data_dir, files["genel_xlsx"])
    if os.path.exists(gp):
        sheets = read_sheets_xlsx(gp)
        if sheets:
            yr_data["genel"] = parse_genel_tablo(sheets[0])
            print(f"  genel: {len(yr_data['genel'])} entries")
        else:
            yr_data["genel"] = []
    else:
        yr_data["genel"] = []

    # Parse detail files
    for st in ["okuloncesi","ilkokul","ortaokul","lise"]:
        xlsx_key = f"{st}_xlsx"
        xls_key = f"{st}_xls"
        path = None
        sheets = []
        if xlsx_key in files:
            p = os.path.join(data_dir, files[xlsx_key])
            if os.path.exists(p):
                path = p
                sheets = read_sheets_xlsx(p)
            
        if path is None and xls_key in files:
            p = os.path.join(data_dir, files[xls_key])
            if os.path.exists(p):
                path = p
                sheets = read_sheets_xls(p)
        
        if path is None or not sheets:
            yr_data[st] = []
            continue
        
        items = []
        for rows in sheets:
            if not rows: continue
            if st == "okuloncesi":
                items.extend(smart_parse_detail(rows, LABELS[st]))
            else:
                items.extend(hardcoded_parse_detail(rows, LABELS[st]))
        
        yr_data[st] = items
        
        # Merge heating data
        merge_count = 0
        for item in items:
            raw_code = str(item.get("kurum_kodu", "")).strip()
            if not raw_code: continue
            
            # Normalize: strip .0 if exists
            code = raw_code[:-2] if raw_code.endswith(".0") else raw_code
            
            if code in heating_data:
                item["isinma_durumu"] = heating_data[code]["isinma"]
                item["yakit_turu"] = heating_data[code]["yakit"]
                merge_count += 1
        
        # Stats
        print(f"  {st}: {len(items)} rows, merges={merge_count}")
        cnt_ilce = len([i for i in items if i.get("ilce","") not in ("","0")])
        cnt_ogr = len([i for i in items if i.get("ogrenci_toplam",0) > 0])
        total_ogr = sum(i.get("ogrenci_toplam",0) for i in items)
        print(f"  {st}: {len(items)} rows, with_ilce={cnt_ilce}, with_ogrenci={cnt_ogr}, total_ogrenci={total_ogr}")
        if items:
            print(f"    sample: {dict(list(items[0].items())[:8])}")

    final[year] = yr_data

# Write JS
js = "const MEB_DATA = " + json.dumps(final, ensure_ascii=False, indent=2) + ";\n"
with open(out_js, "w", encoding="utf-8") as f:
    f.write(js)
print(f"\nDone! {len(js)//1024} KB -> meb_data.js")
