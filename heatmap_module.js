// Leaflet + Leaflet.heat ile ilçe bazlı yoğunluk haritası
// öğrenci/öğretmen/derslik sayısına göre renk değişiyor

// ilçe merkez koordinatları — Google Maps'ten aldım
const ILCE_CENTERS = {
  'EFELER':      [37.849,  27.850],
  'NAZİLLİ':    [37.912,  28.324],
  'SÖKE':        [37.751,  27.404],
  'KUŞADASI':   [37.859,  27.267],
  'DİDİM':      [37.372,  27.266],
  'ÇİNE':       [37.612,  28.062],
  'GERMENCİK':  [37.874,  27.602],
  'BOZDOĞAN':   [37.672,  28.317],
  'İNCİRLİOVA': [37.852,  27.723],
  'KOÇARLI':    [37.761,  27.707],
  'KÖŞK':       [37.851,  28.051],
  'KUYUCAK':    [37.910,  28.459],
  'SULTANHİSAR':[37.887,  28.155],
  'YENİPAZAR':  [37.822,  28.195],
  'KARACASU':   [37.731,  28.606],
  'BUHARKENT':  [37.965,  28.743],
  'KARPUZLU':   [37.559,  27.836]
};

const ILCE_LIST = Object.keys(ILCE_CENTERS);

let heatMap        = null;
let heatLayer      = null;
let heatMarkers    = [];
let currentMetric  = 'ogrenci';
let currentHeatYear = '2021-2022';

// MEB_DATA'dan ilçe bazlı toplamları çek
function getIlceHeatStats(ilce, year) {
  const types = ['okuloncesi','ilkokul','ortaokul','lise'];
  let okul = 0, ogrenci = 0, ogretmen = 0, derslik = 0;

  for (const t of types) {
    const items = (MEB_DATA[year]?.[t] || []).filter(i => ilceMatch(i['ilce'], ilce));
    okul       += items.length;
    for (const it of items) {
      ogrenci  += (it['ogrenci_toplam']  || 0);
      ogretmen += (it['ogretmen_sayisi'] || 0);
      derslik  += (it['derslik_sayisi']  || 0);
    }
  }

  const ogretmen_basi = ogretmen > 0 ? Math.round(ogrenci / ogretmen) : 0;
  return { okul, ogrenci, ogretmen, derslik, ogretmen_basi };
}

// 0-1 arası normalize edilmiş heat noktaları oluştur
// etrafına da ufak noktalar ekle yoksa çok keskin görünüyor
function buildHeatPoints(metric, year) {
  const allStats = ILCE_LIST.map(ilce => ({
    ilce,
    coords: ILCE_CENTERS[ilce],
    stats:  getIlceHeatStats(ilce, year)
  }));

  const vals  = allStats.map(d => d.stats[metric] || 0);
  const min   = Math.min(...vals);
  const max   = Math.max(...vals);
  const range = max - min || 1;

  const points = [];
  for (const d of allStats) {
    const raw  = d.stats[metric] || 0;
    const norm = (raw - min) / range;
    const [lat, lng] = d.coords;
    const intensity  = Math.max(0.15, norm); // çok küçük de görünsün

    points.push([lat, lng, intensity]);
    for (let r = 0; r < 6; r++) {
      const dlat = (Math.random() - 0.5) * 0.08;
      const dlng = (Math.random() - 0.5) * 0.12;
      points.push([lat + dlat, lng + dlng, intensity * 0.6]);
    }
  }
  return points;
}

// haritayı ilk kez başlat — tekrar çağrılmasın diye başta kontrol var
function initHeatmap() {
  if (heatMap) return;

  heatMap = L.map('heatmapCanvas', {
    center:  [37.75, 28.0],
    zoom:    9,
    zoomControl: true
  });

  // OpenStreetMap — ücretsiz
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 14
  }).addTo(heatMap);

  drawHeatLayer();
  addDistrictMarkers();
}

function drawHeatLayer() {
  if (!heatMap) return;

  if (heatLayer) {
    heatMap.removeLayer(heatLayer);
  }

  const points = buildHeatPoints(currentMetric, currentHeatYear);

  // mavi = düşük, kırmızı = yüksek yoğunluk
  heatLayer = L.heatLayer(points, {
    radius:    45,
    blur:      30,
    maxZoom:   12,
    max:       1.0,
    gradient:  {
      0.0: '#0d47a1',
      0.3: '#1565c0',
      0.5: '#f57f17',
      0.7: '#e65100',
      1.0: '#b71c1c'
    }
  }).addTo(heatMap);
}

// her ilçeye tıklanabilir marker koy, popup'ta detay göster
function addDistrictMarkers() {
  heatMarkers.forEach(m => heatMap.removeLayer(m));
  heatMarkers = [];

  for (const ilce of ILCE_LIST) {
    const [lat, lng] = ILCE_CENTERS[ilce];
    const stats = getIlceHeatStats(ilce, currentHeatYear);

    const metricLabels = {
      ogrenci:      'Öğrenci',
      ogretmen:     'Öğretmen',
      derslik:      'Derslik',
      okul:         'Okul',
      ogretmen_basi:'Öğrenci/Öğretmen'
    };

    const metricVal = stats[currentMetric] || 0;
    const label     = metricLabels[currentMetric] || currentMetric;

    const marker = L.circleMarker([lat, lng], {
      radius:      10,
      fillColor:   '#c0392b',
      fillOpacity: 0.85,
      color:       '#fff',
      weight:      2
    }).addTo(heatMap);

    marker.bindPopup(`
      <div style="font-family:Inter,sans-serif; font-size:13px; min-width:200px;">
        <div style="font-weight:700; font-size:14px; color:#c0392b; margin-bottom:8px;">📍 ${ilce}</div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
          <div><span style="color:#888; font-size:11px;">Okul</span><br/><strong>${stats.okul}</strong></div>
          <div><span style="color:#888; font-size:11px;">Öğrenci</span><br/><strong>${stats.ogrenci.toLocaleString('tr-TR')}</strong></div>
          <div><span style="color:#888; font-size:11px;">Öğretmen</span><br/><strong>${stats.ogretmen}</strong></div>
          <div><span style="color:#888; font-size:11px;">Derslik</span><br/><strong>${stats.derslik}</strong></div>
          <div style="grid-column:1/-1"><span style="color:#888; font-size:11px;">Öğretmen Başına Öğrenci</span><br/><strong>${stats.ogretmen_basi}</strong></div>
        </div>
        <div style="margin-top:8px; padding:6px 10px; background:#f0f0f0; border-radius:6px; font-size:12px;">
          🎯 <strong>${label}:</strong> ${metricVal.toLocaleString('tr-TR')}
        </div>
      </div>
    `);

    heatMarkers.push(marker);
  }
}

// kullanıcı metrik veya yıl değiştirince burası çalışıyor
function updateHeatmap() {
  if (!heatMap) return; // Harita henüz ilklendirilmemişse güncelleme yapma

  const metricEl = document.getElementById('heatMetricSelect');
  const yearEl   = document.getElementById('heatYearSelect');

  if (metricEl) currentMetric   = metricEl.value;
  if (yearEl)   currentHeatYear = yearEl.value;

  const metricLabels = {
    ogrenci:      'Öğrenci Yoğunluğu',
    ogretmen:     'Öğretmen Yoğunluğu',
    derslik:      'Derslik Yoğunluğu',
    okul:         'Okul Sayısı Yoğunluğu',
    ogretmen_basi:'Öğrenci/Öğretmen Oranı'
  };
  const titleEl = document.getElementById('heatmapTitle');
  if (titleEl) titleEl.textContent = metricLabels[currentMetric] || 'Yoğunluk';

  drawHeatLayer();
  addDistrictMarkers();
  renderHeatRanking();
}

function renderHeatRanking() {
  const container = document.getElementById('heatRankingTable');
  if (!container) return;

  const metricLabels = {
    ogrenci:      'Öğrenci Sayısı',
    ogretmen:     'Öğretmen Sayısı',
    derslik:      'Derslik Sayısı',
    okul:         'Okul Sayısı',
    ogretmen_basi:'Öğrenci/Öğretmen'
  };

  const data = ILCE_LIST.map(ilce => ({
    ilce,
    stats: getIlceHeatStats(ilce, currentHeatYear)
  })).sort((a, b) => (b.stats[currentMetric]||0) - (a.stats[currentMetric]||0));

  const label  = metricLabels[currentMetric] || currentMetric;
  const maxVal = data[0]?.stats[currentMetric] || 1;

  let html = `<table class="heat-rank-table">
    <thead><tr>
      <th>#</th><th>İlçe</th><th>${label}</th><th>Bar</th>
    </tr></thead><tbody>`;

  data.forEach((d, i) => {
    const val   = d.stats[currentMetric] || 0;
    const pct   = Math.round((val / maxVal) * 100);
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}`;
    const color = i < 3 ? '#c0392b' : i < 8 ? '#e67e22' : '#27ae60';

    html += `<tr>
      <td style="text-align:center;">${medal}</td>
      <td><strong>${d.ilce}</strong></td>
      <td style="color:${color}; font-weight:600;">${val.toLocaleString('tr-TR')}</td>
      <td>
        <div class="heat-bar">
          <div class="heat-bar-fill" style="width:${pct}%; background:${color};"></div>
        </div>
      </td>
    </tr>`;
  });

  html += '</tbody></table>';
  container.innerHTML = html;
}

// sekme içindeyken harita boyutu bozulabiliyor, bunu düzeltir
function invalidateHeatmap() {
  if (heatMap) {
    setTimeout(() => heatMap.invalidateSize(), 300);
  }
}
