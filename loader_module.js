/**
 * MEB Aydın — Belge Okuma ve Canlı Veri Senkronizasyon Modülü
 * Drag & Drop, File Parser (XLSX, Mammoth, PDF.js) ve LocalStorage Kalıcılık Yönetimi.
 */

// Global değişkenler
window.LOADED_DOCUMENTS = []; // Yüklenen belgelerin metin/data içerikleri
window.IMPORTED_SCHOOL_DATA = []; // Excel'den gelen ek okullar

document.addEventListener('DOMContentLoaded', () => {
  initFileUploadUI();
  loadSavedDocuments();
});

// ─────────────────────────────────────────────────────────────────────
// FILE UPLOAD UI & DRAG-DROP
// ─────────────────────────────────────────────────────────────────────
function initFileUploadUI() {
  const zone = document.getElementById('fileUploadZone');
  const input = document.getElementById('fileInput');

  if (!zone || !input) return;

  // Tıklayarak dosya seçme
  zone.addEventListener('click', () => input.click());

  // Sürükle bırak olayları
  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('dragover');
  });

  zone.addEventListener('dragleave', () => {
    zone.classList.remove('dragover');
  });

  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  });

  input.addEventListener('change', () => {
    if (input.files.length > 0) {
      handleFiles(input.files);
    }
  });
}

// Birden fazla dosyayı sırayla işle
async function handleFiles(files) {
  const errorDisplay = document.getElementById('uploadErrorDisplay');
  if (errorDisplay) {
    errorDisplay.style.display = 'none';
    errorDisplay.textContent = '';
  }

  for (const file of files) {
    try {
      await parseFile(file);
    } catch (err) {
      console.error('[Loader] Dosya işlenirken hata oluştu:', err);
      if (errorDisplay) {
        errorDisplay.style.display = 'block';
        errorDisplay.innerHTML = `<strong>⚠️ Hata (${file.name}):</strong><br/>${err.message}`;
      } else {
        alert(`"${file.name}" yüklenirken hata oluştu: ` + err.message);
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
// PARSERS (Excel, Word, PDF)
// ─────────────────────────────────────────────────────────────────────
function parseFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const extension = file.name.split('.').pop().toLowerCase();

    // Excel Parser
    if (extension === 'xlsx' || extension === 'xls' || extension === 'csv') {
      if (extension === 'csv') {
        const textReader = new FileReader();
        textReader.onload = function(evt) {
          try {
            let csvText = evt.target.result;
            // Noktalı virgül sayısını ve virgül sayısını kontrol et
            const semiColons = (csvText.match(/;/g) || []).length;
            const commas = (csvText.match(/,/g) || []).length;
            if (semiColons > commas) {
              csvText = csvText.replace(/;/g, ',');
            }
            
            const workbook = XLSX.read(csvText, { type: 'string' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const json = XLSX.utils.sheet_to_json(worksheet);

            processExcelData(json, file.name);
            saveDocumentMetadata(file.name, file.size, 'excel', json);
            resolve();
          } catch (err) {
            reject(err);
          }
        };
        textReader.onerror = () => reject(new Error('Dosya okunamadı.'));
        textReader.readAsText(file, 'utf-8');
      } else {
        reader.onload = function(e) {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const json = XLSX.utils.sheet_to_json(worksheet);

            processExcelData(json, file.name);
            saveDocumentMetadata(file.name, file.size, 'excel', json);
            resolve();
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = () => reject(new Error('Dosya okunamadı.'));
        reader.readAsArrayBuffer(file);
      }
    } 
    // Word (.docx) Parser
    else if (extension === 'docx') {
      reader.onload = function(e) {
        mammoth.extractRawText({ arrayBuffer: e.target.result })
          .then(result => {
            const text = result.value; // ayıklanan düz metin
            processDocumentText(text, file.name, 'word');
            saveDocumentMetadata(file.name, file.size, 'word', text);
            resolve();
          })
          .catch(err => reject(err));
      };
      reader.onerror = () => reject(new Error('Dosya okunamadı.'));
      reader.readAsArrayBuffer(file);
    } 
    // PDF (.pdf) Parser
    else if (extension === 'pdf') {
      reader.onload = async function(e) {
        try {
          const typedarray = new Uint8Array(e.target.result);
          const pdf = await pdfjsLib.getDocument(typedarray).promise;
          let text = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            text += pageText + '\n';
          }
          processDocumentText(text, file.name, 'pdf');
          saveDocumentMetadata(file.name, file.size, 'pdf', text);
          resolve();
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Dosya okunamadı.'));
      reader.readAsArrayBuffer(file);
    } else {
      reject(new Error('Desteklenmeyen dosya formatı. Lütfen Excel, Word veya PDF yükleyin.'));
    }
  });
}

// ─────────────────────────────────────────────────────────────────────
// VERİ İŞLEME VE BİRLEŞTİRME
// ─────────────────────────────────────────────────────────────────────

// Yüklenen Excel verisini STUDENT_DB ile senkronize et
function processExcelData(rows, fileName) {
  console.log(`[Loader] Excel'den ${rows.length} satır okundu.`);
  
  // Sütun eşleştirme yardımı
  const mappedSchools = rows.map((row, idx) => {
    // Esnek sütun bulucu (büyük/küçük harf ve boşluk duyarsız)
    const findVal = (keys) => {
      for (const k of Object.keys(row)) {
        const cleanK = k.toLowerCase().replace(/[\s_\n\t\-]+/g, '');
        if (keys.some(key => cleanK.includes(key.toLowerCase().replace(/[\s_\n\t\-]+/g, '')))) {
          return row[k];
        }
      }
      return null;
    };

    const kurum_kodu = String(findVal(['kurum kodu', 'kod', 'id']) || (900000 + idx));
    const okul_adi = String(findVal(['okul adi', 'kurum adi', 'okul', 'ad']) || `İsimsiz Okul - ${kurum_kodu}`);
    const ilce = String(findVal(['ilce', 'ilçe']) || 'EFELER').toUpperCase();
    const ogrenci_toplam = Number(findVal(['ogrenci toplam', 'öğrenci sayısı', 'ogrenci sayisi', 'öğrenci', 'ogrenci']) || 0);
    const ogretmen_sayisi = Number(findVal(['ogretmen sayisi', 'öğretmen sayısı', 'öğretmen', 'ogretmen']) || 0);
    const derslik_sayisi = Number(findVal(['derslik sayisi', 'derslik sayısı', 'derslik']) || 0);
    
    // Varsayılan bir okul formatı oluştur (student_data_demo.js şablonuna uygun)
    return {
      kurum_kodu,
      okul_adi,
      ilce,
      okul_turu: detectSchoolTypeFromText(okul_adi),
      yil: '2021-2022',
      telefon: '0256 000 00 00',
      email: 'okul@meb.k12.tr',
      enlem: 37.8444 + (Math.random() * 0.1 - 0.05), // Rastgele Aydın koordinatı
      boylam: 27.8458 + (Math.random() * 0.1 - 0.05),
      ogretim_sekli: 'Normal',
      ilce_merkezi_uzaklik_km: 5,
      isinma_turu: 'Doğalgaz',
      konum_turu: 'İlçe Merkezi',
      bagimsiz_bina: true,
      risk_analizi_yapildi: true,
      okul_tasiti: false,
      ogretmen_sayisi,
      ogrenci_toplam,
      ogrenci_erkek: Math.floor(ogrenci_toplam / 2),
      ogrenci_kiz: Math.ceil(ogrenci_toplam / 2),
      derslik_sayisi,
      sube_sayisi: Math.ceil(ogrenci_toplam / 30) || 1,
      atolye_sayisi: 0,
      ozel_egitim_sinif: 0,
      bahce_spor_alani_m2: 500,
      kutuphane: { var: true, kitap_sayisi: 100 },
      konferans_salonu: { var: false, kapasite: 0 },
      toplanti_salonu: { var: false, kapasite: 0 },
      oyun_bahcesi: true,
      engelli_rampasi: true,
      engelli_tuvaleti: true,
      engelli_asansoru: { var: false, aktif: false },
      tasimali: { aktif: false, toplam: 0, yemek_hizmeti: false },
      devamsizlik: { toplam: 0, sinif_bazli: {} },
      disiplin: { toplam: 0, sinif_bazli: {} },
      kitap_okuma: { kitap_sayisi: 10, sayfa_sayisi: 1000 },
      lisansli_sporcu: {},
      lisansli_sporcu_toplam: 0,
      yabanci_uyruklu: {},
      yabanci_uyruklu_toplam: 0,
      sosyal_etkinlik: { proje_sayisi: 0, projeler: [], odul_sayisi: 0 },
      lgs: null,
      kantin_var: false,
      kantin_geliri_tl: 0,
      dyk_kursu_var: false,
      dyk_kurs_sayisi: 0,
      yaz_okulu_var: false,
      yaz_okulu_kurs_sayisi: 0,
      veli_faaliyet: { faaliyet_sayisi: 0, katilan_veli_sayisi: 0 },
      tbm: { ogrenci_sayisi: 0, ogretmen_sayisi: 0 },
      kardes_okul: null
    };
  });

  // Eklenen okulları global veritabanına entegre et
  window.IMPORTED_SCHOOL_DATA = window.IMPORTED_SCHOOL_DATA.filter(s => s._sourceFile !== fileName); // Önceki kopyaları temizle
  mappedSchools.forEach(s => s._sourceFile = fileName);
  window.IMPORTED_SCHOOL_DATA.push(...mappedSchools);

  syncGlobalDatabase();
}

// PDF veya Word'den gelen metinleri sakla
function processDocumentText(text, fileName, type) {
  console.log(`[Loader] Metin belgesi okundu: ${fileName} (${text.length} karakter).`);
  
  // Önceki varsa sil
  window.LOADED_DOCUMENTS = window.LOADED_DOCUMENTS.filter(doc => doc.name !== fileName);
  
  window.LOADED_DOCUMENTS.push({
    name: fileName,
    type: type,
    text: text
  });

  console.log(`[Loader] Toplam yüklenen metin belgesi sayısı: ${window.LOADED_DOCUMENTS.length}`);
}

// Global veritabanını orijinal veri + yüklenen Excel verisiyle birleştir
function syncGlobalDatabase() {
  const originalDB = window.STUDENT_DB_ORIGINAL || [...(window.STUDENT_DB || [])];
  
  // İlk çalıştırmada orijinal yedeği alalım
  if (!window.STUDENT_DB_ORIGINAL) {
    window.STUDENT_DB_ORIGINAL = originalDB;
  }

  // Orijinal veritabanı ile yüklenen Excel verisini birleştir (Kurum Kodu çakışmalarında yükleneni öncelikli yap)
  const combined = [...window.IMPORTED_SCHOOL_DATA];
  
  originalDB.forEach(orig => {
    // Eğer yüklenen Excel verisinde aynı kurum kodlu okul yoksa ekle
    if (!combined.some(s => s.kurum_kodu === orig.kurum_kodu)) {
      combined.push(orig);
    }
  });

  window.STUDENT_DB = combined;

  // MEB_DATA (AI Asistanı ve harita için kullanılan ana nesne) güncellenmeli
  updateMebDataGlobal(combined);

  // Arayüzleri canlı güncelle
  triggerUIUpdate();
}

// Okul adına göre tür belirle
function detectSchoolTypeFromText(name) {
  const n = name.toLowerCase();
  if (n.includes('anaokul') || n.includes('kreş') || n.includes('oncesi')) return 'okuloncesi';
  if (n.includes('ilkokul')) return 'ilkokul';
  if (n.includes('ortaokul')) return 'ortaokul';
  if (n.includes('lise') || n.includes('lisesi') || n.includes('mtal')) return 'lise';
  return 'ilkokul';
}

// meb_data_REAL_FINAL.js içindeki MEB_DATA nesnesini günceller
function updateMebDataGlobal(studentList) {
  if (!window.MEB_DATA) return;

  const yr = "2021-2022"; // Güncellemeleri varsayılan yıla enjekte et
  if (!window.MEB_DATA[yr]) window.MEB_DATA[yr] = { okuloncesi:[], ilkokul:[], ortaokul:[], lise:[], genel:[] };

  // Kategorilere göre temizleyip yeniden dolduralım
  window.MEB_DATA[yr].okuloncesi = [];
  window.MEB_DATA[yr].ilkokul = [];
  window.MEB_DATA[yr].ortaokul = [];
  window.MEB_DATA[yr].lise = [];

  studentList.forEach(s => {
    const item = {
      okul_turu: s.okul_turu === 'okuloncesi' ? 'Okul Öncesi' : s.okul_turu === 'ilkokul' ? 'İlkokul' : s.okul_turu === 'ortaokul' ? 'Ortaokul' : 'Lise',
      ilce: s.ilce,
      kurum_kodu: s.kurum_kodu,
      derslik_sayisi: s.derslik_sayisi,
      sube_sayisi: s.sube_sayisi,
      ogretmen_sayisi: s.ogretmen_sayisi,
      ogrenci_toplam: s.ogrenci_toplam,
      ogrenci_erkek: s.ogrenci_erkek,
      ogrenci_kiz: s.ogrenci_kiz,
      resmi_ozel: s.okul_adi.toUpperCase().includes('ÖZEL') ? 'Özel' : 'Resmi',
      okul_adi: s.okul_adi,
      isinma_durumu: s.isinma_turu,
      yakit_turu: s.isinma_turu === 'Doğalgaz' ? 'Doğalgaz' : 'Kömür',
      telefon: s.telefon
    };
    
    window.MEB_DATA[yr][s.okul_turu].push(item);
  });
}

// ─────────────────────────────────────────────────────────────────────
// ARAYÜZÜ CANLI YENİLEME TETİKLEYİCİLERİ
// ─────────────────────────────────────────────────────────────────────
function triggerUIUpdate() {
  console.log('[Loader] Arayüz yenileniyor...');

  // 1. Okul Sorgulama Sonuçlarını Güncelle (2. görseldeki alan)
  if (typeof window.sqRefreshDataAndRender === 'function') {
    window.sqRefreshDataAndRender();
  }

  // 2. Haritayı Güncelle (Eğer harita sekmesindeysek)
  if (typeof updateHeatmap === 'function') {
    updateHeatmap();
  }
}

// ─────────────────────────────────────────────────────────────────────
// LOCALSTORAGE KALICILIK YÖNETİMİ
// ─────────────────────────────────────────────────────────────────────
function saveDocumentMetadata(name, size, type, content) {
  let saved = JSON.parse(localStorage.getItem('uploaded_docs_meta') || '[]');
  
  // Önceki varsa sil
  saved = saved.filter(d => d.name !== name);
  
  saved.push({
    name: name,
    size: size,
    type: type,
    uploadedAt: new Date().toISOString()
  });

  localStorage.setItem('uploaded_docs_meta', JSON.stringify(saved));
  
  // İçerikleri de kaydet
  try {
    localStorage.setItem(`doc_content_${name}`, JSON.stringify(content));
  } catch (e) {
    console.warn('[Loader] Büyük dosya içeriği localStorage limitini aştı, IndexedDB veya geçici hafızada saklanacak.', e);
  }

  renderUploadedFilesList();
}

function loadSavedDocuments() {
  const saved = JSON.parse(localStorage.getItem('uploaded_docs_meta') || '[]');
  
  saved.forEach(doc => {
    try {
      const contentRaw = localStorage.getItem(`doc_content_${doc.name}`);
      if (contentRaw) {
        const content = JSON.parse(contentRaw);
        if (doc.type === 'excel') {
          processExcelData(content, doc.name);
        } else {
          processDocumentText(content, doc.name, doc.type);
        }
      }
    } catch (e) {
      console.warn(`[Loader] "${doc.name}" yüklenirken hata oluştu:`, e);
    }
  });

  renderUploadedFilesList();
}

function deleteUploadedFile(name) {
  // Global dizilerden sil
  window.IMPORTED_SCHOOL_DATA = window.IMPORTED_SCHOOL_DATA.filter(s => s._sourceFile !== name);
  window.LOADED_DOCUMENTS = window.LOADED_DOCUMENTS.filter(doc => doc.name !== name);

  // LocalStorage'dan sil
  let saved = JSON.parse(localStorage.getItem('uploaded_docs_meta') || '[]');
  saved = saved.filter(d => d.name !== name);
  localStorage.setItem('uploaded_docs_meta', JSON.stringify(saved));
  localStorage.removeItem(`doc_content_${name}`);

  // Orijinal veritabanını senkronize et
  syncGlobalDatabase();

  // Arayüz listesini yenile
  renderUploadedFilesList();
}

function renderUploadedFilesList() {
  const list = document.getElementById('uploadedFilesList');
  if (!list) return;

  const saved = JSON.parse(localStorage.getItem('uploaded_docs_meta') || '[]');

  if (saved.length === 0) {
    list.innerHTML = `<div class="no-files-yet">Henüz belge yüklenmedi.</div>`;
    return;
  }

  const typeIcons = { excel: '📊', word: '📝', pdf: '🔴' };
  
  list.innerHTML = saved.map(doc => {
    const sizeKB = (doc.size / 1024).toFixed(1);
    const safeName = doc.name.replace(/'/g, "\\'");
    return `
      <div class="uploaded-file-item ${doc.type}">
        <span class="file-type-icon">${typeIcons[doc.type] || '📄'}</span>
        <div class="file-details">
          <span class="file-name" title="${doc.name}">${doc.name}</span>
          <span class="file-size">${sizeKB} KB</span>
        </div>
        <button class="delete-file-btn" onclick="deleteUploadedFile('${safeName}')" title="Dosyayı Sil">
          ✕
        </button>
      </div>
    `;
  }).join('');
}

// ─────────────────────────────────────────────────────────────────────
// ÖRNEK EXCEL ŞABLONU OLUŞTURMA VE İNDİRME
// ─────────────────────────────────────────────────────────────────────
function downloadExcelTemplate() {
  // Örnek başlıklar
  const headers = [
    ['Kurum Kodu', 'Okul Adi', 'Ilce', 'Ogrenci Toplam', 'Ogretmen Sayisi', 'Derslik Sayisi'],
    ['700101', 'Efeler Deneme İlkokulu', 'EFELER', 320, 15, 12],
    ['700102', 'Nazilli Pilot Ortaokulu', 'NAZİLLİ', 450, 24, 18],
    ['700103', 'Kuşadası Teknik Lisesi', 'KUŞADASI', 620, 35, 20]
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(headers);
  XLSX.utils.book_append_sheet(wb, ws, 'MEB Şablon');
  
  // Excel dosyasını yaz ve indir
  XLSX.writeFile(wb, 'MEB_Okul_Yukleme_Sablonu.xlsx');
}

// Fonksiyonları global kapsama bağla
window.deleteUploadedFile = deleteUploadedFile;
window.downloadExcelTemplate = downloadExcelTemplate;
