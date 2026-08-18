// Gemini AI entegrasyonu
// Kullanıcı soru sorunca MEB verisini hazırlayıp API'ye gönderiyorum

// XSS koruması — kullanıcı girdisindeki HTML/script etiketlerini temizle
function sanitizeInput(str) {
  if (!str) return '';
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim()
    .substring(0, 500); // max 500 karakter
}

// key listesi, kotası dolarsa sıradakine geçiyor
// yeni key: aistudio.google.com
const GEMINI_KEYS = [
  'AIzaSyAJ4G-c49EEpFkckFRAjwx0xfmVLcehPVw',
];

const GEMINI_MODEL = 'gemini-2.0-flash'; // v1beta ile çalışıyor
let _keyIndex = 0;

function getGeminiURL() {
  const key = GEMINI_KEYS[_keyIndex % GEMINI_KEYS.length];
  return `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;
}

function rotateKey() {
  _keyIndex++;
  console.warn(`[AI] Key rotated → key #${(_keyIndex % GEMINI_KEYS.length) + 1}`);
}

// cache — aynı soruyu tekrar sormamak için
const _aiCache = new Map();
const CACHE_MAX = 40;

function cacheGet(query) {
  const key = query.trim().toLowerCase().replace(/\s+/g, ' ');
  return _aiCache.get(key) || null;
}

function cacheSet(query, response) {
  const key = query.trim().toLowerCase().replace(/\s+/g, ' ');
  if (_aiCache.size >= CACHE_MAX) {
    _aiCache.delete(_aiCache.keys().next().value);
  }
  _aiCache.set(key, response);
}

let aiModeEnabled = true;

function toggleAIMode() {
  aiModeEnabled = !aiModeEnabled;
  renderAIToggle();
}

// rozet ve butonu güncelle
function renderAIToggle() {
  const badge  = document.getElementById('aiModeBadge');
  const toggle = document.getElementById('aiModeToggleBtn');
  if (!badge || !toggle) return;

  if (aiModeEnabled) {
    badge.innerHTML  = '✨ Gemini AI Aktif';
    badge.className  = 'ai-mode-badge active';
    toggle.textContent = 'AI Kapat';
    toggle.className   = 'ai-toggle-btn off';
  } else {
    badge.innerHTML  = '⚙️ Klasik Mod';
    badge.className  = 'ai-mode-badge inactive';
    toggle.textContent = 'AI Aç';
    toggle.className   = 'ai-toggle-btn on';
  }
}

// API'ye ham JSON değil düz metin gönderiyorum, böyle daha iyi anlıyor
function extractMEBContext(query) {
  const ql   = normalizeText(query);
  const ilce = detectIlce(ql);
  const year = selectedYear && selectedYear !== 'all' ? selectedYear : '2021-2022';

  let ctx = `=== AYDIN İL MEB İSTATİSTİKLERİ (${year}) ===\n\n`;

  try {
    const stats = getSummaryStats(year);
    ctx += `İL GENELİ ÖZET:\n`;
    ctx += `• Toplam Okul: ${stats.total_okul}\n`;
    ctx += `• Toplam Öğrenci: ${Number(stats.total_ogrenci).toLocaleString('tr-TR')}\n`;
    ctx += `• Toplam Öğretmen: ${Number(stats.total_ogretmen).toLocaleString('tr-TR')}\n`;
    ctx += `• Toplam Derslik: ${Number(stats.total_derslik).toLocaleString('tr-TR')}\n`;
    ctx += `• Okul Öncesi Okul: ${stats.cnt_okuloncesi}\n`;
    ctx += `• İlkokul: ${stats.cnt_ilkokul}\n`;
    ctx += `• Ortaokul: ${stats.cnt_ortaokul}\n`;
    ctx += `• Lise: ${stats.cnt_lise}\n\n`;
  } catch (e) {}

  // ilçe adı geçmişse o ilçenin detayını da ekle
  if (ilce && ilce !== 'AYDIN') {
    ctx += `${ilce} İLÇESİ DETAYLARI:\n`;
    const types      = ['okuloncesi','ilkokul','ortaokul','lise'];
    const typeLabels = { okuloncesi:'Okul Öncesi', ilkokul:'İlkokul', ortaokul:'Ortaokul', lise:'Lise' };
    try {
      for (const t of types) {
        const items = (MEB_DATA[year]?.[t] || []).filter(item => ilceMatch(item['ilce'], ilce));
        if (items.length > 0) {
          let ogr = 0, ogt = 0, drs = 0;
          for (const it of items) {
            ogr += (it['ogrenci_toplam']  || 0);
            ogt += (it['ogretmen_sayisi'] || 0);
            drs += (it['derslik_sayisi']  || 0);
          }
          ctx += `• ${typeLabels[t]}: ${items.length} okul | ${ogr.toLocaleString('tr-TR')} öğrenci | ${ogt} öğretmen | ${drs} derslik\n`;
        }
      }
    } catch (e) {}
    ctx += '\n';
  }

  // tüm ilçelerin öğrenci toplamı — "en kalabalık ilçe?" soruları için lazım
  try {
    const ILCELER = ['EFELER','NAZİLLİ','SÖKE','KUŞADASI','DİDİM','ÇİNE','GERMENCİK',
                     'BOZDOĞAN','İNCİRLİOVA','KOÇARLI','KÖŞK','KUYUCAK','SULTANHİSAR',
                     'YENİPAZAR','KARACASU','BUHARKENT','KARPUZLU'];
    ctx += `İLÇE BAZLI TOPLAM ÖĞRENCİ (${year}):\n`;
    for (const il of ILCELER) {
      let ogr = 0;
      for (const t of ['okuloncesi','ilkokul','ortaokul','lise']) {
        const items = (MEB_DATA[year]?.[t] || []).filter(i => ilceMatch(i['ilce'], il));
        for (const it of items) ogr += (it['ogrenci_toplam'] || 0);
      }
      if (ogr > 0) ctx += `• ${il}: ${ogr.toLocaleString('tr-TR')} öğrenci\n`;
    }
  } catch (e) {}

  // Yüklenen PDF ve Word belgelerinin metinlerini ekle
  if (window.LOADED_DOCUMENTS && window.LOADED_DOCUMENTS.length > 0) {
    ctx += "\n=== KULLANICININ YÜKLEDİĞİ BELGELER (PDF/WORD) ===\n";
    window.LOADED_DOCUMENTS.forEach(doc => {
      ctx += `\n[Belge: ${doc.name}]\n`;
      ctx += `${doc.text}\n`;
    });
  }

  return ctx.substring(0, 25000); // token sınırı aşmasın (Gemini 2.0 Flash için limit arttırıldı)
}

async function queryGeminiAI(userQuestion) {
  // önce cache'e bak
  const cached = cacheGet(userQuestion);
  if (cached) {
    console.log('[AI] Cache hit');
    return cached;
  }

  const mebContext = extractMEBContext(userQuestion);

  const fullPrompt = `Sen Aydın İl Milli Eğitim Müdürlüğü'nün (MEM) yapay zeka destekli istatistik asistanısın.
Görevin: Eğitim istatistikleri ve kullanıcının yüklediği belgeler üzerine sorulan soruları Türkçe olarak, net ve anlaşılır şekilde yanıtlamak.

Kurallar:
- SADECE aşağıdaki MEB verisini ve kullanıcının yüklediği kurumsal belgeleri (varsa) kullan. Hayal etme, tahmin etme.
- Yüklenen belgelerde geçen bilgilere dayanarak soruları cevaplayabilirsin.
- Veri veya yüklenen belgede bilgi yoksa: "Bu veri elimde mevcut değil, ancak istatistik asistanından sorabilirsiniz." de.
- HTML formatı kullanabilirsin: <strong>, <br/>, <em>, sayıları vurgula.
- Tablolar yerine madde işaretleri ve bold kullan.
- Kısa, öz ol. Maksimum 400 kelime.

${mebContext}

Kullanıcı Sorusu: ${userQuestion}`;

  const requestBody = {
    contents: [{ parts: [{ text: fullPrompt }] }],
    generationConfig: {
      temperature:     0.2, // yaratıcılık değil doğruluk istiyorum
      maxOutputTokens: 900,
      topP:            0.85
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT',    threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH',   threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
    ]
  };

  const MAX_RETRIES = GEMINI_KEYS.length + 1;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    attempt++;
    const response = await fetch(getGeminiURL(), {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(requestBody)
    });

    if (response.status === 429 || response.status === 403) {
      const errData = await response.json().catch(() => ({}));
      const errMsg  = errData?.error?.message || '';
      const isQuota   = errMsg.includes('quota') || errMsg.includes('Quota') || response.status === 429;
      const isExpired = errMsg.includes('expired');

      if (isExpired) {
        rotateKey();
        if (attempt >= MAX_RETRIES) throw new Error('Tüm API key geçersiz. Lütfen yeni key alın.');
        continue;
      }

      if (isQuota) {
        // hata mesajından kaç sn bekleneceğini çekiyorum
        const retryMatch = errMsg.match(/retry in ([\d.]+)s/);
        const waitSec = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) + 2 : 62;

        if (GEMINI_KEYS.length > 1) {
          rotateKey();
          continue;
        }

        // tek key varsa geri sayım göster
        console.warn(`[AI] Rate limit — ${waitSec}s beklenecek...`);
        await showRetryCountdown(waitSec);
        continue;
      }

      throw new Error(errMsg || `HTTP ${response.status}`);
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('Gemini yanıt vermedi');
    }

    const candidate = data.candidates[0];
    if (candidate.finishReason === 'SAFETY') {
      throw new Error('İçerik güvenlik filtresi devreye girdi');
    }

    const result = candidate.content.parts[0].text || '';
    cacheSet(userQuestion, result);
    return result;
  }

  throw new Error('Maksimum deneme sayısına ulaşıldı.');
}

// rate limit geldiğinde ekranda geri sayım göster
// kullanıcı neden beklediğini anlasın
async function showRetryCountdown(seconds) {
  return new Promise(resolve => {
    const chatArea = document.getElementById('chatArea');
    const countEl  = document.createElement('div');
    countEl.className = 'message bot';
    countEl.id = 'ai-countdown-msg';
    countEl.innerHTML = `
      <div class="avatar">⏳</div>
      <div class="bubble" style="background:rgba(255,165,0,0.1); border:1px solid rgba(255,165,0,0.3);">
        <small style="color:#e67e22;">⚠️ Dakika limiti doldu. Otomatik tekrar deneniyor...</small><br/>
        <strong id="ai-countdown-num" style="font-size:22px; color:#e67e22;">${seconds}</strong>
        <span style="color:#888;"> saniye</span>
      </div>`;
    chatArea.appendChild(countEl);
    chatArea.scrollTop = chatArea.scrollHeight;

    let remaining = seconds;
    const interval = setInterval(() => {
      remaining--;
      const numEl = document.getElementById('ai-countdown-num');
      if (numEl) numEl.textContent = remaining;
      if (remaining <= 0) {
        clearInterval(interval);
        countEl.remove();
        resolve();
      }
    }, 1000);
  });
}

// Gemini markdown → HTML (** → bold, * → italic vs.)
function geminiTextToHTML(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g,     '<em>$1</em>')
    .replace(/^#{1,3}\s+(.+)$/gm, '<strong style="font-size:1.05em;">$1</strong>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g,   '<br/>')
    .replace(/•/g, '•');
}

// AI mesajı — normal bot mesajından farklı görünüyor
function addAIMessage(htmlContent) {
  const chatArea = document.getElementById('chatArea');
  const wc = chatArea.querySelector('.welcome-card');
  if (wc) wc.remove();

  const msg = document.createElement('div');
  msg.className = 'message bot ai-message';

  const avatar = document.createElement('div');
  avatar.className = 'avatar ai-avatar';
  avatar.innerHTML = '✨';

  const bubble = document.createElement('div');
  bubble.className = 'bubble ai-bubble';
  bubble.innerHTML = `
    <div class="ai-source-badge">✨ Gemini AI Yanıtı</div>
    ${htmlContent}
  `;

  msg.appendChild(avatar);
  msg.appendChild(bubble);
  chatArea.appendChild(msg);
  chatArea.scrollTop = chatArea.scrollHeight;
}

// AI açıksa Gemini'ye gönder, hata olursa kural tabanlı sisteme düş
async function submitQueryWithAI(query) {
  // kullanıcı girdisini temizle — HTML/script enjeksiyonuna karşı
  query = sanitizeInput(query);
  if (!query) return;
  addMessage('user', query);
  showTyping();

  if (aiModeEnabled) {
    try {
      await new Promise(r => setTimeout(r, 300));
      const rawText  = await queryGeminiAI(query);
      removeTyping();
      const htmlResp = geminiTextToHTML(rawText);
      addAIMessage(htmlResp);
    } catch (err) {
      console.warn('[AI] Gemini hatası, klasik moda geçildi:', err);
      await new Promise(r => setTimeout(r, 200));
      removeTyping();
      const fallback = processQuery(query);
      if (fallback) addMessage('bot', fallback);
      addMessage('bot',
        `<small style="color:var(--text-dim)">⚠️ Gemini AI geçici hata (${err.message}). Klasik sistem devreye girdi.</small>`
      );
    }
  } else {
    await new Promise(r => setTimeout(r, 350));
    removeTyping();
    const result = processQuery(query);
    if (result) addMessage('bot', result);
  }
}
