// LGS sınav sonuçları modülü
// ilçe bazlı ortalama puanlar, ders kırılımları, en başarılı okullar
//
// NOT: veriler temsili, gerçek MEB sınav verisiyle karıştırılmamalı

// ilçe bazlı LGS ortalamaları — 500 puan üzerinden, 4 ders × 125
const LGS_ILCE_DATA = {
  '2022-2023': {
    'EFELER':       { avg: 342, turkce: 89, matematik: 81, fen: 86, sosyal: 86, katilimci: 4820, ilk100: 18 },
    'NAZİLLİ':     { avg: 298, turkce: 78, matematik: 70, fen: 74, sosyal: 76, katilimci: 2640, ilk100: 5  },
    'SÖKE':         { avg: 305, turkce: 80, matematik: 72, fen: 76, sosyal: 77, katilimci: 2190, ilk100: 6  },
    'KUŞADASI':    { avg: 318, turkce: 84, matematik: 74, fen: 79, sosyal: 81, katilimci: 1870, ilk100: 7  },
    'DİDİM':       { avg: 284, turkce: 74, matematik: 66, fen: 70, sosyal: 74, katilimci: 980,  ilk100: 2  },
    'ÇİNE':        { avg: 271, turkce: 71, matematik: 62, fen: 68, sosyal: 70, katilimci: 760,  ilk100: 1  },
    'GERMENCİK':   { avg: 266, turkce: 70, matematik: 60, fen: 66, sosyal: 70, katilimci: 580,  ilk100: 1  },
    'BOZDOĞAN':    { avg: 252, turkce: 67, matematik: 55, fen: 62, sosyal: 68, katilimci: 340,  ilk100: 0  },
    'İNCİRLİOVA':  { avg: 279, turkce: 73, matematik: 64, fen: 69, sosyal: 73, katilimci: 720,  ilk100: 1  },
    'KOÇARLI':     { avg: 261, turkce: 68, matematik: 58, fen: 64, sosyal: 71, katilimci: 430,  ilk100: 0  },
    'KÖŞK':        { avg: 258, turkce: 68, matematik: 57, fen: 62, sosyal: 71, katilimci: 390,  ilk100: 0  },
    'KUYUCAK':     { avg: 247, turkce: 65, matematik: 54, fen: 59, sosyal: 69, katilimci: 280,  ilk100: 0  },
    'SULTANHİSAR': { avg: 256, turkce: 67, matematik: 56, fen: 62, sosyal: 71, katilimci: 350,  ilk100: 0  },
    'YENİPAZAR':   { avg: 245, turkce: 65, matematik: 52, fen: 58, sosyal: 70, katilimci: 220,  ilk100: 0  },
    'KARACASU':    { avg: 240, turkce: 63, matematik: 50, fen: 57, sosyal: 70, katilimci: 190,  ilk100: 0  },
    'BUHARKENT':   { avg: 235, turkce: 62, matematik: 48, fen: 55, sosyal: 70, katilimci: 150,  ilk100: 0  },
    'KARPUZLU':    { avg: 230, turkce: 61, matematik: 47, fen: 53, sosyal: 69, katilimci: 110,  ilk100: 0  }
  },
  '2021-2022': {
    'EFELER':       { avg: 335, turkce: 87, matematik: 79, fen: 84, sosyal: 85, katilimci: 4650, ilk100: 16 },
    'NAZİLLİ':     { avg: 291, turkce: 76, matematik: 68, fen: 72, sosyal: 75, katilimci: 2510, ilk100: 4  },
    'SÖKE':         { avg: 299, turkce: 79, matematik: 70, fen: 74, sosyal: 76, katilimci: 2080, ilk100: 5  },
    'KUŞADASI':    { avg: 311, turkce: 82, matematik: 72, fen: 77, sosyal: 80, katilimci: 1760, ilk100: 6  },
    'DİDİM':       { avg: 278, turkce: 73, matematik: 64, fen: 69, sosyal: 72, katilimci: 910,  ilk100: 1  },
    'ÇİNE':        { avg: 264, turkce: 69, matematik: 60, fen: 66, sosyal: 69, katilimci: 720,  ilk100: 1  },
    'GERMENCİK':   { avg: 259, turkce: 68, matematik: 58, fen: 64, sosyal: 69, katilimci: 550,  ilk100: 0  },
    'BOZDOĞAN':    { avg: 245, turkce: 65, matematik: 53, fen: 60, sosyal: 67, katilimci: 315,  ilk100: 0  },
    'İNCİRLİOVA':  { avg: 273, turkce: 72, matematik: 62, fen: 67, sosyal: 72, katilimci: 690,  ilk100: 1  },
    'KOÇARLI':     { avg: 254, turkce: 67, matematik: 56, fen: 62, sosyal: 69, katilimci: 410,  ilk100: 0  },
    'KÖŞK':        { avg: 251, turkce: 66, matematik: 55, fen: 60, sosyal: 70, katilimci: 370,  ilk100: 0  },
    'KUYUCAK':     { avg: 240, turkce: 63, matematik: 52, fen: 57, sosyal: 68, katilimci: 265,  ilk100: 0  },
    'SULTANHİSAR': { avg: 249, turkce: 65, matematik: 54, fen: 60, sosyal: 70, katilimci: 330,  ilk100: 0  },
    'YENİPAZAR':   { avg: 238, turkce: 63, matematik: 50, fen: 56, sosyal: 69, katilimci: 205,  ilk100: 0  },
    'KARACASU':    { avg: 233, turkce: 62, matematik: 48, fen: 55, sosyal: 68, katilimci: 178,  ilk100: 0  },
    'BUHARKENT':   { avg: 228, turkce: 60, matematik: 46, fen: 53, sosyal: 69, katilimci: 140,  ilk100: 0  },
    'KARPUZLU':    { avg: 223, turkce: 59, matematik: 45, fen: 51, sosyal: 68, katilimci: 102,  ilk100: 0  }
  }
};

// temsili okul listesi, ileride gerçek veriyle değiştirilecek
const TOP_SCHOOLS_LGS = [
  { okul: 'Efeler Anadolu Lisesi', ilce: 'EFELER',    avg: 478, rank: 1 },
  { okul: 'Aydın Fen Lisesi',       ilce: 'EFELER',    avg: 489, rank: 2 },
  { okul: 'Nazilli Anadolu Lisesi', ilce: 'NAZİLLİ',  avg: 441, rank: 3 },
  { okul: 'Kuşadası Anadolu Lisesi',ilce: 'KUŞADASI', avg: 422, rank: 4 },
  { okul: 'Söke Anadolu Lisesi',    ilce: 'SÖKE',      avg: 415, rank: 5 },
  { okul: 'Germencik Anadolu',      ilce: 'GERMENCİK', avg: 388, rank: 6 },
  { okul: 'Didim Anadolu Lisesi',   ilce: 'DİDİM',    avg: 371, rank: 7 }
];

// hepsini sırayla çiz
function renderExamModule() {
  renderExamOverview();
  renderExamRanking();
  renderTopSchools();
  renderSubjectRadar();
}

// üst özet kartlar — il ortalaması, en iyi/kötü ilçe, katılım sayıları
function renderExamOverview() {
  const year  = document.getElementById('examYearSelect')?.value || '2022-2023';
  const data  = LGS_ILCE_DATA[year] || {};
  const vals  = Object.values(data);
  if (vals.length === 0) return;

  const avgAll        = Math.round(vals.reduce((s, d) => s + d.avg, 0) / vals.length);
  const maxIlce       = Object.entries(data).sort((a,b) => b[1].avg - a[1].avg)[0];
  const minIlce       = Object.entries(data).sort((a,b) => a[1].avg - b[1].avg)[0];
  const totalKatilim  = vals.reduce((s, d) => s + d.katilimci, 0);
  const totalIlk100   = vals.reduce((s, d) => s + d.ilk100, 0);

  const container = document.getElementById('examOverview');
  if (!container) return;

  container.innerHTML = `
  <div class="exam-stat-grid">
    <div class="exam-stat-card blue">
      <div class="exam-stat-value">${avgAll}</div>
      <div class="exam-stat-label">İl Ortalaması</div>
      <div class="exam-stat-sub">${year} LGS (500 üzerinden)</div>
    </div>
    <div class="exam-stat-card green">
      <div class="exam-stat-value">🥇 ${maxIlce[0]}</div>
      <div class="exam-stat-label">En Yüksek İlçe</div>
      <div class="exam-stat-sub">${maxIlce[1].avg} puan ortalama</div>
    </div>
    <div class="exam-stat-card red">
      <div class="exam-stat-value">📍 ${minIlce[0]}</div>
      <div class="exam-stat-label">En Düşük İlçe</div>
      <div class="exam-stat-sub">${minIlce[1].avg} puan ortalama</div>
    </div>
    <div class="exam-stat-card amber">
      <div class="exam-stat-value">${totalKatilim.toLocaleString('tr-TR')}</div>
      <div class="exam-stat-label">Toplam Katılımcı</div>
      <div class="exam-stat-sub">İl Geneli 8. Sınıf</div>
    </div>
    <div class="exam-stat-card purple">
      <div class="exam-stat-value">${totalIlk100}</div>
      <div class="exam-stat-label">İlk 100'e Giren</div>
      <div class="exam-stat-sub">Türkiye Geneli</div>
    </div>
  </div>`;
}

// ilçe sıralaması — puana göre büyükten küçüğe, önceki yılla trend
function renderExamRanking() {
  const year      = document.getElementById('examYearSelect')?.value || '2022-2023';
  const prevYear  = year === '2022-2023' ? '2021-2022' : '2022-2023';
  const data      = LGS_ILCE_DATA[year] || {};
  const prevData  = LGS_ILCE_DATA[prevYear] || {};
  const container = document.getElementById('examRanking');
  if (!container) return;

  const sorted = Object.entries(data).sort((a, b) => b[1].avg - a[1].avg);
  const maxAvg = sorted[0]?.[1].avg || 1;

  let html = `<h3 class="exam-section-title">📊 İlçe LGS Sıralaması — ${year}</h3>
  <table class="exam-rank-table">
    <thead><tr>
      <th>#</th><th>İlçe</th><th>Ort. Puan</th>
      <th>Türkçe</th><th>Mat.</th><th>Fen</th><th>Sosyal</th>
      <th>Katılımcı</th><th>Trend</th><th>Bar</th>
    </tr></thead><tbody>`;

  sorted.forEach(([ilce, d], i) => {
    const prev   = prevData[ilce];
    const pct    = Math.round((d.avg / maxAvg) * 100);
    const medal  = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}`;
    const barClr = i < 3 ? '#c0392b' : i < 8 ? '#e67e22' : '#27ae60';

    let trend = '';
    if (prev) {
      const delta = d.avg - prev.avg;
      if (delta > 0) trend = `<span class="trend-up">▲${delta}</span>`;
      else if (delta < 0) trend = `<span class="trend-down">▼${Math.abs(delta)}</span>`;
      else trend = `<span class="trend-neutral">→</span>`;
    }

    html += `<tr>
      <td style="text-align:center; font-size:15px;">${medal}</td>
      <td><strong>${ilce}</strong></td>
      <td style="font-weight:700; color:${barClr};">${d.avg}</td>
      <td>${d.turkce}</td>
      <td>${d.matematik}</td>
      <td>${d.fen}</td>
      <td>${d.sosyal}</td>
      <td>${d.katilimci.toLocaleString('tr-TR')}</td>
      <td>${trend}</td>
      <td>
        <div class="heat-bar">
          <div class="heat-bar-fill" style="width:${pct}%; background:${barClr};"></div>
        </div>
      </td>
    </tr>`;
  });

  html += `</tbody></table>
    <p class="exam-disclaimer">⚠️ Veriler temsilidir. Gerçek MEB sınav verileriyle karşılaştırılmamalıdır.</p>`;

  container.innerHTML = html;
}

function renderTopSchools() {
  const container = document.getElementById('examTopSchools');
  if (!container) return;

  let html = `<h3 class="exam-section-title">🏆 LGS En Başarılı Okullar (Temsili)</h3>
  <div class="top-schools-grid">`;

  TOP_SCHOOLS_LGS.forEach((s, i) => {
    const medals = ['🥇','🥈','🥉'];
    const medal  = medals[i] || `#${i+1}`;
    const pct    = Math.round((s.avg / 500) * 100);
    html += `
    <div class="top-school-card">
      <div class="top-school-rank">${medal}</div>
      <div class="top-school-info">
        <div class="top-school-name">${s.okul}</div>
        <div class="top-school-ilce">📍 ${s.ilce}</div>
        <div class="top-school-score">
          <span style="font-size:20px; font-weight:700; color:#c0392b;">${s.avg}</span>
          <span style="color:#888; font-size:12px;"> / 500</span>
        </div>
        <div class="exam-mini-bar">
          <div style="width:${pct}%; background:linear-gradient(90deg,#c0392b,#e74c3c); height:6px; border-radius:3px;"></div>
        </div>
      </div>
    </div>`;
  });

  html += `</div>`;
  container.innerHTML = html;
}

// ders bazlı bar grafik — yüksek puan yeşil, düşük kırmızı
function renderSubjectBars(subject) {
  const year      = document.getElementById('examYearSelect')?.value || '2022-2023';
  const container = document.getElementById('examSubjectBars');
  if (!container) return;

  const data   = LGS_ILCE_DATA[year] || {};
  const labels = { turkce:'Türkçe', matematik:'Matematik', fen:'Fen', sosyal:'Sosyal Bilgiler' };
  const sorted = Object.entries(data).sort((a,b) => b[1][subject] - a[1][subject]);
  const max    = sorted[0]?.[1][subject] || 1;

  let html = `<h3 class="exam-section-title">📘 ${labels[subject]} — İlçe Sıralaması (${year})</h3>
  <div class="subject-bars-list">`;

  sorted.forEach(([ilce, d]) => {
    const val = d[subject];
    const pct = Math.round((val / max) * 100);
    const clr = pct >= 90 ? '#27ae60' : pct >= 70 ? '#e67e22' : '#c0392b';
    html += `
    <div class="subject-bar-row">
      <div class="subject-bar-label">${ilce}</div>
      <div class="subject-bar-track">
        <div class="subject-bar-fill" style="width:${pct}%; background:${clr};"></div>
      </div>
      <div class="subject-bar-val" style="color:${clr};">${val} <small>/ 125</small></div>
    </div>`;
  });

  html += `</div>`;
  container.innerHTML = html;
}

// sayfa açılırken matematik seçili gelsin
function renderSubjectRadar() {
  renderSubjectBars('matematik');
}

function selectExamSubject(subject) {
  renderSubjectBars(subject);
  document.querySelectorAll('.subject-btn').forEach(b => b.classList.remove('active'));
  const activeBtn = document.getElementById(`subjectBtn_${subject}`);
  if (activeBtn) activeBtn.classList.add('active');
}

function refreshExamModule() {
  renderExamOverview();
  renderExamRanking();
  renderSubjectBars(
    document.querySelector('.subject-btn.active')?.dataset?.subject || 'matematik'
  );
}
