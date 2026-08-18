// İki ilçeyi yan yana karşılaştıran modül
// okul, öğrenci, öğretmen gibi metriklerde hangisi önde gösteriyorum

const COMPARE_ILCE_LIST = [
  'EFELER','NAZİLLİ','SÖKE','KUŞADASI','DİDİM','ÇİNE','GERMENCİK',
  'BOZDOĞAN','İNCİRLİOVA','KOÇARLI','KÖŞK','KUYUCAK','SULTANHİSAR',
  'YENİPAZAR','KARACASU','BUHARKENT','KARPUZLU'
];

// seçili ilçe ve yıl için tüm okul türlerinden toplamları çek
function getIlceCompareStats(ilce, year) {
  const types      = ['okuloncesi','ilkokul','ortaokul','lise'];
  const typeLabels = { okuloncesi:'Okul Öncesi', ilkokul:'İlkokul', ortaokul:'Ortaokul', lise:'Lise' };

  let total = { okul: 0, ogrenci: 0, ogretmen: 0, derslik: 0,
                erkek: 0, kiz: 0, ozel: 0, resmi: 0 };
  let byType = {};

  for (const t of types) {
    const items = (MEB_DATA[year]?.[t] || []).filter(i => ilceMatch(i['ilce'], ilce));
    let typeOkul = items.length;
    let typeOgr  = 0, typeOgt = 0, typeDrs = 0, typeErkek = 0, typeKiz = 0;

    for (const it of items) {
      typeOgr   += (it['ogrenci_toplam']  || 0);
      typeOgt   += (it['ogretmen_sayisi'] || 0);
      typeDrs   += (it['derslik_sayisi']  || 0);
      typeErkek += (it['ogrenci_erkek']   || 0);
      typeKiz   += (it['ogrenci_kiz']     || 0);
      total.ozel  += isOzelSchool(it) ? 1 : 0;
      total.resmi += isOzelSchool(it) ? 0 : 1;
    }

    total.okul     += typeOkul;
    total.ogrenci  += typeOgr;
    total.ogretmen += typeOgt;
    total.derslik  += typeDrs;
    total.erkek    += typeErkek;
    total.kiz      += typeKiz;

    byType[t] = {
      label: typeLabels[t], okul: typeOkul,
      ogrenci: typeOgr, ogretmen: typeOgt, derslik: typeDrs
    };
  }

  // öğretmen başına öğrenci ve kız yüzdesi
  const ogretmen_basi = total.ogretmen > 0 ?
    parseFloat((total.ogrenci / total.ogretmen).toFixed(1)) : 0;
  const kizPct = total.ogrenci > 0 ?
    Math.round((total.kiz / total.ogrenci) * 100) : 0;
  const ozelPct = total.okul > 0 ?
    Math.round((total.ozel / total.okul) * 100) : 0;

  return { ...total, byType, ogretmen_basi, kizPct, ozelPct };
}

function runComparison() {
  const i1El    = document.getElementById('compareIlce1');
  const i2El    = document.getElementById('compareIlce2');
  const yearEl  = document.getElementById('compareYear');
  const out     = document.getElementById('comparisonResult');

  if (!i1El || !i2El || !out) return;

  const ilce1 = i1El.value;
  const ilce2 = i2El.value;
  const year  = yearEl ? yearEl.value : '2021-2022';

  if (ilce1 === ilce2) {
    out.innerHTML = `<div class="compare-warning">⚠️ Lütfen iki farklı ilçe seçin.</div>`;
    return;
  }

  const s1 = getIlceCompareStats(ilce1, year);
  const s2 = getIlceCompareStats(ilce2, year);

  if (s1.okul === 0 && s2.okul === 0) {
    out.innerHTML = `<div class="compare-warning">⚠️ Seçilen ilçeler için yeterli veri bulunamadı.</div>`;
    return;
  }

  const metrics = [
    { key:'okul',          label:'Toplam Okul',            icon:'🏫' },
    { key:'ogrenci',       label:'Toplam Öğrenci',          icon:'👨‍🎓' },
    { key:'ogretmen',      label:'Toplam Öğretmen',         icon:'👩‍🏫' },
    { key:'derslik',       label:'Toplam Derslik',          icon:'🚪' },
    { key:'ogretmen_basi', label:'Öğrenci/Öğretmen Oranı', icon:'📊' },
    { key:'ozel',          label:'Özel Okul Sayısı',        icon:'🏢' },
    { key:'kizPct',        label:'Kız Öğrenci Yüzdesi',    icon:'👧', suffix:'%' }
  ];

  // önceki yıl verisi — trend okları için
  const otherYear = year === '2021-2022' ? '2020-2021' : '2021-2022';
  const s1prev = getIlceCompareStats(ilce1, otherYear);
  const s2prev = getIlceCompareStats(ilce2, otherYear);

  // artış mı düşüş mü olmuş
  function trendArrow(curr, prev) {
    if (!prev || prev === 0) return '';
    const delta = curr - prev;
    const pct   = Math.round((delta / prev) * 100);
    if (delta > 0) return `<span class="trend-up">▲${Math.abs(pct)}%</span>`;
    if (delta < 0) return `<span class="trend-down">▼${Math.abs(pct)}%</span>`;
    return `<span class="trend-neutral">→</span>`;
  }

  // büyük olan bar %100, küçük olan orantılı
  function compareBar(v1, v2) {
    const max = Math.max(v1, v2) || 1;
    const w1  = Math.round((v1 / max) * 100);
    const w2  = Math.round((v2 / max) * 100);
    const c1  = v1 >= v2 ? '#27ae60' : '#c0392b';
    const c2  = v2 >= v1 ? '#27ae60' : '#c0392b';
    return { w1, w2, c1, c2 };
  }

  let html = `
  <div class="compare-header-row">
    <div class="compare-col-label">📍 ${ilce1}</div>
    <div class="compare-center-label">Karşılaştırma — ${year}</div>
    <div class="compare-col-label">📍 ${ilce2}</div>
  </div>

  <div class="compare-metrics">`;

  for (const m of metrics) {
    const v1     = s1[m.key] || 0;
    const v2     = s2[m.key] || 0;
    const v1prev = s1prev[m.key] || 0;
    const v2prev = s2prev[m.key] || 0;
    const { w1, w2, c1, c2 } = compareBar(v1, v2);
    const suf = m.suffix || '';

    const winner1 = v1 > v2 ? '🏆' : '';
    const winner2 = v2 > v1 ? '🏆' : '';

    html += `
    <div class="compare-metric-row">
      <div class="cmp-val-cell left">
        <span class="cmp-trophy">${winner1}</span>
        <div class="cmp-number" style="color:${c1};">${v1.toLocaleString('tr-TR')}${suf}</div>
        <div class="cmp-trend">${trendArrow(v1, v1prev)}</div>
        <div class="cmp-bar-wrap left-bar">
          <div class="cmp-bar" style="width:${w1}%; background:${c1}; margin-left:auto;"></div>
        </div>
      </div>
      <div class="cmp-metric-label">
        <span class="cmp-icon">${m.icon}</span>
        <span class="cmp-text">${m.label}</span>
      </div>
      <div class="cmp-val-cell right">
        <div class="cmp-bar-wrap right-bar">
          <div class="cmp-bar" style="width:${w2}%; background:${c2};"></div>
        </div>
        <div class="cmp-number" style="color:${c2};">${v2.toLocaleString('tr-TR')}${suf}</div>
        <div class="cmp-trend">${trendArrow(v2, v2prev)}</div>
        <span class="cmp-trophy">${winner2}</span>
      </div>
    </div>`;
  }

  html += `</div>`;

  // okul türüne göre kırılım tablosu
  html += `
  <div class="compare-type-section">
    <h3>📚 Okul Türü Bazlı Karşılaştırma</h3>
    <table class="compare-type-table">
      <thead>
        <tr>
          <th>Tür</th>
          <th>${ilce1}<br/><small>Okul | Öğrenci</small></th>
          <th>${ilce2}<br/><small>Okul | Öğrenci</small></th>
          <th>Fark (Öğrenci)</th>
        </tr>
      </thead>
      <tbody>`;

  const types = ['okuloncesi','ilkokul','ortaokul','lise'];
  for (const t of types) {
    const t1 = s1.byType[t] || {};
    const t2 = s2.byType[t] || {};
    const diff = (t1.ogrenci||0) - (t2.ogrenci||0);
    const diffStr = diff > 0
      ? `<span style="color:#27ae60;">+${diff.toLocaleString('tr-TR')}</span>`
      : diff < 0
        ? `<span style="color:#c0392b;">${diff.toLocaleString('tr-TR')}</span>`
        : `<span style="color:#888;">Eşit</span>`;
    html += `<tr>
      <td><strong>${t1.label || t}</strong></td>
      <td>${(t1.okul||0)} okul | ${(t1.ogrenci||0).toLocaleString('tr-TR')}</td>
      <td>${(t2.okul||0)} okul | ${(t2.ogrenci||0).toLocaleString('tr-TR')}</td>
      <td>${diffStr}</td>
    </tr>`;
  }

  html += `</tbody></table></div>`;

  // öğrenci sayısına göre kazananı göster
  const winner = s1.ogrenci > s2.ogrenci ? ilce1 : s2.ogrenci > s1.ogrenci ? ilce2 : null;
  if (winner) {
    html += `<div class="compare-winner-card">
      🏆 <strong>${winner}</strong>, öğrenci sayısı bakımından öne çıkıyor.
      ${winner === ilce1
        ? `(${(s1.ogrenci - s2.ogrenci).toLocaleString('tr-TR')} öğrenci fazla)`
        : `(${(s2.ogrenci - s1.ogrenci).toLocaleString('tr-TR')} öğrenci fazla)`}
    </div>`;
  }

  out.innerHTML = html;
}
