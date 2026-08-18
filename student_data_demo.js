/**
 * MEB Aydın İl — Demo Öğrenci Okul Verisi
 * Videoda gösterilen tüm kriterleri kapsar:
 *   - Kurum bilgileri (ısınma, konum, bağımsız bina, taşıt, risk analizi)
 *   - Fiziksel alanlar (kütüphane, konferans salonu, spor alanı, erişilebilirlik)
 *   - Taşımalı eğitim (neden, yemek, erkek/kız sayısı)
 *   - Devamsızlık (sınıf bazlı)
 *   - Sosyal etkinlik (proje sayısı, türü, ödüller)
 *   - Disiplin durumu (sınıf bazlı)
 *   - LGS kazanma
 *   - Lisanslı sporcu (branş bazlı)
 *   - Yabancı uyruklu öğrenci (ülke bazlı)
 *   - Kitap okuma (kitap sayısı + sayfa sayısı)
 *
 * NOT: Bu veriler gerçek e-Okul/MEBBİS verisi değil, sistem demosu için
 * istatistiksel olarak tutarlı üretilmiş sentetik verilerdir.
 */

// =====================================================================
// SPOR BRANŞLARI — Lisanslı sporcu sorgularında kullanılır
// =====================================================================
const SPOR_BRANCLAR = [
  'Basketbol','Futbol','Voleybol','Satranç','Yüzme','Atletizm',
  'Tenis','Badminton','Masa Tenisi','Güreş','Judo','Karate',
  'Taekwondo','Okçuluk','Bisiklet','Jimnastik','Hentbol','Kürek'
];

// =====================================================================
// YABANCI UYRUK ÜLKELERİ
// =====================================================================
const YABANCI_ULKELER = [
  'Suriye','Afganistan','Irak','İran','Özbekistan',
  'Azerbaycan','Kazakistan','Kırgızistan','Türkmenistan','Somali',
  'Pakistan','Filistin','Mısır','Libya','Arnavutluk'
];

// =====================================================================
// LGS YERLEŞİM TÜRLERİ
// =====================================================================
const LGS_OKULLAR_SINAV = ['Fen Lisesi','Sosyal Bilimler Lisesi','Anadolu Lisesi','AİHL','MTAL'];
const LGS_OKULLAR_SINAVSIZ = ['Spor Lisesi','Güzel Sanatlar Lisesi','Anadolu Lisesi','AİHL','MTAL','Çıraklık'];

// =====================================================================
// İLÇE VE OKUL LİSTELERİ
// =====================================================================
const ILCE_OKUL_MAP = {
  'EFELER': {
    okuloncesi: ['Atatürk Anaokulu','Cumhuriyet Anaokulu','Efeler Anaokulu','İnci Anaokulu','Gazi Anaokulu'],
    ilkokul:    ['Atatürk İlkokulu','Cumhuriyet İlkokulu','İsmet İnönü İlkokulu','Gazi İlkokulu','Adnan Menderes İlkokulu','Barbaros İlkokulu','Mithatpaşa İlkokulu','Kemer İlkokulu'],
    ortaokul:   ['Atatürk Ortaokulu','Cumhuriyet Ortaokulu','Efeler Ortaokulu','Adnan Menderes Ortaokulu','Özgür Ortaokulu','Ramazan Taş Ortaokulu'],
    lise:       ['Aydın Lisesi','Aydın Anadolu Lisesi','Aydın Fen Lisesi','Atatürk Anadolu Lisesi','Adnan Menderes Lisesi']
  },
  'NAZİLLİ': {
    okuloncesi: ['Nazilli Anaokulu','Nazilli Papatya Anaokulu','Nazilli Yıldız Anaokulu'],
    ilkokul:    ['Nazilli Gazi İlkokulu','Nasif Çoban İlkokulu','İstiklal İlkokulu','Hürriyet İlkokulu','Çakırbeyli İlkokulu'],
    ortaokul:   ['Nazilli Cumhuriyet Ortaokulu','Nazilli Atatürk Ortaokulu','İsmet İnönü Ortaokulu','Tevfikiye Ortaokulu'],
    lise:       ['Nazilli Lisesi','Nazilli Anadolu Lisesi','Nazilli İHL','Nazilli MTAL']
  },
  'SÖKE': {
    okuloncesi: ['Söke Anaokulu','Söke Papatya Anaokulu'],
    ilkokul:    ['Söke Gazi İlkokulu','Söke İnönü İlkokulu','Söke Cumhuriyet İlkokulu','Söke Hürriyet İlkokulu'],
    ortaokul:   ['Söke Cumhuriyet Ortaokulu','Söke Atatürk Ortaokulu','Söke İnönü Ortaokulu'],
    lise:       ['Söke Anadolu Lisesi','Söke Lisesi','Söke MTAL']
  },
  'KUŞADASI': {
    okuloncesi: ['Kuşadası Anaokulu'],
    ilkokul:    ['Kuşadası İlkokulu','Mahmut Esat Bozkurt İlkokulu'],
    ortaokul:   ['Kuşadası Ortaokulu','Belkent Ortaokulu'],
    lise:       ['Kuşadası Lisesi','Kuşadası MTAL']
  },
  'DİDİM': {
    okuloncesi: ['Didim Anaokulu'],
    ilkokul:    ['Didim İlkokulu','Altınkum İlkokulu'],
    ortaokul:   ['Didim Atatürk Ortaokulu','Didim Cumhuriyet Ortaokulu'],
    lise:       ['Didim Anadolu Lisesi','Didim MTAL']
  },
  'ÇİNE': {
    okuloncesi: ['Çine Anaokulu'],
    ilkokul:    ['Çine İlkokulu','Çine Gazi İlkokulu'],
    ortaokul:   ['Çine Atatürk Ortaokulu','Çine Cumhuriyet Ortaokulu'],
    lise:       ['Çine Anadolu Lisesi']
  },
  'GERMENCİK': {
    okuloncesi: ['Germencik Anaokulu'],
    ilkokul:    ['Germencik İlkokulu','Germencik Cumhuriyet İlkokulu'],
    ortaokul:   ['Germencik Ortaokulu'],
    lise:       ['Germencik Anadolu Lisesi']
  },
  'BOZDOĞAN': {
    okuloncesi: ['Bozdoğan Anaokulu'],
    ilkokul:    ['Bozdoğan İlkokulu','Bozdoğan Cumhuriyet İlkokulu'],
    ortaokul:   ['Bozdoğan Ortaokulu'],
    lise:       ['Bozdoğan Anadolu Lisesi']
  },
  'İNCİRLİOVA': {
    okuloncesi: ['İncirliova Anaokulu'],
    ilkokul:    ['İncirliova İlkokulu','İncirliova Cumhuriyet İlkokulu'],
    ortaokul:   ['İncirliova Ortaokulu','İncirliova Atatürk Ortaokulu'],
    lise:       ['İncirliova Anadolu Lisesi']
  },
  'KOÇARLI': {
    okuloncesi: ['Koçarlı Anaokulu'],
    ilkokul:    ['Koçarlı İlkokulu'],
    ortaokul:   ['Koçarlı Ortaokulu'],
    lise:       ['Koçarlı Anadolu Lisesi']
  },
  'KÖŞK': {
    okuloncesi: ['Köşk Anaokulu'],
    ilkokul:    ['Köşk İlkokulu'],
    ortaokul:   ['Köşk Ortaokulu'],
    lise:       ['Köşk Anadolu Lisesi']
  },
  'KUYUCAK': {
    okuloncesi: ['Kuyucak Anaokulu'],
    ilkokul:    ['Kuyucak İlkokulu'],
    ortaokul:   ['Kuyucak Ortaokulu'],
    lise:       ['Kuyucak Anadolu Lisesi']
  },
  'SULTANHİSAR': {
    okuloncesi: ['Sultanhisar Anaokulu'],
    ilkokul:    ['Sultanhisar İlkokulu'],
    ortaokul:   ['Sultanhisar Ortaokulu'],
    lise:       ['Sultanhisar Anadolu Lisesi']
  },
  'YENİPAZAR': {
    okuloncesi: ['Yenipazar Anaokulu'],
    ilkokul:    ['Yenipazar İlkokulu'],
    ortaokul:   ['Yenipazar Ortaokulu'],
    lise:       ['Yenipazar Anadolu Lisesi']
  },
  'KARACASU': {
    okuloncesi: ['Karacasu Anaokulu'],
    ilkokul:    ['Karacasu İlkokulu'],
    ortaokul:   ['Karacasu Ortaokulu'],
    lise:       ['Karacasu Anadolu Lisesi']
  },
  'BUHARKENT': {
    okuloncesi: ['Buharkent Anaokulu'],
    ilkokul:    ['Buharkent İlkokulu'],
    ortaokul:   ['Buharkent Ortaokulu'],
    lise:       ['Buharkent Anadolu Lisesi']
  },
  'KARPUZLU': {
    okuloncesi: ['Karpuzlu Anaokulu'],
    ilkokul:    ['Karpuzlu İlkokulu'],
    ortaokul:   ['Karpuzlu Ortaokulu'],
    lise:       ['Karpuzlu Anadolu Lisesi']
  }
};

const ILCE_COORDS = {
  'EFELER': [37.8444, 27.8458],
  'NAZİLLİ': [37.9147, 28.3225],
  'SÖKE': [37.7523, 27.4042],
  'KUŞADASI': [37.8579, 27.2610],
  'DİDİM': [37.3820, 27.2608],
  'ÇİNE': [37.6111, 28.0617],
  'İNCİRLİOVA': [37.8481, 27.7289],
  'KARACASU': [37.7333, 28.6053],
  'BOZDOĞAN': [37.6719, 28.3189],
  'KUYUCAK': [37.9172, 28.4686],
  'KÖŞK': [37.8542, 28.0519],
  'YENİPAZAR': [37.8228, 28.1969],
  'SULTANHİSAR': [37.8872, 28.1561],
  'BUHARKENT': [37.9547, 28.7353],
  'GERMENCİK': [37.8683, 27.5956],
  'KOÇARLI': [37.7303, 27.7011],
  'KARPUZLU': [37.5872, 27.7553]
};

// =====================================================================
// RASTGELE YARDIMCI FONKSİYONLAR
// =====================================================================
function rng(seed) {
  // Basit deterministik PRNG (Linear Congruential Generator)
  let s = seed;
  return function() {
    s = (s * 1664525 + 1013904223) & 0xFFFFFFFF;
    return (s >>> 0) / 0xFFFFFFFF;
  };
}

function pick(arr, rand) { return arr[Math.floor(rand() * arr.length)]; }
function randInt(min, max, rand) { return Math.floor(rand() * (max - min + 1)) + min; }
function randBool(prob, rand) { return rand() < prob; }

// =====================================================================
// DEMO OKUL VERİSİ ÜRETME
// =====================================================================
function buildSchoolRecord(ilce, tur, okulAdi, kurum_kodu, rand) {
  const isLise      = tur === 'lise';
  const isOrtaokul  = tur === 'ortaokul';
  const isIlkokul   = tur === 'ilkokul';
  const isOkulOncesi = tur === 'okuloncesi';

  // Harita koordinatları (İlçe merkezine +/- 0.05 sapma)
  const baseCoord = ILCE_COORDS[ilce] || [37.8444, 27.8458];
  const enlem  = baseCoord[0] + (rand() * 0.1 - 0.05);
  const boylam = baseCoord[1] + (rand() * 0.1 - 0.05);

  // Öğrenci sayıları (okul boyutuna göre değişiyor)
  const ogrenciHavuzu = isOkulOncesi
    ? [20,30,40,50,60,80,100,120]
    : [80,120,180,240,320,420,560,720];
  const baseOgrenci   = pick(ogrenciHavuzu, rand);
  const ogrenci_erkek = Math.floor(baseOgrenci * (0.45 + rand() * 0.1));
  const ogrenci_kiz   = baseOgrenci - ogrenci_erkek;

  // Öğretmen sayısı — okul türüne göre makul aralık
  const ogretmen_sayisi = isOkulOncesi
    ? randInt(2, 6, rand)
    : isIlkokul
      ? randInt(6, 18, rand)
      : isOrtaokul
        ? randInt(10, 30, rand)
        : randInt(15, 60, rand); // lise

  // Sınıflar
  let siniflar = [];
  if (isOkulOncesi) siniflar = ['hazırlık','anaokul'];
  if (isIlkokul)    siniflar = [1,2,3,4];
  if (isOrtaokul)   siniflar = [5,6,7,8];
  if (isLise)       siniflar = [9,10,11,12];

  // Devamsızlık (10+ gün olan öğrenci sayısı, sınıf bazlı)
  const devamsizlik_sinif = {};
  for (const s of siniflar) {
    devamsizlik_sinif[s] = randInt(1, Math.floor(baseOgrenci * 0.08 / siniflar.length) + 3, rand);
  }
  const devamsizlik_toplam = Object.values(devamsizlik_sinif).reduce((a,b)=>a+b,0);

  // Disiplin (sınıf bazlı)
  const disiplin_sinif = {};
  for (const s of siniflar) {
    disiplin_sinif[s] = randInt(0, Math.floor(baseOgrenci * 0.03 / siniflar.length) + 2, rand);
  }
  const disiplin_toplam = Object.values(disiplin_sinif).reduce((a,b)=>a+b,0);

  // Kitap okuma
  const kitap_sayi = randInt(50, 800, rand);
  const sayfa_sayi = kitap_sayi * randInt(180, 280, rand);

  // Lisanslı sporcu — branş bazlı
  const lisansli_sporcu = {};
  const sporBranchCount = randInt(1, 5, rand);
  const secilenBranslar = [];
  for (let i = 0; i < sporBranchCount; i++) {
    const br = pick(SPOR_BRANCLAR, rand);
    if (!secilenBranslar.includes(br)) secilenBranslar.push(br);
  }
  for (const br of secilenBranslar) {
    const e = randInt(1, 15, rand);
    const k = randInt(0, 8, rand);
    lisansli_sporcu[br] = { erkek: e, kiz: k, toplam: e + k };
  }
  const lisansli_sporcu_toplam = Object.values(lisansli_sporcu).reduce((s,v)=>s+v.toplam,0);

  // Yabancı uyruklu öğrenci — ülke bazlı
  const yabanci_uyruklu = {};
  const yabanciOgr = randBool(0.6, rand) ? randInt(1, Math.floor(baseOgrenci * 0.05) + 2, rand) : 0;
  if (yabanciOgr > 0) {
    const ulkeSayisi = Math.min(randInt(1, 3, rand), yabanciOgr);
    let kalan = yabanciOgr;
    for (let i = 0; i < ulkeSayisi; i++) {
      const ulke = pick(YABANCI_ULKELER, rand);
      if (!yabanci_uyruklu[ulke]) {
        const sayi = (i === ulkeSayisi - 1) ? kalan : Math.ceil(kalan / 2);
        kalan -= sayi;
        const e = Math.floor(sayi * (0.4 + rand() * 0.2));
        const k = sayi - e;
        yabanci_uyruklu[ulke] = { erkek: e, kiz: k, toplam: sayi };
      }
    }
  }
  const yabanci_toplam = Object.values(yabanci_uyruklu).reduce((s,v)=>s+v.toplam,0);

  // Taşımalı eğitim
  const tasimali = randBool(0.45, rand);
  const tasimali_erkek = tasimali ? randInt(5, Math.floor(baseOgrenci * 0.15), rand) : 0;
  const tasimali_kiz   = tasimali ? randInt(5, Math.floor(baseOgrenci * 0.15), rand) : 0;
  const tasimali_toplam = tasimali_erkek + tasimali_kiz;
  const tasimali_nedenler = ['yerleşim yerinde okul yok','özel eğitim','mevsimlik göç'];
  const tasimali_neden = tasimali ? pick(tasimali_nedenler, rand) : null;
  const yemek_hizmeti = tasimali && randBool(0.7, rand);
  const yemek_ogrenci = yemek_hizmeti ? randInt(tasimali_toplam, tasimali_toplam + randInt(20,80,rand), rand) : 0;

  // Sosyal etkinlik / projeler
  const proje_sayisi = randInt(0, 6, rand);
  const projeler = [];
  const projeTurleri = ['yerel','ulusal','uluslararası'];
  for (let i = 0; i < proje_sayisi; i++) {
    projeler.push({
      ad: `Proje ${i+1} — ${okulAdi.split(' ')[0]}`,
      tur: pick(projeTurleri, rand),
      odul: randBool(0.25, rand) ? '2. Ödül' : null
    });
  }
  const odul_sayisi = projeler.filter(p=>p.odul).length;

  // LGS (sadece ortaokul için)
  let lgs = null;
  if (isOrtaokul) {
    const mezun = randInt(30, 120, rand);
    const sinav = {};
    const sinavsiz = {};
    for (const ok of LGS_OKULLAR_SINAV)    sinav[ok]    = randInt(0, 10, rand);
    for (const ok of LGS_OKULLAR_SINAVSIZ) sinavsiz[ok] = randInt(0, 8, rand);
    lgs = { mezun_sayisi: mezun, sinavli: sinav, sinavsiz: sinavsiz };
  }

  // İletişim bilgileri
  const alanKodu = '0256';
  const dahiliNo = String(randInt(2100000, 2999999, rand));
  const telefon  = `${alanKodu} ${dahiliNo.slice(0,3)} ${dahiliNo.slice(3,5)} ${dahiliNo.slice(5)}`;
  const emailAdi = okulAdi
    .toLowerCase()
    .replace(/[İı]/g,'i').replace(/[Ğğ]/g,'g').replace(/[Üü]/g,'u')
    .replace(/[Şş]/g,'s').replace(/[Öö]/g,'o').replace(/[Çç]/g,'c')
    .replace(/[^a-z0-9]/g,'_').replace(/_+/g,'_').replace(/^_|_$/g,'');
  const email = `${emailAdi}@meb.k12.tr`;

  // Fiziksel ve kurum bilgileri
  const isinma_turleri  = ['Doğalgaz','Kömür','Fuel-Oil','Klima','Jeotermal'];
  const konum_turleri   = ['Merkez Mahalle','Köy','Belde','İlçe Merkezi','Sanayi Bölgesi'];
  const ogretim_tipleri = isOkulOncesi ? ['Tam Gün','Yarım Gün'] : ['Normal','İkili'];

  return {
    kurum_kodu,
    okul_adi:    okulAdi,
    ilce,
    okul_turu:   tur,
    yil:         '2021-2022',

    // --- İLETİŞİM ---
    telefon,
    email,

    // --- KOORDİNATLAR ---
    enlem: Number(enlem.toFixed(5)),
    boylam: Number(boylam.toFixed(5)),

    // --- KURUM GENEL ---
    ogretim_sekli:           pick(ogretim_tipleri, rand),
    ilce_merkezi_uzaklik_km: randInt(0, isOkulOncesi ? 20 : 45, rand),
    isinma_turu:             pick(isinma_turleri, rand),
    konum_turu:              pick(konum_turleri, rand),
    bagimsiz_bina:           randBool(0.78, rand),
    risk_analizi_yapildi:    randBool(0.6, rand),
    okul_tasiti:             isOkulOncesi ? false : randBool(0.35, rand),

    // --- PERSONEL ---
    ogretmen_sayisi,

    // --- ÖĞRENCİ SAYILARI ---
    ogrenci_toplam: baseOgrenci,
    ogrenci_erkek,
    ogrenci_kiz,

    // --- DERSLIK & ŞUBE ---
    derslik_sayisi: randInt(4, 28, rand),
    sube_sayisi:    randInt(4, 20, rand),
    atolye_sayisi:  isLise ? randInt(0, 8, rand) : 0,
    ozel_egitim_sinif: randInt(0, 3, rand),

    // --- FİZİKSEL ALANLAR ---
    bahce_spor_alani_m2: randInt(200, 3000, rand),
    kutuphane: {
      var: randBool(0.72, rand),
      kitap_sayisi: randBool(0.72, rand) ? randInt(300, 5000, rand) : 0
    },
    konferans_salonu: {
      var: randBool(0.4, rand),
      kapasite: randBool(0.4, rand) ? randInt(50, 300, rand) : 0
    },
    toplanti_salonu: {
      var: randBool(0.55, rand),
      kapasite: randBool(0.55, rand) ? randInt(20, 80, rand) : 0
    },
    oyun_bahcesi: randBool(0.60, rand),

    // --- ERİŞİLEBİLİRLİK ---
    engelli_rampasi:  randBool(0.55, rand),
    engelli_tuvaleti: randBool(0.50, rand),
    engelli_asansoru: { var: randBool(0.25, rand), aktif: randBool(0.8, rand) },

    // --- TAŞIMALI EĞİTİM ---
    tasimali: {
      aktif: tasimali,
      erkek: tasimali_erkek,
      kiz:   tasimali_kiz,
      toplam: tasimali_toplam,
      neden: tasimali_neden,
      yemek_hizmeti,
      yemek_ogrenci_sayisi: yemek_ogrenci
    },

    // --- DEVAMSIZLIK ---
    devamsizlik: {
      sinif_bazli: devamsizlik_sinif,  // 10+ gün olan öğrenci sayısı
      toplam: devamsizlik_toplam
    },

    // --- DİSİPLİN ---
    disiplin: {
      sinif_bazli: disiplin_sinif,
      toplam: disiplin_toplam
    },

    // --- KİTAP OKUMA ---
    kitap_okuma: {
      kitap_sayisi: kitap_sayi,
      sayfa_sayisi: sayfa_sayi
    },

    // --- LİSANSLI SPORCU ---
    lisansli_sporcu,
    lisansli_sporcu_toplam,

    // --- YABANCI UYRUKLU ---
    yabanci_uyruklu,
    yabanci_uyruklu_toplam: yabanci_toplam,

    // --- SOSYAL ETKİNLİK ---
    sosyal_etkinlik: {
      proje_sayisi,
      projeler,
      odul_sayisi
    },

    // --- LGS ---
    lgs,

    // --- KANTİN ---
    kantin_var:       randBool(isOkulOncesi ? 0.3 : 0.70, rand),
    kantin_geliri_tl: randBool(0.70, rand) ? randInt(5000, 120000, rand) : 0,

    // --- DYK KURSU (anaokulu için her zaman false) ---
    dyk_kursu_var:   isOkulOncesi ? false : randBool(0.55, rand),
    dyk_kurs_sayisi: isOkulOncesi ? 0 : (randBool(0.55, rand) ? randInt(1, 8, rand) : 0),

    // --- YAZ OKULU ---
    yaz_okulu_var:   isOkulOncesi ? false : randBool(0.30, rand),
    yaz_okulu_kurs_sayisi: (isOkulOncesi || !randBool(0.30, rand)) ? 0 : randInt(1, 5, rand),

    // --- VELİYE YÖNELİK FAALİYETLER ---
    veli_faaliyet: {
      faaliyet_sayisi:     randInt(0, 6, rand),   // kurs, seminer, eğitim, proje vb.
      katilan_veli_sayisi: randInt(10, Math.floor(baseOgrenci * 0.8) + 20, rand)
    },

    // --- TBM PROGRAMI (Türkiye Bağımlılıkla Mücadele) ---
    tbm: {
      ogrenci_sayisi:          randInt(0, Math.floor(baseOgrenci * 0.6), rand),
      ogretmen_sayisi:         randInt(0, ogretmen_sayisi, rand),
      yardimci_personel_sayisi: randInt(0, 5, rand),
      veli_sayisi:             randInt(0, Math.floor(baseOgrenci * 0.3), rand)
    },

    // --- ULUSLARARASI KARDEŞ OKUL ---
    kardes_okul: randBool(0.15, rand)
      ? pick(['Sophia Primary School (Yunanistan)','Al-Nour School (Katar)',
               'Yıldırım Beyazıt Gymnasium (Almanya)','Atina İlkokulu (Yunanistan)',
               'Özbekistan Türk Okulu (Taşkent)','Berlin Türk Maarif Okulu (Almanya)',
               'Lefkoşa Atatürk Lisesi (KKTC)','Tiflis Türk Okulu (Gürcistan)'], rand)
      : null
  };
}

// =====================================================================
// TÜM OKUL KAYITLARINI OLUŞTUR
// =====================================================================
(function buildStudentDB() {
  const rand = rng(20240416); // sabit seed → her yüklemede aynı veri
  const records = [];
  let kurum_kodu = 700001;

  for (const [ilce, okullar] of Object.entries(ILCE_OKUL_MAP)) {
    for (const [tur, okulListesi] of Object.entries(okullar)) {
      for (const okulAdi of okulListesi) {
        records.push(buildSchoolRecord(ilce, tur, okulAdi, String(kurum_kodu++), rand));
      }
    }
  }

  // Global olarak ata — student_query_module.js bu değişkeni kullanır
  window.STUDENT_DB = records;
  console.log(`[Demo] ${records.length} okul kaydı yüklendi.`);
})();
