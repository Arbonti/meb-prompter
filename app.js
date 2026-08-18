/**
 * MEB Aydın İl İstatistik Asistanı - Query Engine
 * Gemini AI Destekli + Türkçe anahtar kelime tabanlı akıllı sorgulama sistemi
 */

// ============================================================
// STATE
// ============================================================
let selectedYear = "2021-2022"; // "2021-2022" | "2020-2021" | "all"

// ============================================================
// INIT
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  // Year button clicks
  document.querySelectorAll(".year-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".year-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedYear = btn.dataset.year;
      document.getElementById("selectedYearLabel").textContent =
        selectedYear === "all" ? "Tüm Yıllar" : selectedYear;
    });
  });

  // Quick query buttons
  document.querySelectorAll(".quick-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      submitQuery(btn.dataset.query);
    });
  });

  // Enter key
  document.getElementById("userInput").addEventListener("keydown", e => {
    if (e.key === "Enter") handleSend();
  });

  // Tab switching
  document.querySelectorAll(".nav-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.tab;
      document.querySelectorAll(".nav-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      // All area IDs
      const allAreas = [
        "chatArea","analysisArea","emergencyArea","videoArea",
        "heatmapArea","comparisonArea","examArea","studentqueryArea"
      ];

      // Hide all areas
      allAreas.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove("active");
      });
      document.querySelector(".input-area").style.display = "none";
      document.getElementById("chatFiltersBox").style.display = "none";

      if (target === "chat") {
        document.getElementById("chatArea").classList.add("active");
        document.querySelector(".input-area").style.display = "block";
        document.getElementById("chatFiltersBox").style.display = "block";

      } else if (target === "heatmap") {
        document.getElementById("heatmapArea").classList.add("active");
        setTimeout(() => {
          initHeatmap();
          invalidateHeatmap();
          renderHeatRanking();
        }, 300);

      } else if (target === "comparison") {
        document.getElementById("comparisonArea").classList.add("active");

      } else if (target === "exam") {
        document.getElementById("examArea").classList.add("active");
        renderExamModule();

      } else if (target === "analysis") {
        document.getElementById("analysisArea").classList.add("active");
        setTimeout(() => { initAnalysisMap(); if (analysisMap) analysisMap.invalidateSize(); }, 300);

      } else if (target === "emergency") {
        document.getElementById("emergencyArea").classList.add("active");

      } else if (target === "video") {
        document.getElementById("videoArea").classList.add("active");
        if (!animator) initAnimator();

      } else if (target === "studentquery") {
        document.getElementById("studentqueryArea").classList.add("active");
        // İlk açılışta modulu başlat
        if (typeof initStudentQueryModule === 'function' && !window._sqInited) {
          window._sqInited = true;
          initStudentQueryModule();
        }
      }
    });
  });

  // Init AI toggle UI
  if (typeof renderAIToggle === 'function') renderAIToggle();
});

function handleSend() {
  const input = document.getElementById("userInput");
  const query = input.value.trim();
  if (!query) return;
  input.value = "";
  submitQuery(query);
}

function sendExample(el) {
  submitQuery(el.textContent);
}

// ============================================================
// CHAT UI HELPERS
// ============================================================
function addMessage(role, content) {
  const chatArea = document.getElementById("chatArea");
  // Remove welcome card if present
  const wc = chatArea.querySelector(".welcome-card");
  if (wc) wc.remove();

  const msg = document.createElement("div");
  msg.className = `message ${role}`;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = role === "user" ? "👤" : "🤖";

  const bubble = document.createElement("div");
  bubble.className = "bubble";

  if (typeof content === "string") {
    bubble.innerHTML = content;
  } else {
    bubble.appendChild(content);
  }

  msg.appendChild(avatar);
  msg.appendChild(bubble);
  chatArea.appendChild(msg);
  chatArea.scrollTop = chatArea.scrollHeight;
  return bubble;
}

function showTyping() {
  const chatArea = document.getElementById("chatArea");
  const wc = chatArea.querySelector(".welcome-card");
  if (wc) wc.remove();

  const msg = document.createElement("div");
  msg.className = "message bot";
  msg.id = "typingMsg";

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = "🤖";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.innerHTML = `<div class="typing-indicator">
    <div class="typing-dot"></div>
    <div class="typing-dot"></div>
    <div class="typing-dot"></div>
  </div>`;

  msg.appendChild(avatar);
  msg.appendChild(bubble);
  chatArea.appendChild(msg);
  chatArea.scrollTop = chatArea.scrollHeight;
}

function removeTyping() {
  const t = document.getElementById("typingMsg");
  if (t) t.remove();
}

// ============================================================
// SUBMIT QUERY  — routes through Gemini AI when enabled
// ============================================================
async function submitQuery(query) {
  // Ensure chat tab is visible
  const chatArea = document.getElementById("chatArea");
  if (!chatArea.classList.contains("active")) {
    document.querySelectorAll(".nav-tab").forEach(t => t.classList.remove("active"));
    const chatTab = document.querySelector(".nav-tab[data-tab='chat']");
    if (chatTab) chatTab.classList.add("active");
    chatArea.classList.add("active");
    document.querySelector(".input-area").style.display = "block";
    document.getElementById("chatFiltersBox").style.display = "block";
  }
  // Route through AI module
  await submitQueryWithAI(query);
}

// ============================================================
// QUERY PROCESSING ENGINE
// ============================================================
function processQuery(q) {
  const ql = normalizeText(q);

  // Detect year override in query
  let currentYears = getTargetYears(ql);
  // Detect school type
  let schoolType = detectSchoolType(ql);
  // Detect district (ilçe)
  let ilce = detectIlce(ql);
  // Detect what metric we want
  let metric = detectMetric(ql);
  // Detect if user is asking about private/public school stats
  let hasOzelResmiIntent = detectOzelResmiIntent(ql);
  
  // 0. Check for Kurum Kodu (6 digits) - Always top priority
  const codeMatch = ql.match(/\b(\d{6})\b/);
  if (codeMatch) {
    const code = codeMatch[1];
    return buildSchoolProfileResponse(currentYears, null, code);
  }

  // 1. Detect Intent: Districts list
  if (isListQuery(ql, "ilce")) {
    return buildIlceListResponse(currentYears);
  }

  // 2. Statistical / District Queries (Prioritize these for broad queries)
  const schoolNames = detectSchoolCoreName(ql);
  const words = ql.split(" ").filter(w => w.length > 0);
  
  if (ilce !== null || schoolType !== null || metric !== null || hasOzelResmiIntent) {
     if (hasOzelResmiIntent) {
       return buildResmiOzelResponse(currentYears, ilce, schoolType);
     }

     const broadKeywords = ["ilçesi", "ilcesi", "istatistik", "veri", "rapor", "bilgi", "okullar", "sayısı", "sayisi"];
     const hasBroadKeyword = broadKeywords.some(w => ql.includes(w));
     
     // School name suffixes indicate a SPECIFIC school query, not a type overview
     // e.g. "aydın lisesi" vs "lise sayısı"
     const schoolNameSuffixes = ["lisesi", "ilkokulu", "ortaokulu", "anaokulu", "koleji", "kolejini"];
     const hasSchoolNameSuffix = schoolNameSuffixes.some(w => ql.includes(w));

     const isBroadIlceQuery = ilce && (words.length <= 2 || (words.length <= 4 && (metric || hasBroadKeyword)));
     // If query has a school name suffix, it's a specific school - not a broad type query
     const isBroadTypeQuery = schoolType && !hasSchoolNameSuffix && (words.length <= 2 || hasBroadKeyword);

     // School profile takes priority if: has school names, not a broad district query,
     // not a metric-only type query, OR has a specific school name suffix
     const wantsSchoolCard = schoolNames && schoolNames.length > 0 && (
       hasSchoolNameSuffix || (!isBroadIlceQuery && !isBroadTypeQuery)
     );

     if (wantsSchoolCard) {
        return buildSchoolProfileResponse(currentYears, schoolNames);
     }

     if (schoolType !== null && ilce !== null && ilce !== "AYDIN") {
       return buildIlceSchoolTypeResponse(currentYears, ilce, schoolType, metric);
     }
     if (ilce !== null) {
       return buildIlceAllResponse(currentYears, ilce, metric);
     }
     if (schoolType !== null) {
       // Provincial type stats
       return buildSchoolTypeSummary(currentYears, schoolType, metric);
     }
  }

  // 3. Specific School Search Fallback
  if (schoolNames && schoolNames.length > 0) {
    // Check if a district was mentioned but ignored in broad check
    // e.g. "Nazilli Sınav" -> ilce is "NAZİLLİ", schoolNames contains "SINAV"
    if (ilce && ilce !== "AYDIN") {
       // Filter schoolNames to those in this ilce if possible
       // (buildSchoolProfileResponse already handles filtering if we pass it, 
       // but here we can be more explicit if needed)
    }
    return buildSchoolProfileResponse(currentYears, schoolNames);
  }

  // 4. Final Fallback
  return buildSummaryResponse(currentYears);
}

// ============================================================
// INTENT DETECTORS
// ============================================================
function getTargetYears(ql) {
  if (selectedYear !== "all") {
    // Override from sidebar
    if (ql.includes("2021") && ql.includes("2022")) return ["2021-2022"];
    if (ql.includes("2020") && ql.includes("2021")) return ["2020-2021"];
    if (ql.includes("her iki") || ql.includes("tum yil") || ql.includes("karsilastir")) return ["2021-2022","2020-2021"];
    return [selectedYear];
  }
  // All years selected in sidebar
  if (ql.includes("2021") && ql.includes("2022")) return ["2021-2022"];
  if (ql.includes("2020") && ql.includes("2021")) return ["2020-2021"];
  return ["2021-2022","2020-2021"];
}

function detectSchoolType(ql) {
  if (ql.includes("okul oncesi") || ql.includes("okuloncesi") || ql.includes("anaokul") || ql.includes("anasini") || ql.includes("kreş") || ql.includes("kres") || ql.includes("anasınıf")) return "okuloncesi";
  if (ql.includes("ilkokul") || ql.includes("ilk okul") || ql.includes("ilköğretim") || ql.includes("ilkogretim")) {
    if (!ql.includes("ortaokul")) return "ilkokul";
  }
  if (ql.includes("ortaokul") || ql.includes("orta okul")) return "ortaokul";
  if (ql.includes("lise") || ql.includes("anadolu lise") || ql.includes("fen lise") || ql.includes("meslek lise") || ql.includes("lisesi")) return "lise";
  if (ql.includes("ortaogretim") || ql.includes("orta öğretim") || ql.includes("orta ogretim")) return "lise";
  return null;
}

const ILCE_MAP = {
  "bozdo": "BOZDOĞAN", "bozdog": "BOZDOĞAN",
  "buharkent": "BUHARKENT",
  "cine": "ÇİNE", "çine": "ÇİNE",
  "didim": "DİDİM", "altinkum": "DİDİM",
  "efeler": "EFELER", "merkez": "EFELER", "aydin merkez": "EFELER",
  "germencik": "GERMENCİK",
  "incirliova": "İNCİRLİOVA",
  "karacasu": "KARACASU",
  "karpuzlu": "KARPUZLU",
  "kocArli": "KOÇARLI", "kocarli": "KOÇARLI",
  "kosk": "KÖŞK", "köşk": "KÖŞK",
  "kusadasi": "KUŞADASI", "kuşadasi": "KUŞADASI", "bodrum": "KUŞADASI",
  "kuyucak": "KUYUCAK",
  "nazilli": "NAZİLLİ",
  "soke": "SÖKE", "söke": "SÖKE",
  "sultanhisar": "SULTANHİSAR",
  "yenipazar": "YENİPAZAR",
  "il geneli": "AYDIN"
};

function detectIlce(ql) {
  for (const [keyword, ilce] of Object.entries(ILCE_MAP)) {
    if (ql.includes(normalizeText(keyword))) return ilce;
  }
  return null;
}

function detectMetric(ql) {
  if (ql.includes("okul sayisi") || ql.includes("okul sayı") || ql.includes("kac okul") || ql.includes("kaç okul")) return "okul_sayisi";
  if (ql.includes("derslik") || ql.includes("sinif sayisi") || ql.includes("sınıf sayısı")) return "derslik_sayisi";
  if (ql.includes("erkek") && (ql.includes("öğrenci") || ql.includes("ogrenci"))) return "ogrenci_erkek";
  if (ql.includes("kiz") && (ql.includes("öğrenci") || ql.includes("ogrenci"))) return "ogrenci_kiz";
  if (ql.includes("öğretmen") || ql.includes("ogretmen")) return "ogretmen_sayisi";
  if (ql.includes("öğrenci") || ql.includes("ogrenci") || ql.includes("sayısı") || ql.includes("sayisi")) return "ogrenci_toplam";
  return null;
}

function detectOzelResmiIntent(ql) {
  if (ql.includes("özel") || ql.includes("ozel") || ql.includes("resmi") || ql.includes("devlet") || ql.includes("kacı ozel") || ql.includes("kaçı özel")) return true;
  return false;
}

function isListQuery(ql, type) {
  if (type === "ilce") {
    return (ql.includes("ilce") || ql.includes("ilçe")) &&
           (ql.includes("liste") || ql.includes("hangi") || ql.includes("var") || ql.includes("hepsi") || ql.includes("tum") || ql.includes("göster") || ql.includes("goster"));
  }
  return false;
}

function detectSchoolCoreName(ql) {
  let matches = [];
  let maxScore = 0;
  
  const cleanQ = ql.replace(/[-.,()']/g, " ").replace(/\s+/g, " ");
  const queryWords = cleanQ.split(" ").filter(w => w.length > 2);
  const ignoreWords = ["ilkokulu", "ilkokul", "ortaokulu", "ortaokul", "lisesi", "lise", "anadolu", "anaokulu", "koleji", "kolej", "ozel", "özel", "resmi", "devlet", "imam", "hatip", "programi", "kurumu", "aydin", "merkez", "ilcesi", "okulu", "merkezi", "ogretmen", "öğretmen", "sayisi", "sayısı", "ogrenci", "öğrenci", "derslik", ...Object.keys(ILCE_MAP), ...Object.values(ILCE_MAP).map(v => normalizeText(v))];
  
  // Track unique results (by normName) to avoid duplicates across years
  let resultsFound = new Map(); // normName -> maxScore

  for (const yr of ["2021-2022", "2020-2021"]) {
    const d = MEB_DATA[yr];
    if (!d) continue;
    for (const t of ["okuloncesi", "ilkokul", "ortaokul", "lise"]) {
      for (const school of (d[t] || [])) {
        if (!school.okul_adi || school.okul_adi === "0") continue;
        const normName = normalizeText(school.okul_adi);
        const cleanN = normName.replace(/[-.,()']/g, " ").replace(/\s+/g, " ");
        const coreName = cleanN.split(" ").filter(w => !ignoreWords.includes(w)).join(" ");
        
        let score = 0;
        const isDistrictName = Object.keys(ILCE_MAP).includes(coreName) || Object.values(ILCE_MAP).some(v => normalizeText(v) === coreName);
        
        if (cleanQ.includes(cleanN)) {
           score = 100 + cleanN.length;
        } else if (!isDistrictName && coreName.length > 4 && cleanQ.includes(coreName)) {
           score = 50 + coreName.length;
        } else if (!isDistrictName) {
           const nameWords = cleanN.split(" ").filter(w => w.length > 2 && !ignoreWords.includes(w));
           if (nameWords.length > 0) {
             let matchCount = 0;
             for (const nw of nameWords) {
               if (queryWords.some(qw => nw.includes(qw) || qw.includes(nw))) matchCount++;
             }
             if (matchCount > 0) score = matchCount * 10 + (matchCount === nameWords.length ? 5 : 0);
           }
        }
        
        if (score >= 10) {
           const ilceNorm = normalizeText(school.ilce || "");
           if (ilceNorm && ql.includes(ilceNorm)) score += 20; 
           
           if (!resultsFound.has(normName) || score > resultsFound.get(normName)) {
               resultsFound.set(normName, score);
               if (score > maxScore) maxScore = score;
           }
        }
      }
    }
  }
  
  // Strict filtering: only return schools that are very close to the best match
  // If we have an exact full name match (score > 100), only return those.
  const threshold = maxScore > 100 ? 100 : (maxScore * 0.85);
  
  for (const [name, score] of resultsFound.entries()) {
    if (score >= threshold) matches.push(name);
  }
  
  // Sort by score
  matches.sort((a, b) => resultsFound.get(b) - resultsFound.get(a));
  
  // Limit to top 10 unique names to prevent UI explosion
  return matches.slice(0, 10);
}

// ============================================================
// RESPONSE BUILDERS
// ============================================================

function fmt(n) {
  if (n === 0 || n === "" || n === null || n === undefined) return "—";
  if (typeof n === "number") return n.toLocaleString("tr-TR");
  return String(n);
}

function yearTag(yr) {
  return `<span class="year-tag">${yr}</span>`;
}

// Type keyword matching for genel table entries
const TYPE_TOTAL_ROWS = {
  "okuloncesi": "okul oncesi genel toplami",
  "ilkokul":    "ilkokul toplami",
  "ortaokul":   "ortaokul toplami",
  "lise":       "ortaogretim genel toplami"
};

function normalizeText(str) {
  return String(str || "")
    .replace(/İ/g, "i").replace(/I/g, "i")
    .replace(/Ğ/g, "g").replace(/Ü/g, "u")
    .replace(/Ş/g, "s").replace(/Ö/g, "o")
    .replace(/Ç/g, "c")
    .toLowerCase()
    .replace(/i̇/g, "i").replace(/ı/g, "i")
    .replace(/ğ/g, "g").replace(/ü/g, "u")
    .replace(/ş/g, "s").replace(/ö/g, "o")
    .replace(/ç/g, "c");
}

/**
 * Get aggregated stats from the genel (summary) table for a given school type keyword.
 * Returns {ogrenci_toplam, ogretmen_sayisi, derslik_sayisi, okul_sayisi}
 */
function getGenelByType(yr, schoolTypeKey) {
  const d = MEB_DATA[yr];
  if (!d || !d.genel) return null;
  const targetRowName = TYPE_TOTAL_ROWS[schoolTypeKey];
  if (!targetRowName) return null;
  
  for (const entry of d.genel) {
    const turu = normalizeText(entry["okul_turu"]);
    // Tam ve doğru toplam satırını bul
    if (turu === targetRowName) {
      return {
        ogrenci_toplam:  entry["ogrenci_toplam"]  || 0,
        ogretmen_sayisi: entry["ogretmen_sayisi"] || 0,
        derslik_sayisi:  entry["derslik_sayisi"]  || 0,
        okul_sayisi:     entry["okul_sayisi"]     || 0
      };
    }
  }
  return null;
}

/** Get total stats from genel table across all types */
function getGenelTotal(yr) {
  const d = MEB_DATA[yr];
  if (!d || !d.genel) return null;
  let t = {ogrenci_toplam:0, ogretmen_sayisi:0, derslik_sayisi:0};
  for (const entry of d.genel) {
    const turu = normalizeText(entry["okul_turu"]);
    // Sadece "örgün eğitim genel toplam" veya eşdeğer satırı baz al:
    if (turu.includes("orgun") && turu.includes("toplam")) {
      t.ogrenci_toplam  = (entry["ogrenci_toplam"]  || 0);
      t.ogretmen_sayisi = (entry["ogretmen_sayisi"] || 0);
      t.derslik_sayisi  = (entry["derslik_sayisi"]  || 0);
      return t;
    }
  }
  return null;
}

function buildSummaryResponse(years) {
  let html = `<strong>📊 Genel Özet</strong><br/><br/>`;
  for (const yr of years) {
    const d = MEB_DATA[yr];
    if (!d) continue;
    html += `${yearTag(yr)}<br/>`;
    // Count schools from detail data
    const stats = getSummaryStats(yr);
    html += `<div class="stat-grid">
      <div class="stat-card"><span class="stat-value">${fmt(stats.total_okul)}</span><span class="stat-label">Toplam Okul</span></div>
      <div class="stat-card"><span class="stat-value">${fmt(stats.total_ogrenci)}</span><span class="stat-label">Toplam Öğrenci</span></div>
      <div class="stat-card"><span class="stat-value">${fmt(stats.total_ogretmen)}</span><span class="stat-label">Toplam Öğretmen</span></div>
      <div class="stat-card"><span class="stat-value">${fmt(stats.total_derslik)}</span><span class="stat-label">Toplam Derslik</span></div>
    </div>
    <div class="stat-grid" style="margin-top:8px">
      <div class="stat-card"><span class="stat-value">${fmt(stats.cnt_okuloncesi)}</span><span class="stat-label">Okul Öncesi</span></div>
      <div class="stat-card"><span class="stat-value">${fmt(stats.cnt_ilkokul)}</span><span class="stat-label">İlkokul</span></div>
      <div class="stat-card"><span class="stat-value">${fmt(stats.cnt_ortaokul)}</span><span class="stat-label">Ortaokul</span></div>
      <div class="stat-card"><span class="stat-value">${fmt(stats.cnt_lise)}</span><span class="stat-label">Lise</span></div>
    </div><br/>`;
  }
  return html;
}

// Helper: Is a school item "özel" (private)?
function isOzelSchool(item) {
  const ozelField = (item["resmi_ozel"] || "").toLowerCase();
  const okulAdi = (item["okul_adi"] || "").toUpperCase();
  return ozelField.includes("özel") || ozelField.includes("ozel") || okulAdi.startsWith("ÖZEL") || okulAdi.includes(" ÖZEL ") || okulAdi.includes("ÖZEL ");
}

function buildResmiOzelResponse(years, ilce, schoolType) {
  const typeLabels = {"okuloncesi":"Okul Öncesi","ilkokul":"İlkokul","ortaokul":"Ortaokul","lise":"Lise"};
  const types = schoolType ? [schoolType] : ["okuloncesi","ilkokul","ortaokul","lise"];
  
  const scopeLabel = [
    ilce ? ilce : "Aydın İli",
    schoolType ? typeLabels[schoolType] : "Tüm Kademeler"
  ].join(" - ");
  
  let html = `<strong>🏫 Özel / Resmi Okul Dağılımı</strong><br/>
  <span style="font-size:12px;color:var(--text-dim)">${scopeLabel}</span><br/><br/>`;

  for (const yr of years) {
    const d = MEB_DATA[yr];
    if (!d) continue;
    html += `${yearTag(yr)}<br/>`;
    
    let totalOzel = 0, totalResmi = 0;
    const typeBreakdown = [];

    for (const t of types) {
      let items = (d[t] || []);
      if (ilce) items = items.filter(item => ilceMatch(item["ilce"], ilce));
      
      const ozel = items.filter(isOzelSchool);
      const resmi = items.filter(item => !isOzelSchool(item));
      totalOzel += ozel.length;
      totalResmi += resmi.length;
      typeBreakdown.push({ label: typeLabels[t], total: items.length, ozel: ozel.length, resmi: resmi.length });
    }
    
    const toplam = totalOzel + totalResmi;
    const ozelPct = toplam > 0 ? Math.round((totalOzel / toplam) * 100) : 0;
    const resmiPct = 100 - ozelPct;

    html += `<div class="stat-grid">
      <div class="stat-card"><span class="stat-value">${fmt(toplam)}</span><span class="stat-label">Toplam Okul</span></div>
      <div class="stat-card" style="border-color:#f59e0b"><span class="stat-value" style="color:#f59e0b">${fmt(totalOzel)}</span><span class="stat-label">Özel Okul (%${ozelPct})</span></div>
      <div class="stat-card" style="border-color:#22c55e"><span class="stat-value" style="color:#22c55e">${fmt(totalResmi)}</span><span class="stat-label">Resmi Okul (%${resmiPct})</span></div>
    </div>`;

    if (types.length > 1) {
      html += `<br/><strong>Kademe Bazlı Dağılım:</strong>
      <table class="result-table">
        <tr><th>Kademe</th><th>Toplam</th><th>Özel</th><th>Resmi</th><th>Özel %</th></tr>`;
      for (const row of typeBreakdown) {
        if (row.total === 0) continue;
        const pct = Math.round((row.ozel / row.total) * 100);
        html += `<tr>
          <td>${row.label}</td>
          <td>${fmt(row.total)}</td>
          <td style="color:#f59e0b">${fmt(row.ozel)}</td>
          <td style="color:#22c55e">${fmt(row.resmi)}</td>
          <td>${pct}%</td>
        </tr>`;
      }
      html += `</table>`;
    }
    html += `<br/>`;
  }
  return html;
}

function getSummaryStats(yr) {
  const d = MEB_DATA[yr];
  const types = ["okuloncesi","ilkokul","ortaokul","lise"];

  let total_okul = 0, total_ogrenci = 0, total_ogretmen = 0, total_derslik = 0;

  // Count schools from detail files
  const cnt = {};
  for (const t of types) {
    cnt["cnt_" + t] = (d[t] || []).length;
    total_okul += (d[t] || []).length;
  }

  // Totals from genel table (most reliable)
  const genelTotal = getGenelTotal(yr);
  if (genelTotal && genelTotal.ogrenci_toplam > 0) {
    total_ogrenci = genelTotal.ogrenci_toplam;
    total_ogretmen = genelTotal.ogretmen_sayisi;
    total_derslik = genelTotal.derslik_sayisi;
  } else {
    // Fallback: sum from detail files
    for (const t of types) {
      for (const item of (d[t] || [])) {
        total_ogrenci  += (item["ogrenci_toplam"]  || 0);
        total_ogretmen += (item["ogretmen_sayisi"] || 0);
        total_derslik  += (item["derslik_sayisi"]  || 0);
      }
    }
  }

  return { total_okul, total_ogrenci, total_ogretmen, total_derslik, ...cnt };
}

function buildSchoolTypeSummary(years, schoolType, metric) {
  const typeLabels = {
    "okuloncesi": "Okul Öncesi", "ilkokul": "İlkokul",
    "ortaokul": "Ortaokul", "lise": "Lise"
  };
  let html = `<strong>🏫 ${typeLabels[schoolType]} İstatistikleri</strong><br/><br/>`;

  for (const yr of years) {
    const items = MEB_DATA[yr]?.[schoolType] || [];
    html += `${yearTag(yr)} ${items.length} kayıt<br/>`;

    // Aggregate
    let total_ogrenci = 0, total_ogretmen = 0, total_derslik = 0;
    let ogrenci_erkek = 0, ogrenci_kiz = 0;
    const ilceler = {};
    for (const item of items) {
      total_ogrenci += (item["ogrenci_toplam"] || 0);
      total_ogretmen += (item["ogretmen_sayisi"] || 0);
      total_derslik += (item["derslik_sayisi"] || 0);
      ogrenci_erkek += (item["ogrenci_erkek"] || 0);
      ogrenci_kiz += (item["ogrenci_kiz"] || 0);
      const ilce = item["ilce"] || item["İlçe"] || "";
      if (ilce && ilce !== "" && ilce !== "0") {
        if (!ilceler[ilce]) ilceler[ilce] = { okul: 0, ogrenci: 0, ogretmen: 0, derslik: 0 };
        ilceler[ilce].okul++;
        ilceler[ilce].ogrenci += (item["ogrenci_toplam"] || 0);
        ilceler[ilce].ogretmen += (item["ogretmen_sayisi"] || 0);
        ilceler[ilce].derslik += (item["derslik_sayisi"] || 0);
      }
    }

    if (metric === "ogrenci_toplam" || metric === null) {
      html += `<div class="stat-grid">
        <div class="stat-card"><span class="stat-value">${fmt(total_ogrenci)}</span><span class="stat-label">Toplam Öğrenci</span></div>
        <div class="stat-card"><span class="stat-value">${fmt(ogrenci_erkek)}</span><span class="stat-label">Erkek Öğrenci</span></div>
        <div class="stat-card"><span class="stat-value">${fmt(ogrenci_kiz)}</span><span class="stat-label">Kız Öğrenci</span></div>
        <div class="stat-card"><span class="stat-value">${fmt(total_ogretmen)}</span><span class="stat-label">Öğretmen</span></div>
        <div class="stat-card"><span class="stat-value">${fmt(total_derslik)}</span><span class="stat-label">Derslik</span></div>
        <div class="stat-card"><span class="stat-value">${fmt(items.length)}</span><span class="stat-label">Okul Sayısı</span></div>
      </div>`;
    } else {
      const metricLabels = {
        "ogrenci_toplam":"Öğrenci","ogretmen_sayisi":"Öğretmen",
        "derslik_sayisi":"Derslik","okul_sayisi":"Okul","ogrenci_erkek":"Erkek Öğrenci","ogrenci_kiz":"Kız Öğrenci"
      };
      const metricKey = {"ogretmen_sayisi":"ogretmen","derslik_sayisi":"derslik","okul_sayisi":"okul","ogrenci_toplam":"ogrenci","ogrenci_erkek":"ogrenci_erkek","ogrenci_kiz":"ogrenci_kiz"}[metric] || metric;
      const val = metric==="ogretmen_sayisi" ? total_ogretmen : metric==="derslik_sayisi" ? total_derslik : metric==="ogrenci_erkek" ? ogrenci_erkek : metric==="ogrenci_kiz" ? ogrenci_kiz : total_ogrenci;
      html += `<div class="stat-grid">
        <div class="stat-card"><span class="stat-value">${fmt(val)}</span><span class="stat-label">${metricLabels[metric]||metric}</span></div>
      </div>`;
    }

    // İlçe breakdown table
    const ilceKeys = Object.keys(ilceler).filter(k=>k && k!=="0" && k!=="");
    if (ilceKeys.length > 0) {
      html += `<br/><strong>İlçe Bazlı Dağılım:</strong>
      <table class="result-table">
        <tr><th>İlçe</th><th>Okul</th><th>Öğrenci</th><th>Öğretmen</th><th>Derslik</th></tr>`;
      for (const ilce of ilceKeys.sort()) {
        const v = ilceler[ilce];
        html += `<tr>
          <td>${ilce}</td>
          <td>${fmt(v.okul)}</td>
          <td>${fmt(v.ogrenci)}</td>
          <td>${fmt(v.ogretmen)}</td>
          <td>${fmt(v.derslik)}</td>
        </tr>`;
      }
      html += `</table>`;
    }
    html += "<br/>";
  }
  return html;
}

function ilceMatch(itemIlce, targetIlce) {
  if (!itemIlce) return false;
  const a = String(itemIlce).toUpperCase().trim();
  const b = targetIlce.toUpperCase().trim();
  // Exact match or starts-with
  return a === b || a.startsWith(b) || b.startsWith(a.split(' ')[0]);
}

function buildIlceAllResponse(years, ilce, metric) {
  let html = `<strong>📍 ${ilce} İlçesi İstatistikleri</strong><br/><br/>`;
  const types = ["okuloncesi","ilkokul","ortaokul","lise"];
  const typeLabels = {"okuloncesi":"Okul Öncesi","ilkokul":"İlkokul","ortaokul":"Ortaokul","lise":"Lise"};

  for (const yr of years) {
    html += `${yearTag(yr)}<br/>`;
    const d = MEB_DATA[yr];
    if (!d) { html += "Veri bulunamadı.<br/>"; continue; }

    const summaryRows = [];
    let grandTotal = { okul:0, ogrenci:0, ogretmen:0, derslik:0 };
    let anyIlceData = false;

    for (const t of types) {
      const allItems = d[t] || [];
      // Check if any items have ilce data at all
      const hasIlceData = allItems.some(item => item["ilce"] && item["ilce"] !== "0" && item["ilce"] !== "");
      
      let items;
      if (hasIlceData) {
        items = allItems.filter(item => ilceMatch(item["ilce"], ilce));
        anyIlceData = true;
      } else {
        items = []; // No ilce data in this school type's detail file
      }

      let okul = items.length, ogrenci = 0, ogretmen = 0, derslik = 0;
      for (const item of items) {
        ogrenci += (item["ogrenci_toplam"] || 0);
        ogretmen += (item["ogretmen_sayisi"] || 0);
        derslik  += (item["derslik_sayisi"]  || 0);
      }

      // If no ilce data in detail, note it but still use okul count from filtered data
      if (okul > 0 || hasIlceData) {
        grandTotal.okul += okul;
        grandTotal.ogrenci += ogrenci;
        grandTotal.ogretmen += ogretmen;
        grandTotal.derslik += derslik;
        if (okul > 0) {
          summaryRows.push({ label: typeLabels[t], okul, ogrenci, ogretmen, derslik });
        }
      }
    }

    if (summaryRows.length === 0) {
      html += `<span class="no-result">${ilce} ilçesi için detaylı veri bulunamadı.<br/>Not: İlçe bazlı veri yalnızca ilçe sütunu olan dosyalarda mevcuttur.</span><br/>`;
      continue;
    }

    html += `<div class="stat-grid">
      <div class="stat-card"><span class="stat-value">${fmt(grandTotal.okul)}</span><span class="stat-label">Toplam Okul</span></div>
      <div class="stat-card"><span class="stat-value">${fmt(grandTotal.ogrenci)}</span><span class="stat-label">Toplam Öğrenci</span></div>
      <div class="stat-card"><span class="stat-value">${fmt(grandTotal.ogretmen)}</span><span class="stat-label">Toplam Öğretmen</span></div>
      <div class="stat-card"><span class="stat-value">${fmt(grandTotal.derslik)}</span><span class="stat-label">Toplam Derslik</span></div>
    </div>
    <br/>
    <table class="result-table">
      <tr><th>Okul Türü</th><th>Okul</th><th>Öğrenci</th><th>Öğretmen</th><th>Derslik</th></tr>`;
    for (const r of summaryRows) {
      html += `<tr><td>${r.label}</td><td>${fmt(r.okul)}</td><td>${fmt(r.ogrenci)}</td><td>${fmt(r.ogretmen)}</td><td>${fmt(r.derslik)}</td></tr>`;
    }
    html += `</table><br/>`;
  }
  return html;
}

function buildIlceSchoolTypeResponse(years, ilce, schoolType, metric) {
  const typeLabels = {"okuloncesi":"Okul Öncesi","ilkokul":"İlkokul","ortaokul":"Ortaokul","lise":"Lise"};
  let html = `<strong>📍 ${ilce} - ${typeLabels[schoolType]}</strong><br/><br/>`;

  for (const yr of years) {
    html += `${yearTag(yr)}<br/>`;
    const d = MEB_DATA[yr];
    if (!d) { html += "Veri bulunamadı.<br/>"; continue; }

    const items = (d[schoolType] || []).filter(item => {
      const itemIlce = String(item["ilce"] || item["İlçe"] || "").toUpperCase().trim();
      return itemIlce.includes(ilce.toUpperCase()) || ilce.toUpperCase().includes(itemIlce.split(" ")[0]);
    });

    if (items.length === 0) {
      html += `<span class="no-result">Bu ilçe ve okul türü için veri bulunamadı.</span><br/>`;
      continue;
    }

    let ogrenci = 0, ogretmen = 0, derslik = 0, erkek = 0, kiz = 0;
    for (const item of items) {
      ogrenci += (item["ogrenci_toplam"] || 0);
      ogretmen += (item["ogretmen_sayisi"] || 0);
      derslik += (item["derslik_sayisi"] || 0);
      erkek += (item["ogrenci_erkek"] || 0);
      kiz += (item["ogrenci_kiz"] || 0);
    }

    html += `<div class="stat-grid">
      <div class="stat-card"><span class="stat-value">${fmt(items.length)}</span><span class="stat-label">Okul Sayısı</span></div>
      <div class="stat-card"><span class="stat-value">${fmt(ogrenci)}</span><span class="stat-label">Öğrenci</span></div>
      <div class="stat-card"><span class="stat-value">${fmt(erkek)}</span><span class="stat-label">Erkek</span></div>
      <div class="stat-card"><span class="stat-value">${fmt(kiz)}</span><span class="stat-label">Kız</span></div>
      <div class="stat-card"><span class="stat-value">${fmt(ogretmen)}</span><span class="stat-label">Öğretmen</span></div>
      <div class="stat-card"><span class="stat-value">${fmt(derslik)}</span><span class="stat-label">Derslik</span></div>
    </div>`;

    // Show school list
    const hasNames = items.some(i => i["okul_adi"] && i["okul_adi"] !== "0" && i["okul_adi"] !== 0);
    if (hasNames && items.length <= 30) {
      html += `<br/><strong>Okul Listesi:</strong>
      <table class="result-table">
        <tr><th>Okul Adı</th><th>Öğrenci</th><th>Öğretmen</th></tr>`;
      for (const item of items) {
        const name = item["okul_adi"] || item["okul_adı"] || "—";
        if (name && name !== "0") {
          html += `<tr><td>${name}</td><td>${fmt(item["ogrenci_toplam"])}</td><td>${fmt(item["ogretmen_sayisi"])}</td></tr>`;
        }
      }
      html += `</table>`;
    }
    html += "<br/>";
  }
  return html;
}

function buildIlceListResponse(years) {
  const ilceler = [
    "BOZDOĞAN","BUHARKENT","ÇİNE","DİDİM","EFELER","GERMENCİK",
    "İNCİRLİOVA","KARACASU","KARPUZLU","KOÇARLI","KÖŞK",
    "KUŞADASI","KUYUCAK","NAZİLLİ","SÖKE","SULTANHİSAR","YENİPAZAR"
  ];
  
  const yr = years[0]; // Display stats for the primary year
  const d = MEB_DATA[yr] || {};
  const types = ["okuloncesi","ilkokul","ortaokul","lise"];
  
  let html = `<strong>🗺️ Aydın İl İlçeleri (${ilceler.length} ilçe)</strong><br/>
  <span style="font-size:12px;color:var(--text-dim)">${yr} Eğitim Yılı Verileri</span><br/><br/>
  <div class="stat-grid">`;
  
  for (const ilce of ilceler) {
    let okul = 0, ogrenci = 0;
    for (const t of types) {
      const items = (d[t] || []).filter(item => ilceMatch(item["ilce"], ilce));
      okul += items.length;
      for (const item of items) {
        ogrenci += (item["ogrenci_toplam"] || 0);
      }
    }

    html += `<div class="stat-card" style="cursor:pointer;text-align:center;transition:transform 0.2s;" 
                 onclick="submitQuery('${ilce} ilçesi istatistikleri')"
                 onmouseover="this.style.transform='translateY(-2px)'"
                 onmouseout="this.style.transform='translateY(0)'">
      <div class="stat-value" style="font-size:13px;margin-bottom:4px;">${ilce}</div>
      <div style="font-size:11px;color:var(--text-dim)">
        ${fmt(okul)} Okul | ${fmt(ogrenci)} Öğr.
      </div>
    </div>`;
  }
  html += `</div><br/><em style="color:var(--text-dim);font-size:12px">İlçe kartına tıklayarak detaylı raporu açabilirsiniz.</em>`;
  return html;
}

function buildGenelMetricResponse(years, metric) {
  const metricLabels = {
    "ogrenci_toplam":"Öğrenci","ogretmen_sayisi":"Öğretmen",
    "derslik_sayisi":"Derslik","okul_sayisi":"Okul",
    "ogrenci_erkek":"Erkek Öğrenci","ogrenci_kiz":"Kız Öğrenci"
  };
  let html = `<strong>📊 ${metricLabels[metric] || metric} - İl Geneli</strong><br/><br/>`;
  const types = ["okuloncesi","ilkokul","ortaokul","lise"];
  const typeLabels = {"okuloncesi":"Okul Öncesi","ilkokul":"İlkokul","ortaokul":"Ortaokul","lise":"Lise"};

  for (const yr of years) {
    html += `${yearTag(yr)}<br/>`;
    const d = MEB_DATA[yr];
    if (!d) continue;
    html += `<div class="stat-grid">`;
    let grand = 0;
    for (const t of types) {
      let total = 0;
      if (metric === "okul_sayisi") {
        total = (d[t] || []).length;
      } else {
        // Use genel table primarily for these core metrics
        let usedGenel = false;
        if (metric === "ogrenci_toplam" || metric === "ogretmen_sayisi" || metric === "derslik_sayisi") {
          const genelStat = getGenelByType(yr, t);
          if (genelStat && genelStat[metric] > 0) {
            total = genelStat[metric];
            usedGenel = true;
          }
        }
        // Fallback or non-core metrics (like erkek/kız) use detail files
        if (!usedGenel) {
          for (const item of (d[t] || [])) {
            total += (item[metric] || 0);
          }
        }
      }
      grand += total;
      html += `<div class="stat-card"><span class="stat-value">${fmt(total)}</span><span class="stat-label">${typeLabels[t]}</span></div>`;
    }
    
    // For general total, we can use getGenelTotal if we are looking at ogrenci, ogretmen, or derslik
    let finalGrand = grand;
    if (metric === "ogrenci_toplam" || metric === "ogretmen_sayisi" || metric === "derslik_sayisi") {
      const gtotal = getGenelTotal(yr);
      if (gtotal && gtotal[metric] > 0) {
        finalGrand = gtotal[metric];
      }
    }

    html += `<div class="stat-card" style="border-color:var(--red)">
      <span class="stat-value" style="color:var(--red)">${fmt(finalGrand)}</span>
      <span class="stat-label">TOPLAM</span>
    </div></div><br/>`;
  }
  return html;
}

function buildSchoolProfileResponse(years, targetNormNames, targetCode = null) {
  let html = "";
  let foundSchoolsFinal = [];
  
  const yrArr = Array.isArray(years) ? years : [years];

  for (const yr of yrArr) {
    const d = MEB_DATA[yr];
    if (!d) continue;
    for (const t of ["okuloncesi", "ilkokul", "ortaokul", "lise"]) {
      for (const school of (d[t] || [])) {
        let match = false;
        if (targetCode && school.kurum_kodu == targetCode) {
          match = true;
        } else if (targetNormNames && targetNormNames.includes(normalizeText(school.okul_adi))) {
          match = true;
        }
        
        if (match) {
          foundSchoolsFinal.push({ year: yr, data: school });
          if (foundSchoolsFinal.length > 20) break; // Absolute cap for UI safety
        }
      }
      if (foundSchoolsFinal.length > 20) break;
    }
    if (foundSchoolsFinal.length > 20) break;
  }
  
  if (foundSchoolsFinal.length === 0) {
    return "<span class='no-result'>Eşleşen okul kaydı bulunamadı.</span>";
  }

  // Sort by year desc
  foundSchoolsFinal.sort((a,b) => b.year.localeCompare(a.year));
  
  if (foundSchoolsFinal.length > 10 && !targetCode) {
    html += "<div class='info-note'>🔍 Toplam " + foundSchoolsFinal.length + " benzer isimli okul bulundu. Karmaşıklığı önlemek için en yakın 10 tanesi gösteriliyor. Lütfen ilçe ekleyerek (örn: 'Nazilli Fatih') aramayı daraltın.</div><br/>";
    foundSchoolsFinal = foundSchoolsFinal.slice(0, 10);
  }

  let currentYearDisplayed = "";
  for (const item of foundSchoolsFinal) {
    if (item.year !== currentYearDisplayed) {
      if (currentYearDisplayed !== "") html += "<hr style='border: 0; border-top: 1px dashed var(--border-color); margin: 20px 0;'>";
      html += yearTag(item.year) + "<br/>";
      currentYearDisplayed = item.year;
    }
    
    const s = item.data;
    html += "<div class='school-profile-card'>";
    html += "<div class='sp-header'>";
    html += "<div class='sp-title'>" + s.okul_adi + " " + (s.kurum_kodu ? "<span style='font-size:0.6em; opacity:0.7; vertical-align:middle; background:rgba(255,255,255,0.1); padding:2px 6px; border-radius:4px; margin-left:8px'>#" + s.kurum_kodu + "</span>" : "") + "</div>";
    html += "<div class='sp-subtitle'>" + (s.ilce || "AYDIN") + " | " + (s.okul_turu || "-") + "</div>";
    html += "</div>";
    
    html += "<div class='sp-body'>";
    html += "<div class='sp-info-grid'>";
    if (s.kurum_kodu && s.kurum_kodu !== "0") {
      html += "<div>🆔 <strong>Kurum Kodu:</strong> " + s.kurum_kodu + "</div>";
    }
    if (s.telefon && s.telefon !== "0" && s.telefon !== "None") {
      html += "<div>📞 <strong>Telefon:</strong> 0" + Math.floor(Number(s.telefon)) + "</div>";
    }
    if (s.adres && s.adres !== "None" && s.adres !== "0") {
      html += "<div>📍 <strong>Adres:</strong> " + s.adres + "</div>";
    }
    if (s.web && s.web !== "None" && s.web !== "0") {
      html += "<div>🌐 <strong>Web:</strong> <a href='http://" + s.web + "' target='_blank'>" + s.web + "</a></div>";
    }
    let ogretimVal = s.ogretim_sekli;
    if (ogretimVal == "1.0" || ogretimVal == "1") ogretimVal = "Normal";
    else if (ogretimVal == "2.0" || ogretimVal == "2") ogretimVal = "İkili";
    else if (ogretimVal == "3.0" || ogretimVal == "3") ogretimVal = "Birl. Sınıf.";

    let tipItems = [s.kurum_tipi, s.resmi_ozel, ogretimVal, s.yerlesim_yeri].filter(x => x && x !== '0' && x !== 'None' && x !== '');
    if (tipItems.length > 0) {
      html += "<div>🏢 <strong>Tip / Öğretim:</strong> " + tipItems.join(" / ") + "</div>";
    }
    if (s.isinma_durumu && s.isinma_durumu !== "0" && s.isinma_durumu !== "None") {
      let isinmaTxt = s.isinma_durumu;
      if (s.yakit_turu && !s.isinma_durumu.includes(s.yakit_turu)) {
        isinmaTxt += " (" + s.yakit_turu + ")";
      }
      html += "<div>🔥 <strong>Isınma:</strong> " + isinmaTxt + "</div>";
    }
    html += "</div>";
    
    html += "<div class='sp-stats-grid'>";
    html += "<div class='sp-stat-box'><div class='sp-stat-val'>" + fmt(s.ogrenci_toplam) + "</div><div class='sp-stat-lbl'>Öğrenci</div></div>";
    
    // Teacher with Gender Breakdown
    let teacherSub = "";
    if (s.ogretmen_erkek || s.ogretmen_kadin) {
      teacherSub = `<div style='font-size:10px; opacity:0.8; margin-top:2px'>E: ${fmt(s.ogretmen_erkek)} | K: ${fmt(s.ogretmen_kadin)}</div>`;
    }
    html += `<div class='sp-stat-box'>
      <div class='sp-stat-val'>${fmt(s.ogretmen_sayisi)}</div>
      <div class='sp-stat-lbl'>Öğretmen</div>
      ${teacherSub}
    </div>`;
    
    html += "<div class='sp-stat-box'><div class='sp-stat-val'>" + fmt(s.derslik_sayisi) + "</div><div class='sp-stat-lbl'>Derslik</div></div>";
    html += "</div>";
    
    if (s.sinif_detay && Object.keys(s.sinif_detay).length > 0) {
      html += "<div class='sp-classes'><strong>Sınıf Dağılımları:</strong><table class='result-table' style='margin-top:8px'>";
      html += "<tr><th>Sınıf</th><th>Şb</th><th>Öğrn.</th><th>E</th><th>K</th></tr>";
      for (const [gName, gData] of Object.entries(s.sinif_detay)) {
         html += "<tr><td>" + gName + "</td><td>" + fmt(gData.sube) + "</td><td>" + fmt(gData.toplam) + "</td><td>" + fmt(gData.erkek) + "</td><td>" + fmt(gData.kiz) + "</td></tr>";
      }
      html += "</table></div>";
    }
    html += "</div></div><br/>";
  }
  
  return html;
}

// ============================================================
// MOBILE NAVIGATION LOGIC
// ============================================================
function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (!sidebar || !overlay) return;

  sidebar.classList.toggle('active');
  overlay.classList.toggle('active');
}

// Close sidebar on mobile when a navigation button is clicked
document.addEventListener('click', (e) => {
  if (window.innerWidth > 900) return; // Only for mobile/tablet

  const isNavItem = e.target.closest('.year-btn') || e.target.closest('.quick-btn');
  if (isNavItem) {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar.classList.contains('active')) {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
    }
  }
});

// ============================================================
// ANALYSIS ENGINE & MAPPING
// ============================================================

const POTENTIAL_LANDS = [
  { id: 1, name: "Söke Çeltikçi (Dünya Bankası Projesi)", lat: 37.755, lng: 27.401, area: 15000, district: "SÖKE", status: "Hazine Taşınmazı (Yatırım Programında)" },
  { id: 2, name: "Efeler Kardeşköy (Yeni Okul Alanı)", lat: 37.842, lng: 27.795, area: 8500, district: "EFELER", status: "Milli Emlak Tahsisli" },
  { id: 3, name: "Nazilli Pınarcık (Eğitim Kampüsü)", lat: 37.925, lng: 28.310, area: 12000, district: "NAZİLLİ", status: "Kamulaştırılmış Hazine Alanı" },
  { id: 4, name: "Kuşadası Kadınlar Denizi (Arsa)", lat: 37.835, lng: 27.245, area: 7200, district: "KUŞADASI", status: "Hazine Taşınmazı" },
  { id: 5, name: "Didim Akyeniköy (Büyük Arsa)", lat: 37.405, lng: 27.315, area: 22000, district: "DİDİM", status: "Milli Emlak Yatırım Alanı" },
  { id: 6, name: "Germencik Yeni Mahalle (Üniversite Yanı)", lat: 37.865, lng: 27.605, area: 6500, district: "GERMENCİK", status: "Belediyeden Devir/Hazine" }
];

let analysisMap = null;

function initAnalysisMap() {
  if (analysisMap) {
    analysisMap.invalidateSize();
    return;
  }

  // Aydın Merkez Koordinatları: 37.8444, 27.8416
  const mapEl = document.getElementById('map');
  if (!mapEl) return;

  analysisMap = L.map('map').setView([37.8444, 27.8416], 10);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(analysisMap);

  POTENTIAL_LANDS.forEach(land => {
    const marker = L.marker([land.lat, land.lng]).addTo(analysisMap);
    
    const popupContent = `
      <div class="land-popup">
        <span class="land-popup-title">${land.name}</span>
        <div class="land-popup-info">
          📍 ${land.district}<br>
          📐 ${land.area.toLocaleString('tr-TR')} m²<br>
          📜 <strong>${land.status}</strong>
        </div>
        <button class="land-popup-btn" onclick="selectLand(${land.id})">Araziyi Seç ve Analiz Et</button>
      </div>
    `;
    
    marker.bindPopup(popupContent);
  });
}

function selectLand(id) {
  const land = POTENTIAL_LANDS.find(l => l.id === id);
  if (!land) return;

  document.getElementById("analysisIlce").value = land.district;
  document.getElementById("analysisAreaSize").value = land.area;
  document.getElementById("analysisFloors").value = 3;
  
  runAnalysis(land);
}

const DISTRICT_ANALYSIS_DATA = {
  "EFELER": { coords: [37.8444, 27.8416], risk: "Yüksek (1. Derece)", transport: "Çok İyi (Tren, Otobüs, Şehir İçi Minibüs)", food: "Zengin (AVM, Restoranlar, Esnaf Lokantaları)", note: "İl merkezi olması sebebiyle nüfus yoğunluğu en yüksek bölgedir." },
  "NAZİLLİ": { coords: [37.912, 28.324], risk: "Yüksek (1. Derece - Fay Hattı Üzeri)", transport: "İyi (Tren, Otobüs)", food: "Zengin (Uzun Çarşı, Yerel Restoranlar)", note: "Doğu Aydın'ın en büyük ticaret ve eğitim merkezidir." },
  "SÖKE": { coords: [37.755, 27.401], risk: "Yüksek (1. Derece)", transport: "İyi (Otobüs, Turistik Geçiş Güzergahı)", food: "Bölgesel (Pide Salonları, Outlet Restoranları)", note: "Didim ve Kuşadası yolu üzerinde stratejik konumda." },
  "KUŞADASI": { coords: [37.835, 27.245], risk: "Yüksek (1. Derece)", transport: "İyi (Şehir İçi Dolmuş, Otobüs)", food: "Zengin (Turistik İşletmeler, Balık Restoranları)", note: "Sezonluk nüfus dalgalanması okul planlamasında dikkate alınmalıdır." },
  "DİDİM": { coords: [37.375, 27.272], risk: "Yüksek (1. Derece)", transport: "Orta (Otobüs - Yazın Daha Aktif)", food: "Zengin (Yabancı ve Yerel Mutfak)", note: "Hızla büyüyen yerleşim alanları okul ihtiyacını artırmaktadır." },
  "ÇİNE": { coords: [37.615, 28.065], risk: "Hafif (2. Derece)", transport: "Orta (Otobüs)", food: "Bölgesel (Yol Üstü Tesisler, Çine Köftesi)", note: "Zemin yapısı diğer ilçelere göre daha serttir." },
  "GERMENCİK": { coords: [37.865, 27.605], risk: "Yüksek (1. Derece)", transport: "İyi (İzmir-Aydın Yolu, Tren)", food: "Bölgesel (İncir İşletmeleri, Yerel Lokantalar)", note: "Jeotermal sahalar okul yer seçiminde kritik faktördür." },
  "İNCİRLİOVA": { coords: [37.849, 27.722], risk: "Yüksek (1. Derece)", transport: "Çok İyi (Tren, İzmir Yolu üzerinde)", food: "Normal (Yol Üstü Dinlenme Tesisleri)", note: "Efeler ile bitişik nizam büyüme göstermektedir." },
  "KOÇARLI": { coords: [37.761, 27.698], risk: "Yüksek (1. Derece)", transport: "Orta", food: "Normal (Çam Fıstığı ve Yerel Lezzetler)", note: "Dağlık bölgelerde yerleşim yaygındır." },
  "KÖŞK": { coords: [37.854, 28.051], risk: "Yüksek (1. Derece)", transport: "İyi (Denizli Yolu, Tren)", food: "Normal", note: "Tarımsal sanayi okul ihtiyacını etkilemektedir." },
  "SULTANHİSAR": { coords: [37.889, 28.151], risk: "Yüksek (1. Derece)", transport: "İyi (Denizli Yolu, Tren)", food: "Normal (Çilek ve Tarım)", note: "Nyssa antik kenti yakınlarındadır." },
  "YENİPAZAR": { coords: [37.889, 28.196], risk: "Yüksek (1. Derece)", transport: "Orta (Sakin Şehir)", food: "Zengin (Yenipazar Pidesi)", note: "Cittaslow ünvanına sahiptir." },
  "KUYUCAK": { coords: [37.914, 28.459], risk: "Yüksek (1. Derece)", transport: "İyi (Denizli Yolu, Tren)", food: "Normal", note: "Narenciye üretim merkezidir." },
  "BUHARKENT": { coords: [37.911, 28.604], risk: "Yüksek (1. Derece)", transport: "İyi (İl Sınırı, Denizli Yolu)", food: "Normal", note: "Jeotermal enerji potansiyeli yüksektir." },
  "KARACASU": { coords: [37.729, 28.608], risk: "Hafif (2. Derece)", transport: "Orta", food: "Zengin (Karacasu Pidesi, Seramik)", note: "Afrodisias Antik Kenti'ne ev sahipliği yapar." },
  "BOZDOĞAN": { coords: [37.671, 28.312], risk: "Yüksek (1. Derece)", transport: "Orta", food: "Normal (Bozdoğan Sucuğu)", note: "Kemer Barajı bölgesindedir." },
  "KARPUZLU": { coords: [37.618, 27.838], risk: "Hafif (2. Derece)", transport: "Düşük (Virajlı Yollar)", food: "Normal", note: "Alinda antik kenti bölgesindedir." }
};

const DEFAULT_ANALYSIS = { risk: "Yüksek (1. Derece)", transport: "Orta", food: "Normal", note: "Aydın genel olarak 1. derece deprem bölgesindedir." };

function runAnalysis(selectedLand = null) {
  const ilce = document.getElementById("analysisIlce").value;
  const area = parseFloat(document.getElementById("analysisAreaSize").value);
  const floors = parseInt(document.getElementById("analysisFloors").value || 3);
  
  const resultsDiv = document.getElementById("analysisResults");
  resultsDiv.classList.remove("hidden");
  
  if (!area || area < 500) {
    resultsDiv.innerHTML = `<div class="analysis-placeholder" style="color:var(--red-light)">Lütfen en az 500 m² geçerli bir arsa alanı giriniz.</div>`;
    return;
  }

  const data = DISTRICT_ANALYSIS_DATA[ilce] || DEFAULT_ANALYSIS;
  
  // CAPACITY CALCULATIONS
  const floorBase = area * 0.40;
  const totalBuildArea = floorBase * floors;
  const classroomArea = 90; 
  
  const classCount = Math.floor(totalBuildArea / classroomArea);
  const studentCapacity = classCount * 30; 
  const playgroundArea = area - floorBase;

  // GOOGLE EARTH (STAT VIEW) LINK - Always generate if possible
  let earthHeader = "";
  const displayLand = selectedLand || { 
    name: ilce + " Bölgesi Genel Analizi", 
    lat: data.coords ? data.coords[0] : 37.8444, 
    lng: data.coords ? data.coords[1] : 27.8416,
    status: "Manuel Giriş / İlçe Merkezi"
  };

  const earthUrl = `https://www.google.com/maps/@${displayLand.lat},${displayLand.lng},400m/data=!3m1!1e3`;
  earthHeader = `
    <div class="analysis-card" style="margin-bottom:20px; border-left:4px solid #4285f4; background:rgba(66, 133, 244, 0.1)">
      <div style="display:flex; justify-content:space-between; align-items:center; gap:15px">
        <div>
          <div class="card-title" style="margin-bottom:5px">🌍 Uydu Görüntüsü & Mülkiyet Analizi</div>
          <div style="font-size:12px; color:var(--text-muted)">
            <strong>${displayLand.name}</strong><br>
            Durum: <span style="color:#60a5fa; font-weight:600">${displayLand.status}</span><br>
            Koordinat: ${displayLand.lat}, ${displayLand.lng}
          </div>
        </div>
        <a href="${earthUrl}" target="_blank" class="land-popup-btn" style="width:auto; margin:0; background:#4285f4; padding:8px 15px; display:inline-flex; align-items:center; gap:8px; text-decoration:none">
          <span>Earth'te Aç</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>
        </a>
      </div>
    </div>
  `;

  // RECOMMENDATIONS LOGIC
  let recommendationHtml = "";
  const districtLands = POTENTIAL_LANDS.filter(l => l.district === ilce && (!selectedLand || l.id !== selectedLand.id));
  
  if (districtLands.length > 0) {
    recommendationHtml = `
      <div class="land-recommendations">
        <div class="rec-title">
          <span>💡 ${ilce} İlçesindeki Diğer Potansiyel Alanlar</span>
        </div>
        <div class="rec-grid">
          ${districtLands.map(l => {
            const lEarthUrl = `https://www.google.com/maps/@${l.lat},${l.lng},400m/data=!3m1!1e3`;
            return `
              <div class="rec-card" onclick="selectLand(${l.id})">
                <div style="display:flex; justify-content:space-between; align-items:flex-start">
                  <div class="rec-card-name">${l.name}</div>
                  <a href="${lEarthUrl}" target="_blank" class="rec-earth-link" onclick="event.stopPropagation();" title="Earth'te Gör">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>
                  </a>
                </div>
                <div class="rec-card-info">📍 ${l.district} | 📐 ${l.area.toLocaleString('tr-TR')} m²</div>
                <div class="rec-card-status">${l.status}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // GENERATE HTML
  resultsDiv.innerHTML = `
    ${earthHeader}
    ${recommendationHtml}
    <div class="stat-grid">
      <div class="stat-card" style="border-top:4px solid var(--red)">
        <span class="stat-label">DEPREM RİSKİ</span>
        <span class="stat-value" style="font-size:16px; margin-top:5px; color:#f1948a">${data.risk}</span>
        <div class="risk-level ${data.risk.includes('2') ? 'risk-med' : 'risk-high'}">⚠️ Dikkatli Planlama</div>
      </div>
      <div class="stat-card" style="border-top:4px solid var(--accent)">
        <span class="stat-label">MAX. SINIF SAYISI</span>
        <span class="stat-value">${classCount}</span>
        <span class="stat-year">Kat Başına ~${Math.floor(floorBase/classroomArea)} Sınıf</span>
      </div>
      <div class="stat-card" style="border-top:4px solid var(--green)">
        <span class="stat-label">ÖĞRENCİ KAPASİTESİ</span>
        <span class="stat-value">${studentCapacity.toLocaleString('tr-TR')}</span>
        <span class="stat-year">Mevcudiyet: 30 Kişi</span>
      </div>
      <div class="stat-card" style="border-top:4px solid #f59e0b">
        <span class="stat-label">BAHÇE ALANI</span>
        <span class="stat-value">${Math.floor(playgroundArea).toLocaleString('tr-TR')} m²</span>
        <span class="stat-year">Açık Alan Payı: %${Math.round((playgroundArea/area)*100)}</span>
      </div>
    </div>

    <div class="stat-grid" style="grid-template-columns: 1fr 1fr">
      <div class="analysis-card">
        <div class="card-title">📍 Çevresel Olanaklar</div>
        <div class="opportunity-list">
          <div class="opportunity-item">
            <span class="opportunity-icon">🚌</span>
            <div><strong>Ulaşım:</strong> ${data.transport}</div>
          </div>
          <div class="opportunity-item">
            <span class="opportunity-icon">🍴</span>
            <div><strong>Yeme-İçme:</strong> ${data.food}</div>
          </div>
          <div class="opportunity-item">
            <span class="opportunity-icon">⚡</span>
            <div><strong>Altyapı:</strong> ${ilce === 'EFELER' || ilce === 'NAZİLLİ' ? 'Tam Gelişmiş' : 'Gelişmekte'}</div>
          </div>
        </div>
      </div>
      <div class="analysis-card">
        <div class="card-title">🔍 Bölgesel Notlar</div>
        <div class="opportunity-item">
          <span class="opportunity-icon">💡</span>
          <div>${data.note}</div>
        </div>
        <div class="opportunity-item" style="margin-top:10px">
          <span class="risk-icon">⚠️</span>
          <div><strong>Sismik Durum:</strong> ${data.risk.includes('Fay') ? 'Kuvvetli yer ivmesi beklentisi. Radye jeneral temel zorunludur.' : 'Yönetmeliğe uygun betonarme karkas yapı önerilir.'}</div>
        </div>
      </div>
    </div>

    <div class="analysis-card" style="background:#1e2535">
      <div class="card-title">💡 Yapay Zeka Modelleme Özeti</div>
      <p style="font-size:13px; line-height:1.6; color:var(--text-muted)">
        Girdiğiniz ${area} m² arsa alanı ve ${floors} katlı yapı tasarımı için yapılan simülasyon sonucunda; 
        bölgedeki ${data.risk} seviyesindeki sismik aktivite göz önüne alındığında, inşaat maliyetinin 
        zemin iyileştirme kalemleri nedeniyle %15-20 oranında artabileceği öngörülmektedir. 
        <strong>Sonuç:</strong> Bu bölge, ${studentCapacity} öğrenci kapasiteli bir ${ilce === 'EFELER' ? 'Merkez' : 'İlçe'} okulu için 
        ${playgroundArea > 1000 ? 'yüksek potansiyelli ve ferah' : 'uygun ancak sınırlı bahçe alanına sahip'} bir yatırım alanıdır.
      </p>
    </div>
  `;
  
  if (selectedLand) {
    resultsDiv.scrollIntoView({ behavior: 'smooth' });
  }
}

// ============================================================
// EMERGENCY (SİVİL SAVUNMA) ANALİZ FONKSİYONLARI
// ============================================================

function runEmergencyAnalysis() {
  const ilce = document.getElementById("emergencyIlce").value;
  const data = EMERGENCY_DATA[ilce];
  const resultsDiv = document.getElementById("emergencyResults");
  if (!data) {
    resultsDiv.innerHTML = `<div class="analysis-placeholder" style="color:#f87171">Bu ilçe için veri bulunamadı.</div>`;
    return;
  }

  const score = data.readiness_score;
  const scoreColor = score >= 75 ? '#22c55e' : score >= 55 ? '#f59e0b' : '#ef4444';
  const scoreLabel = score >= 75 ? 'İyi' : score >= 55 ? 'Orta' : 'Yetersiz';
  const circ = 2 * Math.PI * 38;
  const filled = circ * (1 - score / 100);

  function val(v, goodFn) {
    if (!v || v === 'Yok' || v === 'Mevcut Değil') return `<span class="em-card-val bad">${v || 'Yok'}</span>`;
    const isGood = goodFn ? goodFn(v) : true;
    return `<span class="em-card-val ${isGood ? 'good' : 'warn'}">${v}</span>`;
  }

  // Siren codes
  const sirenRows = Object.entries(SIREN_CODES).map(([k, v]) =>
    `<tr><td><strong>${k}</strong></td><td style="color:var(--text-dim);font-size:11px">${v.sound}</td><td style="color:#fca5a5;font-weight:600">${v.action}</td></tr>`
  ).join('');

  // Bag items
  const bagHtml = EMERGENCY_BAG_CONTENTS.zorunlu.map(item =>
    `<div class="bag-item"><span class="bag-icon">${item.icon}</span><div><div class="bag-item-name">${item.item}</div><div class="bag-item-desc">${item.detail}</div></div></div>`
  ).join('');

  resultsDiv.innerHTML = `
    <!-- SCORE HEADER -->
    <div class="analysis-card" style="background:linear-gradient(135deg,#1a0505,#2d0a0a);border-color:rgba(239,68,68,0.3);margin-bottom:0">
      <div style="display:flex;align-items:center;gap:24px;flex-wrap:wrap">
        <div class="readiness-ring-wrap">
          <div class="readiness-ring">
            <svg width="100" height="100" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="8"/>
              <circle cx="50" cy="50" r="38" fill="none" stroke="${scoreColor}" stroke-width="8"
                stroke-dasharray="${circ}" stroke-dashoffset="${filled}" stroke-linecap="round"
                style="transition:stroke-dashoffset 1.5s ease"/>
            </svg>
            <div class="readiness-ring-label" style="color:${scoreColor}">${score}</div>
          </div>
          <div style="font-size:11px;color:var(--text-dim);text-align:center">${scoreLabel}</div>
        </div>
        <div style="flex:1;min-width:200px">
          <div style="font-size:18px;font-weight:700;color:#fca5a5;margin-bottom:6px">🛡️ ${ilce} — Sivil Savunma Hazırlık Durumu</div>
          <div style="font-size:12px;color:var(--text-dim);line-height:1.7">${data.district_note}</div>
          <div class="score-bar-wrap">
            <div style="font-size:10px;color:var(--text-dim);margin-bottom:4px;text-transform:uppercase;letter-spacing:1px">Hazırlık Skoru</div>
            <div class="score-bar-bg"><div class="score-bar-fill" style="width:${score}%;background:${scoreColor}"></div></div>
          </div>
        </div>
      </div>
    </div>

    <!-- CARDS GRID -->
    <div class="em-grid">

      <!-- Sığınak -->
      <div class="em-card">
        <div class="em-card-title">🏚️ En Yakın Sığınak</div>
        <div class="em-card-row"><span class="em-card-key">Ad</span>${val(data.shelter.name)}</div>
        <div class="em-card-row"><span class="em-card-key">Adres</span><span class="em-card-val">${data.shelter.address}</span></div>
        <div class="em-card-row"><span class="em-card-key">Tahmini Mesafe</span>${val(data.shelter.distance_school)}</div>
        <div class="em-card-row"><span class="em-card-key">Kapasite</span><span class="em-card-val">${data.shelter.capacity.toLocaleString('tr-TR')} kişi</span></div>
        <div class="em-card-row"><span class="em-card-key">Tür</span><span class="em-card-val">${data.shelter.type}</span></div>
        <div class="em-card-row"><span class="em-card-key">Hava Filtresi</span>${val(data.shelter.air_filter ? 'Mevcut ✅' : 'Yok ⚠️', v => v.includes('✅'))}</div>
        <div class="em-card-row"><span class="em-card-key">Yedek Güç</span>${val(data.shelter.power_backup ? 'Mevcut ✅' : 'Yok ⚠️', v => v.includes('✅'))}</div>
        <div class="em-card-row"><span class="em-card-key">Derinlik</span><span class="em-card-val">${data.shelter.depth_m} m</span></div>
        <a href="https://www.google.com/maps/search/?api=1&query=${data.shelter.lat},${data.shelter.lng}" target="_blank"
           style="display:block;margin-top:12px;text-align:center;background:rgba(74,158,255,0.1);border:1px solid rgba(74,158,255,0.3);border-radius:6px;padding:8px;font-size:12px;color:#60a5fa;text-decoration:none">
          🗺️ Google Maps’te Yakından Gör
        </a>
      </div>

      <!-- Toplanma -->
      <div class="em-card">
        <div class="em-card-title">🏟️ Acil Durum Toplanma Merkezi</div>
        <div class="em-card-row"><span class="em-card-key">Ad</span>${val(data.assembly.name)}</div>
        <div class="em-card-row"><span class="em-card-key">Adres</span><span class="em-card-val">${data.assembly.address}</span></div>
        <div class="em-card-row"><span class="em-card-key">Mesafe</span>${val(data.assembly.distance_school)}</div>
        <div class="em-card-row"><span class="em-card-key">Kapasite</span><span class="em-card-val">${data.assembly.capacity_persons.toLocaleString('tr-TR')} kişi</span></div>
        <div class="em-card-row"><span class="em-card-key">Tür</span><span class="em-card-val">${data.assembly.type}</span></div>
        <a href="https://www.google.com/maps/search/?api=1&query=${data.assembly.lat},${data.assembly.lng}" target="_blank"
           style="display:block;margin-top:12px;text-align:center;background:rgba(74,158,255,0.1);border:1px solid rgba(74,158,255,0.3);border-radius:6px;padding:8px;font-size:12px;color:#60a5fa;text-decoration:none">
          🗺️ Google Maps’te Yakından Gör
        </a>
      </div>

      <!-- Acil Merkezi -->
      <div class="em-card">
        <div class="em-card-title">🏥 Acil Durum Merkezi</div>
        <div class="em-card-row"><span class="em-card-key">Ad</span>${val(data.emergency_center.name)}</div>
        <div class="em-card-row"><span class="em-card-key">Mesafe</span>${val(data.emergency_center.distance_school)}</div>
        <div class="em-card-row"><span class="em-card-key">Telefon</span><span class="em-card-val">${data.emergency_center.phone}</span></div>
        <div class="em-card-row" style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border)">
          <span class="em-card-key">AFAD</span><span class="em-card-val" style="color:#ef4444;font-size:16px;font-weight:800">122</span>
        </div>
        <div class="em-card-row">
          <span class="em-card-key">112 Acil</span><span class="em-card-val" style="color:#ef4444;font-size:16px;font-weight:800">112</span>
        </div>
        <div class="em-card-row">
          <span class="em-card-key">İtfaiye</span><span class="em-card-val" style="color:#f59e0b;font-size:16px;font-weight:800">110</span>
        </div>
        <div class="em-card-row">
          <span class="em-card-key">Emniyet</span><span class="em-card-val" style="color:#60a5fa;font-size:16px;font-weight:800">155</span>
        </div>
        <a href="https://www.google.com/maps/search/?api=1&query=${data.emergency_center.lat},${data.emergency_center.lng}" target="_blank"
           style="display:block;margin-top:12px;text-align:center;background:rgba(74,158,255,0.1);border:1px solid rgba(74,158,255,0.3);border-radius:6px;padding:8px;font-size:12px;color:#60a5fa;text-decoration:none">
          🗺️ Google Maps’te Yakından Gör
        </a>
      </div>

      <!-- İkaz Sistemi -->
      <div class="em-card">
        <div class="em-card-title">📢 İkaz ve Alarm Sistemi</div>
        <div class="em-card-row"><span class="em-card-key">Siren Mevcut</span>${val(data.alert_system.has_siren ? 'Evet ✅' : 'Hayır ❌', v => v.includes('✅'))}</div>
        <div class="em-card-row"><span class="em-card-key">Siren Türü</span><span class="em-card-val">${data.alert_system.type}</span></div>
        <div class="em-card-row"><span class="em-card-key">Siren Sayısı</span><span class="em-card-val">${data.alert_system.siren_count} adet</span></div>
        <div class="em-card-row"><span class="em-card-key">Etki Yarıçapı</span><span class="em-card-val">${data.alert_system.radius_km} km</span></div>
        <div class="em-card-row"><span class="em-card-key">Test Takvimi</span><span class="em-card-val" style="font-size:11px">${data.alert_system.test_schedule}</span></div>
        <div class="em-card-row"><span class="em-card-key">AFAD Radyo</span><span class="em-card-val">${data.alert_system.afad_radio}</span></div>
        <div class="em-card-row"><span class="em-card-key">Yerel FM</span><span class="em-card-val">${data.alert_system.local_radio}</span></div>
        ${data.alert_system.note ? `<div style="margin-top:10px;padding:8px;background:rgba(245,158,11,0.1);border-radius:6px;font-size:11px;color:#fcd34d">⚠️ ${data.alert_system.note}</div>` : ''}
      </div>

      <!-- Karartma -->
      <div class="em-card">
        <div class="em-card-title">🌑 Karartma Tedbirleri</div>
        <div class="em-card-row"><span class="em-card-key">Protokol</span>${val(data.blackout.protocol, v => v.includes('Aktif'))}</div>
        <div class="em-card-row"><span class="em-card-key">Perde Türü</span><span class="em-card-val">${data.blackout.curtain_type}</span></div>
        <div class="em-card-row"><span class="em-card-key">Jeneratör Süresi</span>${val(data.blackout.generator_hours > 0 ? data.blackout.generator_hours + ' saat' : 'Yok', v => !v.includes('Yok'))}</div>
        <div class="em-card-row"><span class="em-card-key">Acil Aydınlatma</span>${val(data.blackout.emergency_lighting, v => !v.includes('Yok'))}</div>
        <div class="em-card-row"><span class="em-card-key">Pencere Örtüsü</span><span class="em-card-val">${data.blackout.window_cover}</span></div>
        <div class="em-card-row"><span class="em-card-key">Dış Işık Söndürme</span>${val(data.blackout.exterior_light_disable ? 'Evet ✅' : 'Hayır ⚠️', v => v.includes('✅'))}</div>
        ${data.blackout.note ? `<div style="margin-top:10px;padding:8px;background:rgba(100,100,100,0.15);border-radius:6px;font-size:11px;color:#9ca3af">💡 ${data.blackout.note}</div>` : ''}
      </div>

      <!-- Korunma & Gizlilik -->
      <div class="em-card">
        <div class="em-card-title">🔐 Korunaklılık ve Gizlilik</div>
        <div class="em-card-row">
          <span class="em-card-key">Yapı Sınıfı</span>
          <span class="em-card-val ${data.protection.structural_class.startsWith('A') ? 'good' : data.protection.structural_class.startsWith('B') ? 'warn' : 'bad'}">${data.protection.structural_class}</span>
        </div>
        <div class="em-card-row"><span class="em-card-key">Yeraltı Sığınak</span>${val(data.protection.underground_shelter, v => v.includes('Mevcut'))}</div>
        <div class="em-card-row"><span class="em-card-key">Görünürlük</span><span class="em-card-val">${data.protection.visibility}</span></div>
        <div class="em-card-row"><span class="em-card-key">Gizlilik Seviyesi</span>${val(data.protection.concealment_level, v => v === 'İyi' || v === 'Çok İyi')}</div>
        <div class="em-card-row"><span class="em-card-key">Patlama Dayanımı</span><span class="em-card-val">${data.protection.blast_resistance}</span></div>
        ${data.protection.note ? `<div style="margin-top:10px;padding:8px;background:rgba(99,102,241,0.1);border-radius:6px;font-size:11px;color:#a5b4fc">🔍 ${data.protection.note}</div>` : ''}
      </div>

      <!-- İletişim -->
      <div class="em-card">
        <div class="em-card-title">📡 İletişim ve Bilgi İmkânları</div>
        <div class="em-card-row"><span class="em-card-key">TRT Radyo</span><span class="em-card-val">${data.communication.radio.split('+')[0].trim()}</span></div>
        <div class="em-card-row"><span class="em-card-key">AFAD FM</span><span class="em-card-val">${data.alert_system.afad_radio}</span></div>
        <div class="em-card-row"><span class="em-card-key">Kısa Dalga</span><span class="em-card-val">${data.communication.shortwave}</span></div>
        <div class="em-card-row"><span class="em-card-key">AFAD SMS</span><span class="em-card-val">111</span></div>
        <div class="em-card-row"><span class="em-card-key">AFAD Uygulama</span><span class="em-card-val">${data.communication.afad_app}</span></div>
        <div class="em-card-row"><span class="em-card-key">İnternet Yedek</span>${val(data.communication.internet_backup, v => !v.includes('Yok') && !v.includes('3G'))}</div>
        ${data.communication.note ? `<div style="margin-top:10px;padding:8px;background:rgba(6,182,212,0.1);border-radius:6px;font-size:11px;color:#67e8f9">📡 ${data.communication.note}</div>` : ''}
      </div>

      <!-- Acil Çanta -->
      <div class="em-card" style="grid-column: span 1">
        <div class="em-card-title">🎒 Acil Durum Çantası İçeriği</div>
        <div class="bag-list">${bagHtml}</div>
      </div>

    </div>

    <!-- İKAZ SİNYAL KODLARI -->
    <div class="analysis-card" style="margin-top:20px">
      <div class="card-title">📢 İkaz ve Alarm Sinyal Kodları</div>
      <table class="siren-table">
        <tr><th>Alarm Türü</th><th>Ses Özelliği</th><th>Yapılacak İşlem</th></tr>
        ${sirenRows}
      </table>
    </div>
  `;
}

// ============================================================
// ANİMASYON KONTROL FONKSİYONLARI
// ============================================================

function startAnimation() {
  if (!animator) initAnimator();
  const scenario = document.getElementById('animScenario').value;
  const level = document.getElementById('animLevel').value;
  animator.setScenario(scenario, level);
  animator.start();
  document.getElementById('pauseBtn').textContent = '⏸ Duraklat';
  updateSceneCounter();
  const ticker = setInterval(() => {
    updateSceneCounter();
    if (!animator.running) clearInterval(ticker);
  }, 300);
}

function quickStart(scenario, level) {
  // Switch to video tab first
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => { if (t.dataset.tab === 'video') t.classList.add('active'); });
  document.getElementById('chatArea').classList.remove('active');
  document.getElementById('analysisArea').classList.remove('active');
  document.getElementById('emergencyArea').classList.remove('active');
  document.getElementById('videoArea').classList.add('active');
  document.querySelector('.input-area').style.display = 'none';
  document.getElementById('chatFiltersBox').style.display = 'none';
  // Set selectors
  document.getElementById('animScenario').value = scenario;
  document.getElementById('animLevel').value = level;
  // Small delay for canvas to be visible/sized
  setTimeout(() => startAnimation(), 100);
}

function animPrev() {
  if (!animator) return;
  animator.prev();
  updateSceneCounter();
}

function animNext() {
  if (!animator) return;
  animator.next();
  updateSceneCounter();
}

function animTogglePause() {
  if (!animator) return;
  const paused = animator.togglePause();
  document.getElementById('pauseBtn').textContent = paused ? '▶ Devam Et' : '⏸ Duraklat';
}

function animStop() {
  if (!animator) return;
  animator.stop();
  document.getElementById('pauseBtn').textContent = '⏸ Duraklat';
  document.getElementById('sceneCounter').textContent = 'Sahne: — / —';
}

function updateSceneCounter() {
  if (!animator || !animator.scenes) return;
  const cur = animator.getCurrent() + 1;
  const tot = animator.getTotal();
  document.getElementById('sceneCounter').textContent = `Sahne: ${cur} / ${tot}`;
}

