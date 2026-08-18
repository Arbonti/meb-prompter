/**
 * MEB Aydın — Okul Bazlı Akıllı Sorgulama Modülü
 * Video'da gösterilen TÜM kriterleri destekleyen doğal dil + filtre sistemi.
 *
 * Desteklenen kriterler:
 *   - Kurum: ilçe, okul türü, öğretim şekli, ısınma, risk analizi, bağımsız bina, taşıt
 *   - Fiziksel: derslik, şube, atölye, kütüphane, kitap sayısı, konferans salonu,
 *               oyun bahçesi, spor alanı m², özel eğitim sınıfı
 *   - Erişilebilirlik: engelli rampası, tuvaleti, asansörü
 *   - Taşımalı: aktif mi, erkek/kız/toplam sayı, neden, yemek hizmeti
 *   - Devamsızlık: toplam ve sınıf bazlı 10+ gün
 *   - Disiplin: toplam ve sınıf bazlı
 *   - Kitap okuma: kitap_sayisi_min/max, sayfa_sayisi_min/max
 *   - Lisanslı sporcu: branş, min toplam sayı
 *   - Yabancı uyruklu: varlığı, ülke, min sayı
 *   - Sosyal etkinlik: proje sayısı, ödül, uluslararası proje
 *   - LGS: mezun sayısı, sınavlı/sınavsız yerleşme
 */

// ─────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────
const SQ_ILCELER = ['EFELER','NAZİLLİ','SÖKE','KUŞADASI','DİDİM','ÇİNE',
  'GERMENCİK','BOZDOĞAN','İNCİRLİOVA','KOÇARLI','KÖŞK','KUYUCAK',
  'SULTANHİSAR','YENİPAZAR','KARACASU','BUHARKENT','KARPUZLU'];

const SQ_SPOR_BRANCLAR = [
  'Basketbol','Futbol','Voleybol','Satranç','Yüzme','Atletizm',
  'Tenis','Badminton','Masa Tenisi','Güreş','Judo','Karate',
  'Taekwondo','Okçuluk','Bisiklet','Jimnastik','Hentbol','Kürek'
];

// ─────────────────────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────────────────────
let sqCurrentFilters = {};
let sqResults = [];
let sqCurrentPage = 1;
const SQ_PAGE_SIZE = 20;

// ─────────────────────────────────────────────────────────────────────
// AI PARSE — Gemini'ye metin gönder, filtre JSON al
// ─────────────────────────────────────────────────────────────────────
async function sqParseWithAI(queryText) {
  const schemaHint = `
Kullanıcının doğal dil sorgusunu analiz et ve aşağıdaki JSON filtre nesnesini oluştur.
Sadece kullanıcının belirttiği kriterleri ekle, gerisi boş bırak.

--- ÖNEMLİ: SIRALAMA VE LİMİT ---
"en fazla", "en çok", "en yüksek", "en büyük" ifadeleri → sira_yon: "azalan"
"en az", "en düşük", "en küçük" ifadeleri → sira_yon: "artan"
Sıralanacak alan → sira_kriteri alanına yaz.
Kaç okul isteniyor → limit alanına yaz (belirtilmemişse 10).

Örnek: "en fazla öğrencisi olan 5 okul" → {"sira_kriteri":"ogrenci","sira_yon":"azalan","limit":5}
Örnek: "en az öğretmeni olan 3 okul" → {"sira_kriteri":"ogretmen","sira_yon":"artan","limit":3}
Örnek: "yenipazerda öğrenci sayısı en fazla 30 olan" → {"ilce":"YENİPAZAR","ogrenci_max":30}

Sıralama kriterleri:
- "ogrenci" → öğrenci sayısı
- "ogretmen" → öğretmen sayısı
- "devamsizlik" → devamsızlık
- "kitap" → kitap sayısı
- "sayfa" → sayfa sayısı
- "sporcu" → lisanslı sporcu
- "yabanci" → yabancı uyruklu
- "proje" → proje sayısı
- "derslik" → derslik sayısı
- "tasimali" → taşımalı öğrenci
- "dyk" → DYK kurs sayısı
- "tbm_ogrenci" → TBM öğrenci
- "tbm_ogretmen" → TBM öğretmen
- "veli_faaliyet" → veli faaliyet
- "lgs_mezun" → LGS mezun

Filtre şeması:
{
  "sira_kriteri": string (yukarıdaki anahtar kelimelerden biri),
  "sira_yon": "azalan" | "artan",
  "limit": number,
  "ilce": "EFELER" | "NAZİLLİ" | "SÖKE" | ... (büyük harf),
  "okul_turu": "okuloncesi" | "ilkokul" | "ortaokul" | "lise",
  "ogretim_sekli": "Normal" | "İkili" | "Tam Gün" | "Yarım Gün",
  "ogretmen_min": number,
  "ogretmen_max": number,
  "isinma_turu": "Doğalgaz" | "Kömür" | "Fuel-Oil" | "Klima" | "Jeotermal",
  "bagimsiz_bina": true | false,
  "risk_analizi_yapildi": true | false,
  "okul_tasiti": true | false,
  "engelli_rampasi": true | false,
  "engelli_tuvaleti": true | false,
  "engelli_asansoru": true | false,
  "oyun_bahcesi": true | false,
  "kantin_var": true | false,
  "kantin_geliri_min": number,
  "dyk_kursu_var": true | false,
  "kutuphane_var": true | false,
  "konferans_salonu_var": true | false,
  "toplanti_salonu_var": true | false,
  "derslik_min": number,
  "derslik_max": number,
  "kutuphane_kitap_min": number,
  "bahce_spor_alan_min": number,
  "sube_min": number,
  "sube_max": number,
  "atolye_min": number,
  "ozel_egitim_sinif_min": number,
  "konum_turu": "Merkez Mahalle" | "Köy" | "Belde" | "İlçe Merkezi" | "Sanayi Bölgesi",
  "ilce_merkezi_uzaklik_max": number,
  "okul_adi": string,
  "ogrenci_min": number,
  "ogrenci_max": number,
  "tasimali_aktif": true | false,
  "tasimali_min": number,
  "yemek_hizmeti": true | false,
  "devamsizlik_min": number,
  "devamsizlik_max": number,
  "devamsizlik_sinif": number,
  "disiplin_min": number,
  "kitap_sayisi_min": number,
  "kitap_sayisi_max": number,
  "sayfa_sayisi_min": number,
  "sayfa_sayisi_max": number,
  "lisansli_sporcu_var": true | false,
  "lisansli_sporcu_brans": string,
  "lisansli_sporcu_min": number,
  "yabanci_uyruklu_var": true | false,
  "yabanci_uyruklu_ulke": string,
  "yabanci_uyruklu_min": number,
  "proje_min": number,
  "odul_var": true | false,
  "uluslararasi_proje_var": true | false,
  "lgs_mezun_min": number,
  "lgs_sinavli_var": true | false,
  "lgs_sinavsiz_var": true | false,
  "dyk_kurs_min": number,
  "yaz_okulu_var": true | false,
  "yaz_okulu_kurs_min": number,
  "veli_faaliyet_min": number,
  "tbm_ogrenci_min": number,
  "tbm_ogretmen_min": number,
  "kardes_okul_var": true | false
}

Kullanıcı sorgusu: "${queryText}"

SADECE JSON döndür, başka hiçbir şey yazma.`;

  try {
    // Rotasyonlu key sistemi kullan (ai_module.js'deki getGeminiURL ile aynı mantık)
    const url = (typeof getGeminiURL === 'function')
      ? getGeminiURL()
      : `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEYS[0]}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: schemaHint }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 500 }
      })
    });
    if (!resp.ok) throw new Error('AI hatası');
    const data = await resp.json();
    let raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    // JSON bloğunu temizle
    raw = raw.replace(/```json\s*/gi,'').replace(/```\s*/g,'').trim();
    return JSON.parse(raw);
  } catch(e) {
    console.warn('[SQ] AI parse failed:', e);
    return sqManualParse(queryText);
  }
}

// ─────────────────────────────────────────────────────────────────────
// MANUEL PARSE — AI olmadan temel anahtar kelime tespiti
// ─────────────────────────────────────────────────────────────────────
function sqManualParse(text) {
  const ql = sqNorm(text);
  const filters = {};

  // ═══════════════════════════════════════════════════════════════════
  // YARDIMCILAR
  // ═══════════════════════════════════════════════════════════════════
  // Alandaki sayısal değeri min ya da max olarak ata
  const FIELD_MAP = {
    ogrenci:      { min:'ogrenci_min',        max:'ogrenci_max' },
    ogretmen:     { min:'ogretmen_min',        max:'ogretmen_max' },
    derslik:      { min:'derslik_min',         max:'derslik_max' },
    sube:         { min:'sube_min',            max:'sube_max' },
    devamsizlik:  { min:'devamsizlik_min',     max:'devamsizlik_max' },
    kitap:        { min:'kitap_sayisi_min',    max:'kitap_sayisi_max' },
    sayfa:        { min:'sayfa_sayisi_min',    max:'sayfa_sayisi_max' },
    sporcu:       { min:'lisansli_sporcu_min', max:null },
    yabanci:      { min:'yabanci_uyruklu_min', max:null },
    proje:        { min:'proje_min',           max:null },
    dyk:          { min:'dyk_kurs_min',        max:null },
    tbm_ogrenci:  { min:'tbm_ogrenci_min',     max:null },
    tbm_ogretmen: { min:'tbm_ogretmen_min',    max:null },
    veli:         { min:'veli_faaliyet_min',   max:null },
    lgs:          { min:'lgs_mezun_min',       max:null },
    spor_alan:    { min:'bahce_spor_alan_min', max:null },
    tasimali:     { min:'tasimali_min',        max:null },
    atolye:       { min:'atolye_min',          max:null },
    ozel_egitim:  { min:'ozel_egitim_sinif_min',max:null },
    kantin_gelir: { min:'kantin_geliri_min',   max:null },
    uzaklik:      { min:null,                  max:'ilce_merkezi_uzaklik_max' }
  };

  function setMinMax(fieldKey, num, isMin) {
    const map = FIELD_MAP[fieldKey];
    if (!map) return;
    const key = isMin ? map.min : map.max;
    if (key) filters[key] = num;
  }

  // Hangi alan? Öncelik sırasıyla
  function detectField() {
    if (ql.includes('tbm') && ql.includes('ogretmen')) return 'tbm_ogretmen';
    if (ql.includes('tbm'))             return 'tbm_ogrenci';
    if (ql.includes('ogrenci'))         return 'ogrenci';
    if (ql.includes('ogretmen'))        return 'ogretmen';
    if (ql.includes('derslik'))         return 'derslik';
    if (ql.includes('sube'))            return 'sube';
    if (ql.includes('devamsizl'))       return 'devamsizlik';
    if (ql.includes('kitap'))           return 'kitap';
    if (ql.includes('sayfa'))           return 'sayfa';
    if (ql.includes('sporcu') || ql.includes('lisansl')) return 'sporcu';
    if (ql.includes('yabanci'))         return 'yabanci';
    if (ql.includes('proje'))           return 'proje';
    if (ql.includes('dyk'))             return 'dyk';
    if (ql.includes('veli'))            return 'veli';
    if (ql.includes('lgs'))             return 'lgs';
    if (ql.includes('spor alan') || ql.includes('bahce')) return 'spor_alan';
    if (ql.includes('tasimal'))         return 'tasimali';
    if (ql.includes('atolye'))          return 'atolye';
    if (ql.includes('ozel egitim'))     return 'ozel_egitim';
    if (ql.includes('kantin gelir'))    return 'kantin_gelir';
    if (ql.includes('uzaklik') || ql.includes('km')) return 'uzaklik';
    return null;
  }

  // ═══════════════════════════════════════════════════════════════════
  // 1. SIRALAMA vs MAX/MIN FİLTRE AYIRT EDİCİ
  // "en fazla 30 öğrenci" → ogrenci_max:30 (filtre)
  // "en az 5 öğretmen"   → ogretmen_min:5  (filtre)
  // "en fazla öğrencisi olan 5 okul" → sıralama azalan, limit 5
  // "en az devamsızlığı olan okul"   → sıralama artan
  // ═══════════════════════════════════════════════════════════════════
  const enFazlaNumM = ql.match(/en\s+(?:fazla|cok|yuksek|buyuk)\s+(\d+)/);
  const enAzNumM    = ql.match(/en\s+(?:az|dusuk|kucuk)\s+(\d+)/);
  const hasEnFazla  = /en\s+(?:fazla|cok|yuksek|buyuk)/.test(ql);
  const hasEnAz     = /en\s+(?:az|dusuk|kucuk)/.test(ql);

  if (enFazlaNumM || enAzNumM) {
    // "en fazla N" veya "en az N" hemen sayı takip ediyor → filtre
    const num   = parseInt((enFazlaNumM || enAzNumM)[1]);
    const isMax = !!enFazlaNumM;
    setMinMax(detectField() || 'ogrenci', num, !isMax);
  } else if (hasEnFazla || hasEnAz) {
    // Sayı takip etmiyor → sıralama
    filters.sira_yon = hasEnFazla ? 'azalan' : 'artan';
    const limM = ql.match(/(?:ilk|top)\s*(\d+)/) || ql.match(/(\d+)\s*(?:okul|tane|adet)/);
    filters.limit = limM ? parseInt(limM[1]) : 10;
    const siraKrit = detectField();
    filters.sira_kriteri = siraKrit || 'ogrenci';
  }

  const inRankingMode = !!filters.sira_kriteri;

  // ═══════════════════════════════════════════════════════════════════
  // 2. KARŞILAŞTIRMA İFADELERİ (sıralama yokken)
  // "500'den fazla", "300'ün üzerinde", "100 ve üzeri" → min
  // "50'den az",    "30'un altında",   "20 ve altı"   → max
  // "100 ile 500 arasında"                            → min+max
  // ═══════════════════════════════════════════════════════════════════
  if (!inRankingMode) {
    const field = detectField();
    if (field) {
      const rangeM = ql.match(/(\d+)\s*ile\s*(\d+)\s*arasinda/);
      if (rangeM) {
        setMinMax(field, parseInt(rangeM[1]), true);
        setMinMax(field, parseInt(rangeM[2]), false);
      } else {
        const minM = ql.match(/(\d+)(?:[''']?[a-z]*)\s*(?:den|dan|ten|tan)?\s*(?:fazla|cok|yukari|uzeri|ustunde|buyuk|uzerinde)/) ||
                    ql.match(/(\d+)\s+ve\s+(?:uzeri|yukari|ustu|fazlasi)/);
        const maxM = ql.match(/(\d+)(?:[''']?[a-z]*)\s*(?:den|dan|ten|tan)?\s*(?:az|asagi|alti|altinda|kucuk|altinda)/) ||
                    ql.match(/(\d+)\s+ve\s+(?:alti|asagi)/);
        if (minM) setMinMax(field, parseInt(minM[1]), true);
        if (maxM) setMinMax(field, parseInt(maxM[1]), false);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // 3. İLÇE
  // ═══════════════════════════════════════════════════════════════════
  filters.ilce = [];
  for (const ilce of SQ_ILCELER) {
    if (ql.includes(sqNorm(ilce))) { filters.ilce.push(ilce); }
  }
  if (filters.ilce.length === 0) {
    if (ql.includes('merkez') || ql.includes('efeler')) filters.ilce.push('EFELER');
    else delete filters.ilce;
  } else if (filters.ilce.length === 1) {
    filters.ilce = filters.ilce[0];
  }

  // ═══════════════════════════════════════════════════════════════════
  // 4. OKUL TÜRÜ
  // ═══════════════════════════════════════════════════════════════════
  if (ql.match(/okuloncesi|okul\s*oncesi|anaokul|anasini|kres/)) filters.okul_turu = 'okuloncesi';
  else if (ql.match(/ilkokul|ilk\s*okul/))                       filters.okul_turu = 'ilkokul';
  else if (ql.match(/ortaokul|orta\s*okul/))                     filters.okul_turu = 'ortaokul';
  else if (ql.includes('lise'))                                   filters.okul_turu = 'lise';

  // ═══════════════════════════════════════════════════════════════════
  // 5. ÖĞRETİM ŞEKLİ
  // ═══════════════════════════════════════════════════════════════════
  if (ql.match(/ikili\s*ogretim|cift\s*ogretim|ikili/))          filters.ogretim_sekli = 'İkili';
  else if (ql.match(/tam\s*gun/))                                 filters.ogretim_sekli = 'Tam Gün';
  else if (ql.match(/yarim\s*gun/))                               filters.ogretim_sekli = 'Yarım Gün';
  else if (ql.match(/normal\s*ogretim/))                          filters.ogretim_sekli = 'Normal';

  // ═══════════════════════════════════════════════════════════════════
  // 6. ISINMA TÜRÜ
  // ═══════════════════════════════════════════════════════════════════
  if (ql.match(/dogalgaz|gaz/))           filters.isinma_turu = 'Doğalgaz';
  else if (ql.match(/komur|kok/))         filters.isinma_turu = 'Kömür';
  else if (ql.match(/fuel.?oil|mazot/))   filters.isinma_turu = 'Fuel-Oil';
  else if (ql.match(/klima|elektrik/))    filters.isinma_turu = 'Klima';
  else if (ql.match(/jeotermal|termal/))  filters.isinma_turu = 'Jeotermal';

  // ═══════════════════════════════════════════════════════════════════
  // 7. SAYISAL FİLTRELER (sayı + alan adı)
  // ═══════════════════════════════════════════════════════════════════
  if (!inRankingMode) {
    const isMaxGenel = ql.match(/en\s+fazla|maksimum|max|azami|en\s+cok/);
    
    // Öğretmen
    if (!filters.ogretmen_min && !filters.ogretmen_max) {
      const m = ql.match(/(\d+)\s*ogretmen/) || ql.match(/ogretmen(?:i|ler|s[ia]\s*sayisi|si)?\s*(?:maksimum|minimum|max|min|en\s+fazla|en\s+az|en\s+cok)?\s*(\d+)/) || ql.match(/ogretmen\s*sayisi\s*(?:maksimum|minimum|max|min|en\s+fazla|en\s+az|en\s+cok)?\s*(\d+)/);
      if (m) { 
        const isMax = isMaxGenel || /maksimum|max|en\s+fazla|en\s+cok/.test(m[0]);
        isMax ? (filters.ogretmen_max = parseInt(m[1])) : (filters.ogretmen_min = parseInt(m[1])); 
      }
    }
    // Öğrenci
    if (!filters.ogrenci_min && !filters.ogrenci_max) {
      const m = ql.match(/(\d+)\s*ogrenci/) || ql.match(/ogrenci(?:si|ler|s[ia]\s*sayisi|si)?\s*(?:maksimum|minimum|max|min|en\s+fazla|en\s+az|en\s+cok)?\s*(\d+)/) || ql.match(/ogrenci\s*sayisi\s*(?:maksimum|minimum|max|min|en\s+fazla|en\s+az|en\s+cok)?\s*(\d+)/);
      if (m) { 
        const isMax = isMaxGenel || /maksimum|max|en\s+fazla|en\s+cok/.test(m[0]);
        isMax ? (filters.ogrenci_max = parseInt(m[1])) : (filters.ogrenci_min = parseInt(m[1])); 
      }
    }
    // Derslik
    if (!filters.derslik_min && !filters.derslik_max) {
      const m = ql.match(/(\d+)\s*derslik/) || ql.match(/derslik(?:sayisi|i)?\s*(?:maksimum|minimum|max|min|en\s+fazla|en\s+az|en\s+cok)?\s*(\d+)/);
      if (m) { 
        const isMax = isMaxGenel || /maksimum|max|en\s+fazla|en\s+cok/.test(m[0]);
        isMax ? (filters.derslik_max = parseInt(m[1])) : (filters.derslik_min = parseInt(m[1])); 
      }
    }
    // Kitap
    if (!filters.kitap_sayisi_min && !filters.kitap_sayisi_max) {
      const m = ql.match(/(\d+)\s*kitap/) || ql.match(/kitap(?:sayisi|i)?\s*(\d+)/);
      if (m) {
        const isAz = isMaxGenel || /az|alt|dusuk/.test(ql);
        isAz ? (filters.kitap_sayisi_max = parseInt(m[1])) : (filters.kitap_sayisi_min = parseInt(m[1]));
      }
    }
    // Sayfa
    if (!filters.sayfa_sayisi_min && !filters.sayfa_sayisi_max) {
      const m = ql.match(/(\d+)\s*sayfa/) || ql.match(/sayfa(?:sayisi|si)?\s*(\d+)/);
      if (m) {
        const isAz = isMaxGenel || /az|alt|dusuk/.test(ql);
        isAz ? (filters.sayfa_sayisi_max = parseInt(m[1])) : (filters.sayfa_sayisi_min = parseInt(m[1]));
      }
    }
    // Devamsızlık
    if (!filters.devamsizlik_min && !filters.devamsizlik_max) {
      const m = ql.match(/(\d+)\s*gun\s*devamsizl/) ||
                ql.match(/devamsizl[a-z]*\s*(?:maksimum|minimum|max|min|en\s+fazla|en\s+az|en\s+cok)?\s*(\d+)\s*gun/) ||
                ql.match(/devamsizl[a-z]*\s*(?:maksimum|minimum|max|min|en\s+fazla|en\s+az|en\s+cok)?\s*(\d+)/) ||
                ql.match(/(\d+)\s*devamsizl/);
      if (m) {
        const isAz = isMaxGenel || /az|alt|dusuk|maksimum|max|en\s+fazla/.test(m[0]) || /az|alt|dusuk/.test(ql);
        isAz ? (filters.devamsizlik_max = parseInt(m[1])) : (filters.devamsizlik_min = parseInt(m[1]));
      }
      // Sınıf bazlı devamsızlık
      const sinifM = ql.match(/(\d)[\.\s]sinif/);
      if (sinifM) filters.devamsizlik_sinif = parseInt(sinifM[1]);
    }
    // Proje
    if (!filters.proje_min) {
      const m = ql.match(/(\d+)\s*proje/) || ql.match(/proje(?:sayisi|si)?\s*(?:maksimum|minimum|max|min|en\s+fazla|en\s+az|en\s+cok)?\s*(\d+)/);
      if (m) filters.proje_min = parseInt(m[1]);
    }
    // DYK
    if (!filters.dyk_kurs_min) {
      const m = ql.match(/(\d+)\s*dyk/) || ql.match(/dyk.*?(\d+)\s*kurs/);
      if (m) filters.dyk_kurs_min = parseInt(m[1]);
    }
    // Lisanslı sporcu min
    if (!filters.lisansli_sporcu_min) {
      const m = ql.match(/(\d+)\s*(?:lisansl|sporcu)/) || ql.match(/(?:lisansl|sporcu).*?(\d+)/);
      if (m) filters.lisansli_sporcu_min = parseInt(m[1]);
    }
    // Yabancı uyruklu min
    if (!filters.yabanci_uyruklu_min) {
      const m = ql.match(/(\d+)\s*yabanci/) || ql.match(/yabanci.*?(\d+)/);
      if (m) filters.yabanci_uyruklu_min = parseInt(m[1]);
    }
    // TBM
    if (!filters.tbm_ogrenci_min && !filters.tbm_ogretmen_min) {
      const m = ql.match(/tbm.*?(\d+)/) || ql.match(/(\d+).*tbm/);
      if (m) {
        ql.includes('ogretmen')
          ? (filters.tbm_ogretmen_min = parseInt(m[1]))
          : (filters.tbm_ogrenci_min  = parseInt(m[1]));
      }
    }
    // Veli faaliyet
    if (!filters.veli_faaliyet_min) {
      const m = ql.match(/(\d+)\s*veli.*faali/) || ql.match(/veli.*faali.*?(\d+)/);
      if (m) filters.veli_faaliyet_min = parseInt(m[1]);
    }
    // LGS mezun
    if (!filters.lgs_mezun_min) {
      const m = ql.match(/lgs.*?(\d+)\s*mezun/) || ql.match(/(\d+)\s*lgs.*mezun/);
      if (m) filters.lgs_mezun_min = parseInt(m[1]);
    }
    // Yaz okulu kurs
    const yazM = ql.match(/(\d+)\s*yaz.*kurs/) || ql.match(/yaz.*kurs.*?(\d+)/);
    if (yazM) filters.yaz_okulu_kurs_min = parseInt(yazM[1]);
    // Taşımalı öğrenci sayısı
    if (!filters.tasimali_min) {
      const m = ql.match(/(\d+)\s*tasimal/) || ql.match(/tasimal.*?(\d+)/);
      if (m) filters.tasimali_min = parseInt(m[1]);
    }
    // Kütüphane kitap sayısı
    if (!filters.kutuphane_kitap_min && ql.includes('kutuphane') && ql.includes('kitap')) {
      const m = ql.match(/(\d+)\s*kitap/);
      if (m) { delete filters.kitap_sayisi_min; filters.kutuphane_kitap_min = parseInt(m[1]); }
    }
    // Şube sayısı
    if (!filters.sube_min && !filters.sube_max) {
      const m = ql.match(/(\d+)\s*sube/) || ql.match(/sube(?:sayisi|si)?\s*(?:maksimum|minimum|max|min|en\s+fazla|en\s+az|en\s+cok)?\s*(\d+)/);
      if (m) {
        const isMax = isMaxGenel || /maksimum|max|en\s+fazla|en\s+cok/.test(m[0]);
        isMax ? (filters.sube_max = parseInt(m[1])) : (filters.sube_min = parseInt(m[1]));
      }
    }
    // Atölye
    if (!filters.atolye_min) {
      const m = ql.match(/(\d+)\s*atolye/);
      if (m) filters.atolye_min = parseInt(m[1]);
      else if (ql.includes('atolye')) filters.atolye_min = 1;
    }
    // Özel Eğitim
    if (!filters.ozel_egitim_sinif_min) {
      const m = ql.match(/(\d+)\s*ozel egitim/);
      if (m) filters.ozel_egitim_sinif_min = parseInt(m[1]);
      else if (ql.includes('ozel egitim')) filters.ozel_egitim_sinif_min = 1;
    }
    // Kantin Geliri
    if (!filters.kantin_geliri_min) {
      const m = ql.match(/(\d+)\s*(?:tl|lira)\s*kantin/) || ql.match(/kantin.*?(\d+)\s*(?:tl|lira)/);
      if (m) filters.kantin_geliri_min = parseInt(m[1]);
    }
    // Uzaklık (Genelde max olarak düşünülür, "X km'den az" veya "X km'ye kadar")
    if (!filters.ilce_merkezi_uzaklik_max) {
      const m = ql.match(/(\d+)\s*km/);
      if (m) filters.ilce_merkezi_uzaklik_max = parseInt(m[1]);
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // 7.5. OKUL ADI VE KONUM TÜRÜ
  // ═══════════════════════════════════════════════════════════════════
  // Konum Türü
  if (ql.includes('koy ') || ql.includes('koyde') || ql.includes('koy okulu')) filters.konum_turu = 'Köy';
  else if (ql.includes('belde')) filters.konum_turu = 'Belde';
  else if (ql.includes('sanayi')) filters.konum_turu = 'Sanayi Bölgesi';
  else if (ql.includes('merkez mahalle')) filters.konum_turu = 'Merkez Mahalle';

  // Okul Adı
  const okulM = ql.match(/(?:ismi|adi|adli)\s+([a-z\s]+)\s+(?:okulu|ilkokulu|ortaokulu|lisesi|anaokulu)/) ||
                ql.match(/([a-z\s]+)\s+(?:okulu|ilkokulu|ortaokulu|lisesi|anaokulu)(?:'nu|'ni)?\s+(?:bul|goster|getir)/);
  if (okulM) {
    filters.okul_adi = okulM[1].trim();
  } else if (!filters.sira_kriteri && !filters.ilce) {
    // Özel isim arama (Basit heuristic)
    const words = text.split(' ').filter(w => w.length > 3 && !['olan','ve','ile','okul','sayisi','kac'].includes(w.toLowerCase()));
    if (words.length > 0 && words.length < 3 && !ql.includes('en fazla') && !ql.includes('en az')) {
        filters.okul_adi = words[0];
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // 8. BOOLEAN FİLTRELER
  // ═══════════════════════════════════════════════════════════════════
  // Taşımalı
  if (ql.match(/tasimali|tasima\s*egitim/)) filters.tasimali_aktif = true;
  // Engelli
  if (ql.includes('engelli') || ql.includes('engelsiz')) {
    if (ql.includes('rampa'))                                filters.engelli_rampasi  = true;
    if (ql.includes('tuvalet'))                              filters.engelli_tuvaleti = true;
    if (ql.match(/asansor|asansoru|lift/))                   filters.engelli_asansoru = true;
    if (!ql.includes('rampa') && !ql.includes('tuvalet') && !ql.match(/asansor/)) {
      // Genel engelli → rampa ara
      filters.engelli_rampasi = true;
    }
  }
  // Kütüphane
  if (ql.match(/kutuphane|kutuphane\s*var/))               filters.kutuphane_var = true;
  // Kantin
  if (ql.match(/kantin\s*var|kantini\s*olan|kantin\s*mevcut|kantin/)) filters.kantin_var = true;
  if (ql.match(/kantinsiz|kantin\s*yok|kantini\s*olmayan/))           filters.kantin_var = false;
  // DYK kursu
  if (ql.match(/dyk\s*kurs[a-z]*\s*var|dyk\s*acil|dyk\s*acilan/))    filters.dyk_kursu_var = true;
  if (ql.match(/dyk\s*kurs[a-z]*\s*yok|dyk\s*acilmayan/))            filters.dyk_kursu_var = false;
  // Yaz okulu
  if (ql.match(/yaz\s*okul[a-z]*\s*var|yaz\s*okul[a-z]*\s*acil/))    filters.yaz_okulu_var = true;
  if (ql.match(/yaz\s*okul[a-z]*\s*yok/))                             filters.yaz_okulu_var = false;
  // Konferans / toplantı salonu
  if (ql.match(/konferans\s*salon/))  filters.konferans_salonu_var = true;
  if (ql.match(/toplanti\s*salon/))   filters.toplanti_salonu_var  = true;
  // Oyun bahçesi
  if (ql.match(/oyun\s*bahce|bahce\s*var/))   filters.oyun_bahcesi = true;
  if (ql.match(/oyun\s*bahce.*yok/))           filters.oyun_bahcesi = false;
  // Bağımsız bina
  if (ql.match(/bagimsiz\s*bina/))   filters.bagimsiz_bina = true;
  if (ql.match(/birlesi[kk]|birlestiri/))      filters.bagimsiz_bina = false;
  // Risk analizi
  if (ql.match(/risk\s*analiz[a-z]*\s*yapil/)) filters.risk_analizi_yapildi = true;
  if (ql.match(/risk\s*analiz[a-z]*\s*yok/))   filters.risk_analizi_yapildi = false;
  // Okul taşıtı
  if (ql.match(/okul\s*tasit|servis/))          filters.okul_tasiti = true;
  // Yemek hizmeti
  if (ql.match(/yemek\s*hizmet|yemek\s*ver/))  filters.yemek_hizmeti = true;
  if (ql.match(/yemek\s*yok|yemek.*verilme/))  filters.yemek_hizmeti = false;
  // Lisanslı sporcu varlığı
  if (ql.match(/lisansl[a-z]*\s*sporcu|sporcu\s*var/) && !filters.lisansli_sporcu_min)
    filters.lisansli_sporcu_var = true;
  // Sporcu branşı
  for (const br of SQ_SPOR_BRANCLAR) {
    if (ql.includes(sqNorm(br))) { filters.lisansli_sporcu_brans = br; break; }
  }
  // Yabancı uyruklu varlığı
  if (ql.match(/yabanci\s*uyruk/) && !filters.yabanci_uyruklu_min)
    filters.yabanci_uyruklu_var = true;
  // Ödül
  if (ql.match(/odul|odulle/))                       filters.odul_var = true;
  // Uluslararası proje
  if (ql.match(/uluslararas/))                        filters.uluslararasi_proje_var = true;
  // Kardeş okul
  if (ql.match(/kardes\s*okul|uluslararasi\s*kardes/)) filters.kardes_okul_var = true;
  // LGS sınavlı
  if (ql.includes('lgs') && ql.match(/sinav(li)?\s*yerles/)) filters.lgs_sinavli_var  = true;
  if (ql.includes('lgs') && ql.match(/sinavsiz\s*yerles/))   filters.lgs_sinavsiz_var = true;
  // Genel LGS
  if (ql.includes('lgs') && !filters.lgs_sinavli_var && !filters.lgs_sinavsiz_var && !filters.lgs_mezun_min)
    filters.lgs_sinavli_var = true;
  // Bağımlılık / TBM
  if (ql.match(/bagimlilik|tbm/) && !filters.tbm_ogrenci_min) filters.tbm_ogrenci_min = 1;

  return filters;
}



function sqNorm(str) {
  return String(str||'')
    .replace(/İ/g,'i').replace(/I/g,'i').replace(/Ğ/g,'g')
    .replace(/Ü/g,'u').replace(/Ş/g,'s').replace(/Ö/g,'o').replace(/Ç/g,'c')
    .toLowerCase()
    .replace(/i̇/g,'i').replace(/ı/g,'i').replace(/ğ/g,'g')
    .replace(/ü/g,'u').replace(/ş/g,'s').replace(/ö/g,'o').replace(/ç/g,'c');
}

// ─────────────────────────────────────────────────────────────────────
// FİLTRELEME ENGİNE
// ─────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────
// SIRALAMA YARDIMCISI — verilen kritere göre alan değerini döndürür
// ─────────────────────────────────────────────────────────────────────
function sqGetSortValue(r, kriteri) {
  switch (kriteri) {
    case 'ogrenci':      return r.ogrenci_toplam || 0;
    case 'ogretmen':     return r.ogretmen_sayisi || 0;
    case 'devamsizlik':  return r.devamsizlik?.toplam || 0;
    case 'kitap':        return r.kitap_okuma?.kitap_sayisi || 0;
    case 'sayfa':        return r.kitap_okuma?.sayfa_sayisi || 0;
    case 'sporcu':       return r.lisansli_sporcu_toplam || 0;
    case 'yabanci':      return r.yabanci_uyruklu_toplam || 0;
    case 'proje':        return r.sosyal_etkinlik?.proje_sayisi || 0;
    case 'derslik':      return r.derslik_sayisi || 0;
    case 'tasimali':     return r.tasimali?.toplam || 0;
    case 'dyk':          return r.dyk_kurs_sayisi || 0;
    case 'tbm_ogrenci':  return r.tbm?.ogrenci_sayisi || 0;
    case 'tbm_ogretmen': return r.tbm?.ogretmen_sayisi || 0;
    case 'veli_faaliyet':return r.veli_faaliyet?.faaliyet_sayisi || 0;
    case 'lgs_mezun':    return r.lgs?.mezun_sayisi || 0;
    default:             return r.ogrenci_toplam || 0;
  }
}

function sqApplyFilters(filters) {
  const db = window.STUDENT_DB || [];
  let results = db.filter(r => {
    // Okul Adı araması
    if (filters.okul_adi && !sqNorm(r.okul_adi).includes(sqNorm(filters.okul_adi))) return false;
    // İlçe
    if (filters.ilce) {
      if (Array.isArray(filters.ilce)) {
        if (!filters.ilce.includes(r.ilce)) return false;
      } else {
        if (r.ilce !== filters.ilce) return false;
      }
    }
    // Okul türü
    if (filters.okul_turu && r.okul_turu !== filters.okul_turu) return false;
    // Öğretim şekli
    if (filters.ogretim_sekli && r.ogretim_sekli !== filters.ogretim_sekli) return false;
    // Isınma
    if (filters.isinma_turu && r.isinma_turu !== filters.isinma_turu) return false;
    // Konum Türü
    if (filters.konum_turu && r.konum_turu !== filters.konum_turu) return false;
    // İlçe Merkezi Uzaklık
    if (filters.ilce_merkezi_uzaklik_max !== undefined && r.ilce_merkezi_uzaklik_km > filters.ilce_merkezi_uzaklik_max) return false;
    // Bağımsız bina
    if (filters.bagimsiz_bina !== undefined && r.bagimsiz_bina !== filters.bagimsiz_bina) return false;
    // Risk analizi
    if (filters.risk_analizi_yapildi !== undefined && r.risk_analizi_yapildi !== filters.risk_analizi_yapildi) return false;
    // Okul taşıtı
    if (filters.okul_tasiti !== undefined && r.okul_tasiti !== filters.okul_tasiti) return false;
    // Öğretmen sayısı
    if (filters.ogretmen_min !== undefined && (r.ogretmen_sayisi || 0) < filters.ogretmen_min) return false;
    // Kantin ve Geliri
    if (filters.kantin_var !== undefined && r.kantin_var !== filters.kantin_var) return false;
    if (filters.kantin_geliri_min !== undefined && (r.kantin_geliri_tl||0) < filters.kantin_geliri_min) return false;
    // Engelli
    if (filters.engelli_rampasi !== undefined && r.engelli_rampasi !== filters.engelli_rampasi) return false;
    if (filters.engelli_tuvaleti !== undefined && r.engelli_tuvaleti !== filters.engelli_tuvaleti) return false;
    if (filters.engelli_asansoru !== undefined && r.engelli_asansoru?.var !== filters.engelli_asansoru) return false;
    // Oyun bahçesi
    if (filters.oyun_bahcesi !== undefined && r.oyun_bahcesi !== filters.oyun_bahcesi) return false;
    // DYK kursu
    if (filters.dyk_kursu_var !== undefined && r.dyk_kursu_var !== filters.dyk_kursu_var) return false;
    // Kütüphane
    if (filters.kutuphane_var !== undefined && r.kutuphane?.var !== filters.kutuphane_var) return false;
    // Konferans
    if (filters.konferans_salonu_var !== undefined && r.konferans_salonu?.var !== filters.konferans_salonu_var) return false;
    // Toplantı
    if (filters.toplanti_salonu_var !== undefined && r.toplanti_salonu?.var !== filters.toplanti_salonu_var) return false;
    // Derslik & Şube & Atölye & Özel Eğitim
    if (filters.derslik_min !== undefined && r.derslik_sayisi < filters.derslik_min) return false;
    if (filters.derslik_max !== undefined && r.derslik_sayisi > filters.derslik_max) return false;
    if (filters.sube_min !== undefined && r.sube_sayisi < filters.sube_min) return false;
    if (filters.sube_max !== undefined && r.sube_sayisi > filters.sube_max) return false;
    if (filters.atolye_min !== undefined && (r.atolye_sayisi||0) < filters.atolye_min) return false;
    if (filters.ozel_egitim_sinif_min !== undefined && (r.ozel_egitim_sinif||0) < filters.ozel_egitim_sinif_min) return false;
    // Kütüphane kitap sayısı
    if (filters.kutuphane_kitap_min !== undefined && (r.kutuphane?.kitap_sayisi || 0) < filters.kutuphane_kitap_min) return false;
    // Spor alanı
    if (filters.bahce_spor_alan_min !== undefined && r.bahce_spor_alani_m2 < filters.bahce_spor_alan_min) return false;
    // Öğretmen sayısı max (eklendi)
    if (filters.ogretmen_max !== undefined && (r.ogretmen_sayisi||0) > filters.ogretmen_max) return false;
    // Öğrenci sayısı
    if (filters.ogrenci_min !== undefined && r.ogrenci_toplam < filters.ogrenci_min) return false;
    if (filters.ogrenci_max !== undefined && r.ogrenci_toplam > filters.ogrenci_max) return false;
    // Taşımalı
    if (filters.tasimali_aktif !== undefined && r.tasimali?.aktif !== filters.tasimali_aktif) return false;
    if (filters.tasimali_min !== undefined && (r.tasimali?.toplam||0) < filters.tasimali_min) return false;
    if (filters.yemek_hizmeti !== undefined && r.tasimali?.yemek_hizmeti !== filters.yemek_hizmeti) return false;
    // Devamsızlık
    if (filters.devamsizlik_min !== undefined || filters.devamsizlik_max !== undefined) {
      let devVal;
      if (filters.devamsizlik_sinif) {
        devVal = r.devamsizlik?.sinif_bazli?.[filters.devamsizlik_sinif] || 0;
      } else {
        devVal = r.devamsizlik?.toplam || 0;
      }
      if (filters.devamsizlik_min !== undefined && devVal < filters.devamsizlik_min) return false;
      if (filters.devamsizlik_max !== undefined && devVal > filters.devamsizlik_max) return false;
    }
    // Disiplin
    if (filters.disiplin_min !== undefined && (r.disiplin?.toplam||0) < filters.disiplin_min) return false;
    // Kitap okuma
    if (filters.kitap_sayisi_min !== undefined && (r.kitap_okuma?.kitap_sayisi||0) < filters.kitap_sayisi_min) return false;
    if (filters.kitap_sayisi_max !== undefined && (r.kitap_okuma?.kitap_sayisi||0) > filters.kitap_sayisi_max) return false;
    if (filters.sayfa_sayisi_min !== undefined && (r.kitap_okuma?.sayfa_sayisi||0) < filters.sayfa_sayisi_min) return false;
    if (filters.sayfa_sayisi_max !== undefined && (r.kitap_okuma?.sayfa_sayisi||0) > filters.sayfa_sayisi_max) return false;
    // Lisanslı sporcu
    if (filters.lisansli_sporcu_var === true && r.lisansli_sporcu_toplam === 0) return false;
    if (filters.lisansli_sporcu_brans) {
      const b = filters.lisansli_sporcu_brans;
      if (!r.lisansli_sporcu?.[b] || r.lisansli_sporcu[b].toplam === 0) return false;
    }
    if (filters.lisansli_sporcu_min !== undefined && r.lisansli_sporcu_toplam < filters.lisansli_sporcu_min) return false;
    // Yabancı uyruklu
    if (filters.yabanci_uyruklu_var === true && r.yabanci_uyruklu_toplam === 0) return false;
    if (filters.yabanci_uyruklu_ulke) {
      const ulke = filters.yabanci_uyruklu_ulke;
      if (!r.yabanci_uyruklu?.[ulke] || r.yabanci_uyruklu[ulke].toplam === 0) return false;
    }
    if (filters.yabanci_uyruklu_min !== undefined && r.yabanci_uyruklu_toplam < filters.yabanci_uyruklu_min) return false;
    // Proje
    if (filters.proje_min !== undefined && (r.sosyal_etkinlik?.proje_sayisi||0) < filters.proje_min) return false;
    if (filters.odul_var === true && (r.sosyal_etkinlik?.odul_sayisi||0) === 0) return false;
    if (filters.uluslararasi_proje_var === true) {
      const hasInt = r.sosyal_etkinlik?.projeler?.some(p=>p.tur==='uluslararası');
      if (!hasInt) return false;
    }
    // LGS
    if (filters.lgs_mezun_min !== undefined && (r.lgs?.mezun_sayisi||0) < filters.lgs_mezun_min) return false;
    if (filters.lgs_sinavli_var === true) {
      if (!r.lgs || !r.lgs.sinavli || Object.values(r.lgs.sinavli).every(v=>v===0)) return false;
    }
    if (filters.lgs_sinavsiz_var === true) {
      if (!r.lgs || !r.lgs.sinavsiz || Object.values(r.lgs.sinavsiz).every(v=>v===0)) return false;
    }
    // DYK kurs sayısı
    if (filters.dyk_kurs_min !== undefined && (r.dyk_kurs_sayisi||0) < filters.dyk_kurs_min) return false;
    // Yaz okulu
    if (filters.yaz_okulu_var !== undefined && r.yaz_okulu_var !== filters.yaz_okulu_var) return false;
    if (filters.yaz_okulu_kurs_min !== undefined && (r.yaz_okulu_kurs_sayisi||0) < filters.yaz_okulu_kurs_min) return false;
    // Veli faaliyet
    if (filters.veli_faaliyet_min !== undefined && (r.veli_faaliyet?.faaliyet_sayisi||0) < filters.veli_faaliyet_min) return false;
    // TBM
    if (filters.tbm_ogrenci_min !== undefined && (r.tbm?.ogrenci_sayisi||0) < filters.tbm_ogrenci_min) return false;
    if (filters.tbm_ogretmen_min !== undefined && (r.tbm?.ogretmen_sayisi||0) < filters.tbm_ogretmen_min) return false;
    // Kardeş okul
    if (filters.kardes_okul_var === true && !r.kardes_okul) return false;
    if (filters.kardes_okul_var === false && r.kardes_okul) return false;

    return true;
  });

  // Sıralama + Limit uygula
  if (filters.sira_kriteri && filters.sira_yon) {
    const asc = filters.sira_yon === 'artan';
    results.sort((a, b) => {
      const va = sqGetSortValue(a, filters.sira_kriteri);
      const vb = sqGetSortValue(b, filters.sira_kriteri);
      return asc ? va - vb : vb - va;
    });
    if (filters.limit && filters.limit > 0) {
      results = results.slice(0, filters.limit);
    }
  }

  return results;
}

// ─────────────────────────────────────────────────────────────────────
// ÖZET İSTATİSTİK
// ─────────────────────────────────────────────────────────────────────
function sqBuildSummary(results) {
  const total = results.length;
  if (total === 0) return null;

  const ilceDag = {};
  const turDag  = {};
  let topOgrenci = 0, topLisansl = 0, topYabanci = 0, topDevamsiz = 0, topKitap = 0, topSayfa = 0;

  for (const r of results) {
    ilceDag[r.ilce]     = (ilceDag[r.ilce]     || 0) + 1;
    turDag[r.okul_turu] = (turDag[r.okul_turu] || 0) + 1;
    topOgrenci  += r.ogrenci_toplam;
    topLisansl  += r.lisansli_sporcu_toplam;
    topYabanci  += r.yabanci_uyruklu_toplam;
    topDevamsiz += r.devamsizlik?.toplam || 0;
    topKitap    += r.kitap_okuma?.kitap_sayisi || 0;
    topSayfa    += r.kitap_okuma?.sayfa_sayisi || 0;
  }

  return { total, ilceDag, turDag, topOgrenci, topLisansl, topYabanci, topDevamsiz, topKitap, topSayfa };
}

// ─────────────────────────────────────────────────────────────────────
// FİLTRE CHİP ETİKETLERİ
// ─────────────────────────────────────────────────────────────────────
function sqFilterLabel(key, val) {
  const labels = {
    sira_kriteri: v => {
      const m = {
        ogrenci:'Öğrenci', ogretmen:'Öğretmen', devamsizlik:'Devamsızlık',
        kitap:'Kitap', sayfa:'Sayfa', sporcu:'Lisanslı Sporcu',
        yabanci:'Yabancı Uyruklu', proje:'Proje', derslik:'Derslik',
        tasimali:'Taşımalı', dyk:'DYK Kurs', tbm_ogrenci:'TBM Öğrenci',
        tbm_ogretmen:'TBM Öğretmen', veli_faaliyet:'Veli Faaliyet', lgs_mezun:'LGS Mezun'
      };
      return `📊 Sıralama: ${m[v]||v}`;
    },
    sira_yon: v => v === 'azalan' ? '⬇️ En Fazladan' : '⬆️ En Azdan',
    limit: v => `🔢 İlk ${v} Okul`,
    ilce: v => `📍 ${Array.isArray(v) ? v.join(', ') : v}`,
    okul_adi: v => `🏫 Adı: ${v}`,
    konum_turu: v => `🏡 Konum: ${v}`,
    ilce_merkezi_uzaklik_max: v => `🛣️ Merkeze Maks: ${v} km`,
    okul_turu: v => { const m={okuloncesi:'Okul Öncesi',ilkokul:'İlkokul',ortaokul:'Ortaokul',lise:'Lise'}; return `🏫 ${m[v]||v}`; },
    ogretim_sekli: v => `📋 Öğretim: ${v}`,
    isinma_turu: v => `🔥 Isınma: ${v}`,
    bagimsiz_bina: v => v ? '🏢 Bağımsız Bina' : '🏢 Birleşik Bina',
    risk_analizi_yapildi: v => v ? '⚠️ Risk Analizi Yapılmış' : '⚠️ Risk Analizi Yok',
    okul_tasiti: v => v ? '🚌 Okul Taşıtı Var' : '🚌 Okul Taşıtı Yok',
    engelli_rampasi: v => v ? '♿ Engelli Rampası' : '♿ Rampa Yok',
    engelli_tuvaleti: v => v ? '🚻 Engelli Tuvaleti' : '🚻 Engelli Tuvaleti Yok',
    engelli_asansoru: v => v ? '🛗 Engelli Asansörü' : '🛗 Asansör Yok',
    kantin_var: v => v ? '🍽️ Kantin Var' : '🍽️ Kantin Yok',
    kantin_geliri_min: v => `💰 Kantin Geliri ≥${v} TL`,
    ogretmen_min: v => `👩‍🏫 Öğretmen ≥${v}`,
    ogretmen_max: v => `👩‍🏫 Öğretmen ≤${v}`,
    oyun_bahcesi: v => v ? '🌳 Oyun Bahçesi' : '🌳 Oyun Bahçesi Yok',
    dyk_kursu_var: v => v ? '📚 DYK Kursu' : '📚 DYK Kursu Yok',
    kutuphane_var: v => v ? '📖 Kütüphane Var' : '📖 Kütüphane Yok',
    konferans_salonu_var: v => v ? '🎙️ Konferans Salonu' : '🎙️ Konferans Yrk',
    toplanti_salonu_var: v => v ? '📐 Toplantı Salonu' : '📐 Toplantı Yok',
    derslik_min: v => `🚪 Derslik ≥${v}`,
    derslik_max: v => `🚪 Derslik ≤${v}`,
    sube_min: v => `👥 Şube ≥${v}`,
    sube_max: v => `👥 Şube ≤${v}`,
    atolye_min: v => `🛠️ Atölye ≥${v}`,
    ozel_egitim_sinif_min: v => `♾️ Özel Eğitim Sınıfı ≥${v}`,
    kutuphane_kitap_min: v => `📚 Kütüphane ≥${v} kitap`,
    bahce_spor_alan_min: v => `⚽ Spor Alanı ≥${v}m²`,
    ogrenci_min: v => `👨‍🎓 Öğrenci ≥${v}`,
    ogrenci_max: v => `👨‍🎓 Öğrenci ≤${v}`,
    tasimali_aktif: v => v ? '🚌 Taşımalı Aktif' : '🚌 Taşımalı Değil',
    tasimali_min: v => `🚌 Taşınan ≥${v}`,
    yemek_hizmeti: v => v ? '🍽️ Yemek Hizmeti' : '🍽️ Yemek Yok',
    devamsizlik_min: v => `⏰ Devamsızlık ≥${v} gün`,
    devamsizlik_max: v => `⏰ Devamsızlık ≤${v} gün`,
    devamsizlik_sinif: v => `🎒 ${v}. Sınıf Devamsızlık`,
    disiplin_min: v => `⚡ Disiplin ≥${v}`,
    kitap_sayisi_min: v => `📖 ≥${v} kitap`,
    kitap_sayisi_max: v => `📖 ≤${v} kitap`,
    sayfa_sayisi_min: v => `📄 ≥${v} sayfa`,
    sayfa_sayisi_max: v => `📄 ≤${v} sayfa`,
    lisansli_sporcu_var: v => v ? '🏅 Lisanslı Sporcu Var' : '🏅 Sporcu Yok',
    lisansli_sporcu_brans: v => `🏅 ${v} Lisansı`,
    lisansli_sporcu_min: v => `🏅 Sporcu ≥${v}`,
    yabanci_uyruklu_var: v => v ? '🌍 Yabancı Uyruklu Var' : '🌍 Yabancı Yok',
    yabanci_uyruklu_ulke: v => `🌍 Ülke: ${v}`,
    yabanci_uyruklu_min: v => `🌍 Yabancı ≥${v}`,
    proje_min: v => `💡 Proje ≥${v}`,
    odul_var: v => v ? '🏆 Ödüllü Okul' : '',
    uluslararasi_proje_var: v => v ? '🌐 Uluslararası Proje' : '',
    lgs_mezun_min: v => `🎓 LGS Mezun ≥${v}`,
    lgs_sinavli_var: v => v ? '📝 LGS Sınavlı Yerleşme' : '',
    lgs_sinavsiz_var: v => v ? '📝 LGS Sınavsiz Yerleşme' : '',
    dyk_kurs_min: v => `📚 DYK Kurs ≥${v}`,
    yaz_okulu_var: v => v ? '☀️ Yaz Okulu Var' : '☀️ Yaz Okulu Yok',
    yaz_okulu_kurs_min: v => `☀️ Yaz Okulu Kurs ≥${v}`,
    veli_faaliyet_min: v => `👨‍👩‍👧 Veli Faaliyet ≥${v}`,
    tbm_ogrenci_min: v => `🟣 TBM Öğrenci ≥${v}`,
    tbm_ogretmen_min: v => `🟣 TBM Öğretmen ≥${v}`,
    kardes_okul_var: v => v ? '🌐 Kardeş Okul Var' : '🌐 Kardeş Okul Yok',
  };
  const fn = labels[key];
  return fn ? fn(val) : `${key}: ${val}`;
}

// ─────────────────────────────────────────────────────────────────────
// RENDER — Sonuç tablosu
// ─────────────────────────────────────────────────────────────────────
function sqRenderResults() {
  const container = document.getElementById('sqResultsArea');
  if (!container) return;

  const summary = sqBuildSummary(sqResults);
  if (!summary) {
    container.innerHTML = `
      <div class="sq-empty">
        <div class="sq-empty-icon">🔍</div>
        <div class="sq-empty-text">Belirtilen kriterlere uyan okul bulunamadı.</div>
        <div class="sq-empty-hint">Filtreleri genişleterek tekrar deneyin.</div>
      </div>`;
    return;
  }

  // Sayfalama
  const totalPages = Math.ceil(sqResults.length / SQ_PAGE_SIZE);
  sqCurrentPage = Math.max(1, Math.min(sqCurrentPage, totalPages));
  const startIdx = (sqCurrentPage - 1) * SQ_PAGE_SIZE;
  const pageItems = sqResults.slice(startIdx, startIdx + SQ_PAGE_SIZE);

  const turLabel = { okuloncesi: 'Okul Öncesi', ilkokul: 'İlkokul', ortaokul: 'Ortaokul', lise: 'Lise' };
  const turTotal = Object.values(summary.turDag).reduce((a,b)=>a+b,0) || 1;
  const turColors = {'ilkokul':'#3b82f6', 'ortaokul':'#10b981', 'lise':'#f59e0b', 'okuloncesi':'#8b5cf6'};
  let turChartHtml = '<div style="display:flex; height:8px; width:100%; border-radius:4px; overflow:hidden; margin-top:8px;">';
  let turLegendHtml = '<div style="display:flex; gap:10px; font-size:0.75rem; color:var(--text-light); margin-top:4px; flex-wrap:wrap;">';
  for (const [k,v] of Object.entries(summary.turDag)) {
    const pct = ((v/turTotal)*100).toFixed(1);
    const color = turColors[k] || '#64748b';
    const lbl = turLabel[k] || k;
    turChartHtml += `<div style="width:${pct}%; background:${color};" title="${lbl}: %${pct}"></div>`;
    turLegendHtml += `<span style="display:flex; align-items:center; gap:4px;"><span style="width:8px;height:8px;border-radius:50%;background:${color};"></span>${lbl} (%${pct})</span>`;
  }
  turChartHtml += '</div>';
  turLegendHtml += '</div>';

  function th(col, label) {
    let arrow = '';
    if (sqSortCol === col) arrow = sqSortAsc ? ' <span style="color:var(--primary)">▲</span>' : ' <span style="color:var(--primary)">▼</span>';
    return `<th class="sq-sortable" onclick="sqSortTable('${col}')">${label}${arrow}</th>`;
  }

  let html = `
    <!-- ÖZET KARTLAR -->
    <div class="sq-summary-bar">
      <div class="sq-sum-card primary" style="flex:1;">
        <span class="sq-sum-val">${summary.total}</span>
        <span class="sq-sum-lbl">Okul Bulundu</span>
        ${turChartHtml}
        ${turLegendHtml}
      </div>
      <div class="sq-sum-card">
        <span class="sq-sum-val">${summary.topOgrenci.toLocaleString('tr-TR')}</span>
        <span class="sq-sum-lbl">Toplam Öğrenci</span>
      </div>
      <div class="sq-sum-card">
        <span class="sq-sum-val">${summary.topLisansl}</span>
        <span class="sq-sum-lbl">Lisanslı Sporcu</span>
      </div>
      <div class="sq-sum-card">
        <span class="sq-sum-val">${summary.topYabanci}</span>
        <span class="sq-sum-lbl">Yabancı Uyruklu</span>
      </div>
      <div class="sq-sum-card">
        <span class="sq-sum-val">${summary.topDevamsiz}</span>
        <span class="sq-sum-lbl">10+ Gün Devamsız</span>
      </div>
      <div class="sq-sum-card">
        <span class="sq-sum-val">${summary.topKitap.toLocaleString('tr-TR')}</span>
        <span class="sq-sum-lbl">Toplam Kitap</span>
      </div>
    </div>

    <!-- EXPORT BUTONLARI -->
    <div class="sq-export-bar">
      <span class="sq-export-label">Görünüm & Dışa Aktar:</span>
      <button class="sq-export-btn" style="background:var(--primary); color:white;" onclick="sqToggleMap()">🗺️ Haritada Göster</button>
      <div style="flex:1"></div>
      <button class="sq-export-btn excel" onclick="sqExportExcel()">📊 Excel</button>
      <button class="sq-export-btn csv"   onclick="sqExportCSV()">📄 CSV</button>
      <button class="sq-export-btn word"  onclick="sqExportWord()">📝 Word</button>
      <button class="sq-export-btn pdf"   onclick="sqExportPDF()">🔴 PDF</button>
    </div>

    <!-- TABLO -->
    <div class="sq-table-wrap">
      <table class="sq-table">
        <thead>
          <tr>
            <th>#</th>
            ${th('okul_adi', 'Okul Adı')}
            ${th('ilce', 'İlçe')}
            ${th('okul_turu', 'Tür')}
            ${th('ogrenci', 'Öğrenci')}
            ${th('devamsizlik', 'Devamsızlık')}
            ${th('kitap', 'Kitap')}
            ${th('sayfa', 'Sayfa')}
            ${th('spor', 'Lisanslı Sporcu')}
            ${th('yabanci', 'Yabancı Uyruklu')}
            ${th('proje', 'Proje')}
            ${th('odul', 'Ödül')}
            <th>İşlem</th>
          </tr>
        </thead>
        <tbody>`;

  pageItems.forEach((r, i) => {
    const spor = r.lisansli_sporcu_toplam > 0
      ? Object.entries(r.lisansli_sporcu).map(([b,v])=>`${b}:${v.toplam}`).join(', ')
      : '—';
    const yabanci = r.yabanci_uyruklu_toplam > 0
      ? Object.entries(r.yabanci_uyruklu).map(([u,v])=>`${u}:${v.toplam}`).join(', ')
      : '—';

    html += `
          <tr class="sq-row" onclick="sqShowDetail(${startIdx + i})">
            <td>${startIdx + i + 1}</td>
            <td class="sq-okul-adi"><strong>${r.okul_adi}</strong></td>
            <td>${r.ilce}</td>
            <td><span class="sq-tur-badge sq-tur-${r.okul_turu}">${turLabel[r.okul_turu]||r.okul_turu}</span></td>
            <td>${r.ogrenci_toplam}</td>
            <td class="${(r.devamsizlik?.toplam||0)>0?'sq-warn':''}">${r.devamsizlik?.toplam||0}</td>
            <td>${r.kitap_okuma?.kitap_sayisi||0}</td>
            <td>${(r.kitap_okuma?.sayfa_sayisi||0).toLocaleString('tr-TR')}</td>
            <td title="${spor}">${r.lisansli_sporcu_toplam > 0 ? `🏅 ${r.lisansli_sporcu_toplam}` : '—'}</td>
            <td title="${yabanci}">${r.yabanci_uyruklu_toplam > 0 ? `🌍 ${r.yabanci_uyruklu_toplam}` : '—'}</td>
            <td>${r.sosyal_etkinlik?.proje_sayisi||0}</td>
            <td>${(r.sosyal_etkinlik?.odul_sayisi||0)>0?'🏆':''}</td>
            <td><button class="sq-detail-btn" onclick="event.stopPropagation();sqShowDetail(${startIdx+i})">Detay</button></td>
          </tr>`;
  });

  html += `
        </tbody>
      </table>
    </div>

    <!-- SAYFALAMA -->
    <div class="sq-pagination">
      <button class="sq-page-btn" onclick="sqGoPage(${sqCurrentPage-1})" ${sqCurrentPage<=1?'disabled':''}>‹ Önceki</button>
      <span class="sq-page-info">${sqCurrentPage} / ${totalPages} (${summary.total} sonuç)</span>
      <button class="sq-page-btn" onclick="sqGoPage(${sqCurrentPage+1})" ${sqCurrentPage>=totalPages?'disabled':''}>Sonraki ›</button>
    </div>`;

  container.innerHTML = html;
  
  if (typeof sqRenderMap === 'function') {
    setTimeout(sqRenderMap, 50);
  }
}

function sqGoPage(p) {
  sqCurrentPage = p;
  sqRenderResults();
  document.getElementById('sqResultsArea')?.scrollIntoView({ behavior: 'smooth' });
}

let sqSortCol = null;
let sqSortAsc = true;

function sqSortTable(col) {
  if (sqSortCol === col) sqSortAsc = !sqSortAsc;
  else { sqSortCol = col; sqSortAsc = true; }
  
  sqResults.sort((a,b) => {
    let valA, valB;
    switch(col) {
      case 'okul_adi': valA = a.okul_adi; valB=b.okul_adi; break;
      case 'ilce': valA = a.ilce; valB=b.ilce; break;
      case 'okul_turu': valA = a.okul_turu; valB=b.okul_turu; break;
      case 'ogrenci': valA = a.ogrenci_toplam||0; valB=b.ogrenci_toplam||0; break;
      case 'devamsizlik': valA = a.devamsizlik?.toplam||0; valB=b.devamsizlik?.toplam||0; break;
      case 'kitap': valA = a.kitap_okuma?.kitap_sayisi||0; valB=b.kitap_okuma?.kitap_sayisi||0; break;
      case 'sayfa': valA = a.kitap_okuma?.sayfa_sayisi||0; valB=b.kitap_okuma?.sayfa_sayisi||0; break;
      case 'spor': valA = a.lisansli_sporcu_toplam||0; valB=b.lisansli_sporcu_toplam||0; break;
      case 'yabanci': valA = a.yabanci_uyruklu_toplam||0; valB=b.yabanci_uyruklu_toplam||0; break;
      case 'proje': valA = a.sosyal_etkinlik?.proje_sayisi||0; valB=b.sosyal_etkinlik?.proje_sayisi||0; break;
      case 'odul': valA = a.sosyal_etkinlik?.odul_sayisi||0; valB=b.sosyal_etkinlik?.odul_sayisi||0; break;
      default: return 0;
    }
    if (typeof valA === 'string') {
      return sqSortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    } else {
      return sqSortAsc ? valA - valB : valB - valA;
    }
  });
  
  sqCurrentPage = 1;
  sqRenderResults();
}

// ─────────────────────────────────────────────────────────────────────
// DETAY MODALİ
// ─────────────────────────────────────────────────────────────────────
function sqShowDetail(idx) {
  const r = sqResults[idx];
  if (!r) return;

  const turLabel = { okuloncesi:'Okul Öncesi', ilkokul:'İlkokul', ortaokul:'Ortaokul', lise:'Lise' };

  let sporHTML = Object.entries(r.lisansli_sporcu || {}).map(([b,v])=>
    `<tr><td>${b}</td><td>${v.erkek}</td><td>${v.kiz}</td><td><strong>${v.toplam}</strong></td></tr>`
  ).join('') || '<tr><td colspan="4">—</td></tr>';

  let yabanciHTML = Object.entries(r.yabanci_uyruklu || {}).map(([u,v])=>
    `<tr><td>${u}</td><td>${v.erkek}</td><td>${v.kiz}</td><td><strong>${v.toplam}</strong></td></tr>`
  ).join('') || '<tr><td colspan="4">—</td></tr>';

  let projeHTML = (r.sosyal_etkinlik?.projeler || []).map(p=>
    `<li>${p.tur === 'uluslararası' ? '🌐' : p.tur === 'ulusal' ? '🇹🇷' : '📍'} ${p.ad} ${p.odul?`<span class="sq-odul-tag">🏆 ${p.odul}</span>`:''}</li>`
  ).join('') || '<li>—</li>';

  let devamsizHTML = Object.entries(r.devamsizlik?.sinif_bazli || {}).map(([s,v])=>
    `<tr><td>${s}. Sınıf</td><td class="${v>0?'sq-warn':''}">${v} öğrenci</td></tr>`
  ).join('');

  let disiplinHTML = Object.entries(r.disiplin?.sinif_bazli || {}).map(([s,v])=>
    `<tr><td>${s}. Sınıf</td><td class="${v>0?'sq-warn':''}">${v} öğrenci</td></tr>`
  ).join('');

  let lgsHTML = '';
  if (r.lgs) {
    const sinavli = Object.entries(r.lgs.sinavli||{}).filter(([,v])=>v>0).map(([k,v])=>`${k}: ${v}`).join(', ') || '—';
    const sinavsiz = Object.entries(r.lgs.sinavsiz||{}).filter(([,v])=>v>0).map(([k,v])=>`${k}: ${v}`).join(', ') || '—';
    lgsHTML = `
      <div class="sq-detail-section">
        <h4>🎓 LGS Sonuçları</h4>
        <p>8. Sınıf Mezun: <strong>${r.lgs.mezun_sayisi}</strong></p>
        <p>Sınavlı: ${sinavli}</p>
        <p>Sınavsız: ${sinavsiz}</p>
      </div>`;
  }

  const modal = document.getElementById('sqDetailModal');
  document.getElementById('sqDetailContent').innerHTML = `
    <h2>${r.okul_adi}</h2>
    <div class="sq-detail-meta">
      <span class="sq-tur-badge sq-tur-${r.okul_turu}">${turLabel[r.okul_turu]||r.okul_turu}</span>
      <span>📍 ${r.ilce}</span>
      <span>🏢 Kurum Kodu: ${r.kurum_kodu}</span>
      ${r.telefon?`<span>📞 ${r.telefon}</span>`:''}
      ${r.email?`<span>✉️ <a href="mailto:${r.email}" style="color:inherit">${r.email}</a></span>`:''}
    </div>

    <div class="sq-detail-grid">
      <!-- Kurum Bilgileri -->
      <div class="sq-detail-section">
        <h4>🏫 Kurum Bilgileri</h4>
        <table class="sq-detail-table">
          <tr><td>Öğretim Şekli</td><td>${r.ogretim_sekli}</td></tr>
          <tr><td>Öğretmen Sayısı</td><td><strong>${r.ogretmen_sayisi||'—'}</strong></td></tr>
          <tr><td>Isınma Türü</td><td>${r.isinma_turu}</td></tr>
          <tr><td>Konum Türü</td><td>${r.konum_turu}</td></tr>
          <tr><td>İlçe Merkezi Uzaklık</td><td>${r.ilce_merkezi_uzaklik_km} km</td></tr>
          <tr><td>Bağımsız Bina</td><td>${r.bagimsiz_bina?'✅ Evet':'❌ Hayır'}</td></tr>
          <tr><td>Risk Analizi</td><td>${r.risk_analizi_yapildi?'✅ Yapıldı':'❌ Yapılmadı'}</td></tr>
          <tr><td>Okul Taşıtı</td><td>${r.okul_tasiti?'✅ Var':'❌ Yok'}</td></tr>
          <tr><td>Kantin</td><td>${r.kantin_var?'✅ Var':'❌ Yok'}</td></tr>
          <tr><td>Kardeş Okul</td><td>${r.kardes_okul?`🌐 ${r.kardes_okul}`:'❌ Yok'}</td></tr>
        </table>
      </div>

      <!-- Öğrenci Sayıları -->
      <div class="sq-detail-section">
        <h4>👥 Öğrenci Bilgileri</h4>
        <table class="sq-detail-table">
          <tr><td>Toplam Öğrenci</td><td><strong>${r.ogrenci_toplam}</strong></td></tr>
          <tr><td>Erkek</td><td>${r.ogrenci_erkek}</td></tr>
          <tr><td>Kız</td><td>${r.ogrenci_kiz}</td></tr>
          <tr><td>Derslik Sayısı</td><td>${r.derslik_sayisi}</td></tr>
          <tr><td>Şube Sayısı</td><td>${r.sube_sayisi}</td></tr>
          ${r.atolye_sayisi>0?`<tr><td>Atölye</td><td>${r.atolye_sayisi}</td></tr>`:''}
        </table>
      </div>

      <!-- Fiziksel Alanlar -->
      <div class="sq-detail-section">
        <h4>🏗️ Fiziksel Alanlar</h4>
        <table class="sq-detail-table">
          <tr><td>Bahçe Spor Alanı</td><td>${r.bahce_spor_alani_m2.toLocaleString('tr-TR')} m²</td></tr>
          <tr><td>Kütüphane</td><td>${r.kutuphane?.var?`✅ ${r.kutuphane.kitap_sayisi.toLocaleString('tr-TR')} kitap`:'❌ Yok'}</td></tr>
          <tr><td>Konferans Salonu</td><td>${r.konferans_salonu?.var?`✅ ${r.konferans_salonu.kapasite} kişi`:'❌ Yok'}</td></tr>
          <tr><td>Toplantı Salonu</td><td>${r.toplanti_salonu?.var?`✅ ${r.toplanti_salonu.kapasite} kişi`:'❌ Yok'}</td></tr>
          <tr><td>Oyun Bahçesi</td><td>${r.oyun_bahcesi?'✅ Var':'❌ Yok'}</td></tr>
        </table>
      </div>

      <!-- Erişilebilirlik -->
      <div class="sq-detail-section">
        <h4>♿ Erişilebilirlik</h4>
        <table class="sq-detail-table">
          <tr><td>Engelli Rampası</td><td>${r.engelli_rampasi?'✅ Var':'❌ Yok'}</td></tr>
          <tr><td>Engelli Tuvaleti</td><td>${r.engelli_tuvaleti?'✅ Var':'❌ Yok'}</td></tr>
          <tr><td>Engelli Asansörü</td><td>${r.engelli_asansoru?.var?`✅ ${r.engelli_asansoru.aktif?'Aktif':'Pasif'}`:'❌ Yok'}</td></tr>
        </table>
      </div>

      <!-- Taşımalı -->
      <div class="sq-detail-section">
        <h4>🚌 Taşımalı Eğitim</h4>
        <table class="sq-detail-table">
          <tr><td>Durum</td><td>${r.tasimali?.aktif?'✅ Aktif':'❌ Yok'}</td></tr>
          ${r.tasimali?.aktif?`
          <tr><td>Erkek</td><td>${r.tasimali.erkek}</td></tr>
          <tr><td>Kız</td><td>${r.tasimali.kiz}</td></tr>
          <tr><td>Toplam</td><td><strong>${r.tasimali.toplam}</strong></td></tr>
          <tr><td>Neden</td><td>${r.tasimali.neden}</td></tr>
          <tr><td>Yemek Hizmeti</td><td>${r.tasimali.yemek_hizmeti?`✅ ${r.tasimali.yemek_ogrenci_sayisi} öğrenci`:'❌ Yok'}</td></tr>`:''}
        </table>
      </div>

      <!-- Devamsızlık -->
      <div class="sq-detail-section">
        <h4>⏰ Devamsızlık (10+ Gün)</h4>
        <table class="sq-detail-table">
          <tr><th>Sınıf</th><th>Öğrenci Sayısı</th></tr>
          ${devamsizHTML}
          <tr><td><strong>Toplam</strong></td><td><strong class="sq-warn">${r.devamsizlik?.toplam||0}</strong></td></tr>
        </table>
      </div>

      <!-- Disiplin -->
      <div class="sq-detail-section">
        <h4>⚡ Disiplin Cezası</h4>
        <table class="sq-detail-table">
          <tr><th>Sınıf</th><th>Öğrenci Sayısı</th></tr>
          ${disiplinHTML}
          <tr><td><strong>Toplam</strong></td><td><strong>${r.disiplin?.toplam||0}</strong></td></tr>
        </table>
      </div>

      <!-- Kitap Okuma -->
      <div class="sq-detail-section">
        <h4>📚 Kitap Okuma</h4>
        <table class="sq-detail-table">
          <tr><td>Dönem Kitap Sayısı</td><td><strong>${r.kitap_okuma?.kitap_sayisi||0}</strong></td></tr>
          <tr><td>Dönem Sayfa Sayısı</td><td><strong>${(r.kitap_okuma?.sayfa_sayisi||0).toLocaleString('tr-TR')}</strong></td></tr>
        </table>
      </div>

      <!-- Lisanslı Sporcu -->
      <div class="sq-detail-section">
        <h4>🏅 Lisanslı Sporcu</h4>
        <table class="sq-detail-table">
          <tr><th>Branş</th><th>Erkek</th><th>Kız</th><th>Toplam</th></tr>
          ${sporHTML}
          <tr><td colspan="3"><strong>TOPLAM</strong></td><td><strong>${r.lisansli_sporcu_toplam}</strong></td></tr>
        </table>
      </div>

      <!-- Yabancı Uyruklu -->
      <div class="sq-detail-section">
        <h4>🌍 Yabancı Uyruklu Öğrenci</h4>
        <table class="sq-detail-table">
          <tr><th>Ülke</th><th>Erkek</th><th>Kız</th><th>Toplam</th></tr>
          ${yabanciHTML}
          <tr><td colspan="3"><strong>TOPLAM</strong></td><td><strong>${r.yabanci_uyruklu_toplam}</strong></td></tr>
        </table>
      </div>

      <!-- Sosyal Etkinlik -->
      <div class="sq-detail-section">
        <h4>💡 Sosyal Etkinlik & Projeler</h4>
        <p>Toplam Proje: <strong>${r.sosyal_etkinlik?.proje_sayisi||0}</strong> | Ödüllü: <strong>${r.sosyal_etkinlik?.odul_sayisi||0}</strong></p>
        <ul class="sq-proje-list">${projeHTML}</ul>
      </div>

      <!-- Ek Eğitim Çalışmaları -->
      <div class="sq-detail-section">
        <h4>📚 Ek Eğitim ve Faaliyetler</h4>
        <table class="sq-detail-table">
          <tr><td>DYK Kursu Açıldı mı?</td><td>${r.dyk_kursu_var?'✅ Evet':'❌ Hayır'}</td></tr>
          <tr><td>Açılan DYK Kurs Sayısı</td><td>${r.dyk_kurs_sayisi||0}</td></tr>
          <tr><td>Yaz Okulu Açıldı mı?</td><td>${r.yaz_okulu_var?'✅ Evet':'❌ Hayır'}</td></tr>
          <tr><td>Yaz Okulu Kurs Sayısı</td><td>${r.yaz_okulu_kurs_sayisi||0}</td></tr>
        </table>
      </div>

      <!-- Veli Faaliyetleri & TBM -->
      <div class="sq-detail-section">
        <h4>👨‍👩‍👧 Veli ve TBM Programı</h4>
        <table class="sq-detail-table">
          <tr><th colspan="2" style="text-align:left; background:#f0f5f9;">Veliye Yönelik Faaliyetler</th></tr>
          <tr><td>Düzenlenen Faaliyet Sayısı</td><td>${r.veli_faaliyet?.faaliyet_sayisi||0}</td></tr>
          <tr><td>Katılan Veli Sayısı</td><td>${r.veli_faaliyet?.katilan_veli_sayisi||0}</td></tr>
          <tr><th colspan="2" style="text-align:left; background:#f0f5f9;">TBM (Türkiye Bağımlılıkla Mücadele) Eğitimi Alanlar</th></tr>
          <tr><td>Öğrenci Sayısı</td><td>${r.tbm?.ogrenci_sayisi||0}</td></tr>
          <tr><td>Öğretmen Sayısı</td><td>${r.tbm?.ogretmen_sayisi||0}</td></tr>
          <tr><td>Yardımcı Personel Sayısı</td><td>${r.tbm?.yardimci_personel_sayisi||0}</td></tr>
          <tr><td>Veli Sayısı</td><td>${r.tbm?.veli_sayisi||0}</td></tr>
        </table>
      </div>

      ${lgsHTML}
    </div>`;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function sqCloseDetail() {
  document.getElementById('sqDetailModal')?.classList.remove('active');
  document.body.style.overflow = '';
}

// ─────────────────────────────────────────────────────────────────────
// FİLTRE CHİPLERİNİ GÜNCELLE
// ─────────────────────────────────────────────────────────────────────
function sqRenderChips() {
  const container = document.getElementById('sqChipsArea');
  if (!container) return;
  const chips = Object.entries(sqCurrentFilters)
    .filter(([,v]) => v !== null && v !== undefined && v !== '')
    .map(([k,v]) => {
      const label = sqFilterLabel(k, v);
      if (!label) return '';
      return `<span class="sq-chip">${label} <button onclick="sqRemoveFilter('${k}')">×</button></span>`;
    }).join('');
  container.innerHTML = chips || '<span class="sq-no-filter">Henüz filtre eklenmedi. Bir sorgu yazın.</span>';
}

function sqRemoveFilter(key) {
  delete sqCurrentFilters[key];
  sqRenderChips();
  sqResults = sqApplyFilters(sqCurrentFilters);
  sqCurrentPage = 1;
  sqRenderResults();
}

function sqClearAll() {
  sqCurrentFilters = {};
  sqResults = window.STUDENT_DB ? [...window.STUDENT_DB] : [];
  sqCurrentPage = 1;
  sqRenderChips();
  sqRenderResults();
  document.getElementById('sqInput').value = '';
}

// ─────────────────────────────────────────────────────────────────────
// ANA SORGU GÖNDERİMİ VE GEÇMİŞ
// ─────────────────────────────────────────────────────────────────────
async function sqSubmitQuery() {
  const input = document.getElementById('sqInput');
  const text  = (input?.value || '').trim();
  if (!text) return;

  const btn = document.getElementById('sqSearchBtn');
  const orig = btn?.innerHTML;
  if (btn) { btn.innerHTML = '⏳ Analiz ediliyor...'; btn.disabled = true; }

  // Yorum satırı alanını hazırla
  const interpEl = document.getElementById('sqInterpretation');
  if (interpEl) {
    interpEl.style.display = 'block';
    interpEl.innerHTML = `🤖 AI analiz ediyor: "<em>${text}</em>"`;
    interpEl.className = 'sq-interpretation loading';
  }

  try {
    let parsed = await sqParseWithAI(text);
    
    // Eğer AI json döndürmüş ama içi boşsa, veya AI servisi kapalıysa Fallback uygula
    if (Object.keys(parsed).length === 0) {
      console.log('[SQ] AI boş filtre döndürdü, manuel analiz deneniyor...');
      parsed = sqManualParse(text);
    } else {
      // AI bir şeyler buldu ama kaçırdığı basit şeyler olabilir, birleştir!
      const manualParsed = sqManualParse(text);
      // Çoklu ilçe tespiti manual parser'da varsa AI'ın bulduğu tekli ilçeyi ezsin
      if (manualParsed.ilce && Array.isArray(manualParsed.ilce)) {
        parsed.ilce = manualParsed.ilce;
      }
      parsed = { ...manualParsed, ...parsed }; // AI'ın kararları ezsin ama AI'ın bulamadığını manual tamamlasın
    }

    sqCurrentFilters = { ...sqCurrentFilters, ...parsed };
    sqResults = sqApplyFilters(sqCurrentFilters);
    sqCurrentPage = 1;
    
    // Yorumu güncelle
    if (interpEl) {
      interpEl.className = 'sq-interpretation success';
      let fCount = Object.keys(parsed).length;
      if (fCount > 0) {
        let fList = Object.entries(parsed).map(([k,v]) => `<span class="sq-i-tag">${sqFilterLabel(k,v) || k}</span>`).join(' ');
        interpEl.innerHTML = `✅ <strong>Sorgu anlaşıldı:</strong> Analiz edilen kriterler: ${fList}`;
      } else {
        interpEl.innerHTML = `ℹ️ Özel bir filtre bulamadı, metin üzerinden genel arama yapıldı.`;
      }
    }

    sqSaveHistory(text);
    sqRenderChips();
    sqRenderResults();
    input.value = '';
  } catch(e) {
    console.error('[SQ] Hata:', e);
    if (interpEl) {
      interpEl.className = 'sq-interpretation error';
      interpEl.innerHTML = `⚠️ AI bağlantı hatası oluştu, manuel analiz uygulandı.`;
    }
  } finally {
    if (btn) { btn.innerHTML = orig; btn.disabled = false; }
  }
}

// ================= GEÇMİŞ =================
const SQ_HISTORY_KEY = 'sq_query_history';

function sqSaveHistory(text) {
  let hist = JSON.parse(localStorage.getItem(SQ_HISTORY_KEY) || '[]');
  hist = hist.filter(t => t !== text); // Aynı sorgu varsa sil (öne alacağız)
  hist.unshift(text);
  if (hist.length > 5) hist.pop(); // Son 5 sorgu
  localStorage.setItem(SQ_HISTORY_KEY, JSON.stringify(hist));
  sqRenderHistory();
}

function sqRenderHistory() {
  const wrap = document.getElementById('sqHistoryBar');
  const chips = document.getElementById('sqHistoryChips');
  if (!wrap || !chips) return;

  const hist = JSON.parse(localStorage.getItem(SQ_HISTORY_KEY) || '[]');
  if (hist.length === 0) {
    wrap.style.display = 'none';
    return;
  }
  
  wrap.style.display = 'flex';
  chips.innerHTML = hist.map(t => 
    `<span class="sq-history-chip" onclick="sqUseExample(this)">${t}</span>`
  ).join('');
}

function sqClearHistory() {
  localStorage.removeItem(SQ_HISTORY_KEY);
  sqRenderHistory();
}

// ================= ÖRNEKLER VE YARDIMCILAR =================
function sqToggleExamples() {
  const body = document.getElementById('sqExamplesBody');
  const arrow = document.getElementById('sqExamplesArrow');
  if (!body) return;
  
  if (body.classList.contains('active')) {
    body.classList.remove('active');
    if (arrow) arrow.style.transform = 'rotate(0deg)';
  } else {
    body.classList.add('active');
    if (arrow) arrow.style.transform = 'rotate(180deg)';
  }
}

function sqUseExample(el) {
  const text = el.innerText || el.textContent;
  const input = document.getElementById('sqInput');
  if (input) {
    input.value = text;
    sqSubmitQuery();
  }
}

// ─────────────────────────────────────────────────────────────────────
// EXPORT FONKSİYONLARI
// ─────────────────────────────────────────────────────────────────────
function sqBuildCSVData() {
  const headers = [
    'Sıra','Okul Adı','İlçe','Tür','Öğretim','Isınma','Bağımsız Bina','İlçe Merkezine Uzaklık',
    'Toplam Öğrenci','Erkek','Kız','Derslik','Şube','Atölye Sayısı','Özel Eğitim Sınıfı',
    'Devamsızlık (10+gün)','Disiplin',
    'Kitap Sayısı','Sayfa Sayısı',
    'Lisanslı Sporcu Toplam','Lisanslı Spor Branşları',
    'Yabancı Uyruklu Toplam','Yabancı Uyruk Ülkeleri',
    'Proje Sayısı','Ödül Sayısı',
    'Taşımalı Öğrenci','Yemek Hizmeti',
    'Kütüphane','Kütüphane Kitap','Konferans Salonu',
    'Engelli Rampası','Engelli Tuvaleti','Engelli Asansörü',
    'Bahçe Spor Alanı m²','LGS Mezun',
    'Kantin','Kantin Geliri TL','Kardeş Okul',
    'DYK Kursu Var','DYK Kurs Sayısı','Yaz Okulu Var','Yaz Okulu Kurs Sayısı',
    'Veli Faaliyet Sayısı','Katılan Veli Sayısı',
    'TBM Öğrenci','TBM Öğretmen','TBM Yardımcı Personel','TBM Veli'
  ];

  const rows = sqResults.map((r, i) => [
    i+1,
    r.okul_adi,
    r.ilce,
    r.okul_turu,
    r.ogretim_sekli,
    r.isinma_turu,
    r.bagimsiz_bina ? 'Evet' : 'Hayır',
    r.ogrenci_toplam,
    r.ogrenci_erkek,
    r.ogrenci_kiz,
    r.derslik_sayisi,
    r.sube_sayisi,
    r.devamsizlik?.toplam||0,
    r.disiplin?.toplam||0,
    r.kitap_okuma?.kitap_sayisi||0,
    r.kitap_okuma?.sayfa_sayisi||0,
    r.lisansli_sporcu_toplam,
    Object.entries(r.lisansli_sporcu||{}).map(([b,v])=>`${b}(${v.toplam})`).join('; '),
    r.yabanci_uyruklu_toplam,
    Object.entries(r.yabanci_uyruklu||{}).map(([u,v])=>`${u}(${v.toplam})`).join('; '),
    r.sosyal_etkinlik?.proje_sayisi||0,
    r.sosyal_etkinlik?.odul_sayisi||0,
    r.tasimali?.toplam||0,
    r.tasimali?.yemek_hizmeti ? 'Var' : 'Yok',
    r.kutuphane?.var ? 'Var' : 'Yok',
    r.kutuphane?.kitap_sayisi||0,
    r.konferans_salonu?.var ? `Var(${r.konferans_salonu.kapasite})` : 'Yok',
    r.engelli_rampasi ? 'Var' : 'Yok',
    r.engelli_tuvaleti ? 'Var' : 'Yok',
    r.engelli_asansoru?.var ? 'Var' : 'Yok',
    r.bahce_spor_alani_m2,
    r.lgs?.mezun_sayisi||'—',
    r.kantin_var ? 'Var' : 'Yok',
    r.kardes_okul || 'Yok',
    r.dyk_kursu_var ? 'Evet' : 'Hayır',
    r.dyk_kurs_sayisi || 0,
    r.yaz_okulu_var ? 'Evet' : 'Hayır',
    r.yaz_okulu_kurs_sayisi || 0,
    r.veli_faaliyet?.faaliyet_sayisi || 0,
    r.veli_faaliyet?.katilan_veli_sayisi || 0,
    r.tbm?.ogrenci_sayisi || 0,
    r.tbm?.ogretmen_sayisi || 0,
    r.tbm?.yardimci_personel_sayisi || 0,
    r.tbm?.veli_sayisi || 0
  ]);

  return { headers, rows };
}

// ─────────────────────────────────────────────────────────────────────
// HARİTA ENTEGRASYONU
// ─────────────────────────────────────────────────────────────────────
let sqMapInstance = null;
let sqMapMarkers = [];

function sqToggleMap() {
  const mc = document.getElementById('sqMapContainer');
  if (!mc) return;
  if (mc.style.display === 'none') {
    mc.style.display = 'block';
    setTimeout(() => {
      sqRenderMap();
      if (sqMapInstance) sqMapInstance.invalidateSize();
    }, 50);
  } else {
    mc.style.display = 'none';
  }
}

function sqRenderMap() {
  const mc = document.getElementById('sqMapContainer');
  if (!mc || mc.style.display === 'none') return;
  
  if (!sqMapInstance) {
    sqMapInstance = L.map('sqMapContainer').setView([37.8444, 27.8458], 9);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(sqMapInstance);
  }

  // Clear existing markers
  sqMapMarkers.forEach(m => sqMapInstance.removeLayer(m));
  sqMapMarkers = [];

  const bounds = [];
  sqResults.forEach(r => {
    if (r.enlem && r.boylam) {
      // Map school type to color icon
      let colorUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png';
      if(r.okul_turu === 'lise') colorUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png';
      if(r.okul_turu === 'ortaokul') colorUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png';
      if(r.okul_turu === 'okuloncesi') colorUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png';
      
      var customIcon = new L.Icon({
        iconUrl: colorUrl,
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });

      const marker = L.marker([r.enlem, r.boylam], {icon: customIcon}).addTo(sqMapInstance);
      marker.bindPopup(`
        <div style="font-family:Inter,sans-serif; text-align:center;">
          <h4 style="margin:0 0 5px 0; font-size:14px; color:var(--text-dark);">${r.okul_adi}</h4>
          <div style="font-size:12px; color:var(--text-light); margin-bottom:5px;">📍 ${r.ilce} - ${r.okul_turu.toUpperCase()}</div>
          <div style="display:inline-block; padding:3px 8px; background:#f0f9ff; color:#0284c7; border-radius:12px; font-weight:600; font-size:11px;">
            👥 Öğrenci: ${r.ogrenci_toplam}
          </div>
        </div>
      `);
      sqMapMarkers.push(marker);
      bounds.push([r.enlem, r.boylam]);
    }
  });

  if (bounds.length > 0) {
    sqMapInstance.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
  } else {
    sqMapInstance.setView([37.8444, 27.8458], 9);
  }
}

function sqExportCSV() {
  const { headers, rows } = sqBuildCSVData();
  const bom = '\uFEFF'; // UTF-8 BOM for Excel
  let csv = bom + headers.join(';') + '\n';
  for (const row of rows) {
    csv += row.map(v => `"${String(v||'').replace(/"/g,'""')}"`).join(';') + '\n';
  }
  sqDownloadFile('meb_sorgu_sonuclari.csv', 'text/csv;charset=utf-8;', csv);
}

function sqExportExcel() {
  // SheetJS yoksa CSV fallback
  const { headers, rows } = sqBuildCSVData();
  // TSV formatı Excel'de sorunsuz açılır
  const bom = '\uFEFF';
  let tsv = bom + headers.join('\t') + '\n';
  for (const row of rows) {
    tsv += row.join('\t') + '\n';
  }
  sqDownloadFile('meb_sorgu_sonuclari.xls', 'application/vnd.ms-excel', tsv);
}

function sqExportWord() {
  const { headers, rows } = sqBuildCSVData();
  const filterSummary = Object.entries(sqCurrentFilters)
    .filter(([,v]) => v !== null && v !== undefined)
    .map(([k,v]) => `• ${sqFilterLabel(k,v)}`)
    .join('\n');

  let tableRows = `<tr>${headers.map(h=>`<th style="background:#1e3a5f;color:#fff;padding:6px;border:1px solid #ccc;">${h}</th>`).join('')}</tr>`;
  for (const row of rows) {
    tableRows += `<tr>${row.map(v=>`<td style="padding:4px;border:1px solid #ccc;">${v}</td>`).join('')}</tr>`;
  }

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>MEB Sorgu Sonuçları</title></head><body>
<h1 style="color:#1e3a5f;">MEB Aydın İl — Okul Sorgulama Raporu</h1>
<p><strong>Tarih:</strong> ${new Date().toLocaleDateString('tr-TR')}</p>
<h3>Uygulanan Filtreler:</h3>
<pre>${filterSummary||'(Tüm kayıtlar)'}</pre>
<h3>Bulunan Okul Sayısı: ${sqResults.length}</h3>
<table style="border-collapse:collapse;width:100%;font-size:11px;">${tableRows}</table>
</body></html>`;

  sqDownloadFile('meb_sorgu_sonuclari.doc', 'application/msword', html);
}

async function sqExportPDF() {
  // Basit print-to-PDF
  const { headers, rows } = sqBuildCSVData();
  const filterSummary = Object.entries(sqCurrentFilters)
    .filter(([,v]) => v !== null && v !== undefined)
    .map(([k,v]) => `<li>${sqFilterLabel(k,v)}</li>`)
    .join('');

  let tableRows = `<tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr>`;
  for (const row of rows) {
    tableRows += `<tr>${row.map(v=>`<td>${v}</td>`).join('')}</tr>`;
  }

  const win = window.open('','_blank');
  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>MEB Sorgu Raporu</title>
<style>
  body{font-family:Arial,sans-serif;font-size:10px;margin:20px;}
  h1{color:#1e3a5f;font-size:16px;margin-bottom:4px;}
  h3{color:#1e3a5f;font-size:12px;}
  table{border-collapse:collapse;width:100%;margin-top:10px;}
  th{background:#1e3a5f;color:#fff;padding:4px;border:1px solid #aaa;font-size:8px;}
  td{padding:3px;border:1px solid #ccc;font-size:8px;}
  tr:nth-child(even){background:#f5f5f5;}
  @media print{body{margin:5mm;}}
</style></head><body>
<h1>🏫 MEB Aydın İl — Okul Sorgulama Raporu</h1>
<p>Tarih: ${new Date().toLocaleDateString('tr-TR')} | Bulunan Okul: <strong>${sqResults.length}</strong></p>
<h3>Filtreler:</h3>
<ul style="font-size:9px;">${filterSummary||'<li>Tüm kayıtlar</li>'}</ul>
<table>${tableRows}</table>
</body></html>`);
  win.document.close();
  setTimeout(() => { win.focus(); win.print(); }, 800);
}

function sqDownloadFile(filename, mime, content) {
  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────────────
// HIZLI FİLTRE BUTONLARI
// ─────────────────────────────────────────────────────────────────────
function sqQuickFilter(key, val) {
  sqCurrentFilters[key] = val;
  sqResults = sqApplyFilters(sqCurrentFilters);
  sqCurrentPage = 1;
  sqRenderChips();
  sqRenderResults();
}

// ─────────────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────────────
function initStudentQueryModule() {
  if (!window.STUDENT_DB) {
    console.warn('[SQ] Demo veri yüklenmedi!');
    return;
  }
  sqResults = [...window.STUDENT_DB];
  sqRenderChips();
  sqRenderResults();
  sqRenderHistory();

  const sqInput = document.getElementById('sqInput');
  if (sqInput) {
    sqInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sqSubmitQuery();
      }
    });
  }

  console.log(`[SQ] Modül başladı. ${sqResults.length} kayıt mevcut.`);
}

function sqRefreshDataAndRender() {
  sqResults = sqApplyFilters(sqCurrentFilters);
  sqRenderResults();
}
window.sqRefreshDataAndRender = sqRefreshDataAndRender;
