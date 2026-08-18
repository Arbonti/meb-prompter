/**
 * MEB Aydın — Acil Durum Eğitim Animasyon Motoru
 * Canvas tabanlı, İlkokul / Ortaokul / Lise için uyarlanmış
 */

class EmergencyAnimator {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.scenario = null;
    this.level = 'primary';
    this.currentScene = 0;
    this.scenes = [];
    this.running = false;
    this.paused = false;
    this.sceneStartTime = 0;
    this.SCENE_DURATION = 5500;
    this.animId = null;
    this._resize();
    window.addEventListener('resize', () => this._resize());
  }

  _resize() {
    const wrap = this.canvas.parentElement;
    if (!wrap) return;
    this.canvas.width = wrap.clientWidth || 700;
    this.canvas.height = Math.min(420, this.canvas.width * 0.56);
  }

  setScenario(scenario, level) {
    this.scenario = scenario;
    this.level = level;
    this.currentScene = 0;
    this.scenes = scenario === 'war' ? this._warScenes() : this._quakeScenes();
    this.stop();
  }

  start() {
    this.running = true; this.paused = false;
    this.currentScene = 0;
    this.sceneStartTime = performance.now();
    if (this.animId) cancelAnimationFrame(this.animId);
    this._tick();
  }

  stop() {
    this.running = false;
    if (this.animId) cancelAnimationFrame(this.animId);
    this.animId = null;
    if (this.ctx) {
      const { width: w, height: h } = this.canvas;
      this.ctx.clearRect(0, 0, w, h);
      this.ctx.fillStyle = '#0d1117';
      this.ctx.fillRect(0, 0, w, h);
    }
  }

  togglePause() {
    this.paused = !this.paused;
    if (!this.paused) { this.sceneStartTime = performance.now() - (this._lastT || 0) * this.SCENE_DURATION; this._tick(); }
    return this.paused;
  }

  next() { if (this.currentScene < this.scenes.length - 1) { this.currentScene++; this.sceneStartTime = performance.now(); } }
  prev() { if (this.currentScene > 0) { this.currentScene--; this.sceneStartTime = performance.now(); } }
  getTotal() { return this.scenes.length; }
  getCurrent() { return this.currentScene; }

  _tick() {
    if (!this.running || this.paused) return;
    const now = performance.now();
    let t = (now - this.sceneStartTime) / this.SCENE_DURATION;
    this._lastT = t;
    if (t >= 1) {
      if (this.currentScene < this.scenes.length - 1) {
        this.currentScene++;
        this.sceneStartTime = now;
        t = 0;
      } else { t = 1; this.running = false; }
    }
    this._draw(t);
    if (this.running) this.animId = requestAnimationFrame(() => this._tick());
  }

  _draw(t) {
    const ctx = this.ctx, w = this.canvas.width, h = this.canvas.height;
    const scene = this.scenes[this.currentScene];
    ctx.clearRect(0, 0, w, h);

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, scene.bg0 || '#0d1117');
    bg.addColorStop(1, scene.bg1 || '#1a1f2e');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Scene draw
    scene.draw(ctx, t, w, h, this.level);

    // Top bar
    this._drawTopBar(ctx, w, scene);
    // Bottom progress + dots
    this._drawProgress(ctx, w, h, t);
    this._drawDots(ctx, w, h);
  }

  _drawTopBar(ctx, w, scene) {
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, 0, w, 52);
    ctx.font = 'bold 15px Inter, sans-serif';
    ctx.fillStyle = scene.titleColor || '#fff';
    ctx.textAlign = 'left';
    ctx.fillText(scene.title, 16, 33);
    // Scenario badge
    const badge = this.scenario === 'war' ? '🛡️ SAVAŞ/HAVA SALDIRISI' : '🌍 DEPREM';
    const col = this.scenario === 'war' ? '#ef4444' : '#f59e0b';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillStyle = col;
    ctx.textAlign = 'right';
    ctx.fillText(badge, w - 12, 21);
    const lvlMap = { primary: 'İLKOKUL', middle: 'ORTAOKUL', high: 'LİSE' };
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText(lvlMap[this.level] || '', w - 12, 36);
    ctx.textAlign = 'left';
  }

  _drawProgress(ctx, w, h, t) {
    const barH = 5, col = this.scenario === 'war' ? '#ef4444' : '#f59e0b';
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(0, h - barH, w, barH);
    ctx.fillStyle = col;
    ctx.fillRect(0, h - barH, w * t, barH);
  }

  _drawDots(ctx, w, h) {
    const n = this.scenes.length, sp = 16, r = 4;
    const sx = (w - (n - 1) * sp) / 2;
    const col = this.scenario === 'war' ? '#ef4444' : '#f59e0b';
    for (let i = 0; i < n; i++) {
      ctx.beginPath();
      ctx.arc(sx + i * sp, h - 18, r, 0, Math.PI * 2);
      ctx.fillStyle = i === this.currentScene ? col : 'rgba(255,255,255,0.2)';
      ctx.fill();
    }
  }

  /* ============ HELPERS ============ */
  _text(ctx, text, x, y, opts = {}) {
    ctx.save();
    ctx.font = `${opts.weight || 'bold'} ${opts.size || 18}px Inter, sans-serif`;
    ctx.fillStyle = opts.color || '#fff';
    ctx.textAlign = opts.align || 'center';
    ctx.shadowColor = opts.shadow || 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = opts.blur || 8;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  _person(ctx, x, y, scale = 1, opts = {}) {
    const s = scale;
    ctx.save();
    ctx.translate(x, y);
    // Head
    ctx.beginPath();
    ctx.arc(0, -38 * s, 14 * s, 0, Math.PI * 2);
    ctx.fillStyle = opts.skin || '#FBBF77';
    ctx.fill();
    ctx.strokeStyle = opts.outline || 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Body
    ctx.fillStyle = opts.shirt || '#4a9eff';
    ctx.beginPath();
    ctx.roundRect(-10 * s, -24 * s, 20 * s, 30 * s, 4 * s);
    ctx.fill();
    // Legs
    ctx.strokeStyle = opts.pants || '#1e3a5f';
    ctx.lineWidth = 6 * s;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-6 * s, 6 * s); ctx.lineTo(-8 * s, 30 * s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(6 * s, 6 * s); ctx.lineTo(8 * s, 30 * s); ctx.stroke();
    // Arms
    const armAngle = opts.armAngle || 0.4;
    ctx.strokeStyle = opts.skin || '#FBBF77';
    ctx.lineWidth = 5 * s;
    ctx.beginPath(); ctx.moveTo(-10 * s, -18 * s); ctx.lineTo(-22 * s, (-18 + 16 * Math.sin(armAngle)) * s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(10 * s, -18 * s); ctx.lineTo(22 * s, (-18 + 16 * Math.sin(armAngle)) * s); ctx.stroke();
    // Expression
    if (opts.expr !== 'none') {
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (opts.expr === 'scared') { ctx.arc(0, -35 * s, 5 * s, 0.2, Math.PI - 0.2); }
      else if (opts.expr === 'calm') { ctx.arc(0, -37 * s, 5 * s, Math.PI + 0.3, -0.3); }
      else { ctx.arc(0, -36 * s, 4 * s, 0.2, Math.PI - 0.2); }
      ctx.stroke();
      // Eyes
      ctx.fillStyle = '#333';
      ctx.beginPath(); ctx.arc(-5 * s, -41 * s, 2 * s, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(5 * s, -41 * s, 2 * s, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  _teacher(ctx, x, y, scale = 1) {
    this._person(ctx, x, y, scale, { shirt: '#7c3aed', pants: '#4c1d95', expr: 'calm', armAngle: -0.8 });
  }

  _building(ctx, x, y, w, h, opts = {}) {
    ctx.fillStyle = opts.color || '#2d3748';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = opts.border || '#4a5568';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    // Windows
    const wc = opts.windows || '#60a5fa';
    const rows = opts.rows || 2, cols = opts.cols || 3;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.fillStyle = opts.dark ? '#1a1a1a' : wc;
        ctx.fillRect(x + 10 + c * ((w - 20) / cols), y + 10 + r * 28, (w - 20) / cols - 8, 18);
      }
    }
  }

  _speechBubble(ctx, text, x, y, opts = {}) {
    const fontSize = opts.size || 13;
    ctx.font = `bold ${fontSize}px Inter, sans-serif`;
    const tw = ctx.measureText(text).width;
    const bw = tw + 24, bh = fontSize + 18;
    const bx = x - bw / 2, by = y - bh - 8;
    ctx.fillStyle = opts.bg || 'rgba(255,255,255,0.95)';
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 8);
    ctx.fill();
    // Tail
    ctx.beginPath();
    ctx.moveTo(x - 8, by + bh); ctx.lineTo(x, by + bh + 8); ctx.lineTo(x + 8, by + bh);
    ctx.fillStyle = opts.bg || 'rgba(255,255,255,0.95)';
    ctx.fill();
    ctx.fillStyle = opts.textColor || '#1a1a1a';
    ctx.fillText(text, x, by + bh - 6);
    ctx.textAlign = 'left';
  }

  _sirenFlash(ctx, w, h, t, color = 'rgba(239,68,68,') {
    const alpha = Math.abs(Math.sin(t * Math.PI * 8)) * 0.25;
    ctx.fillStyle = color + alpha + ')';
    ctx.fillRect(0, 0, w, h);
  }

  _shake(ctx, t, intensity = 4) {
    const dx = (Math.random() - 0.5) * intensity * Math.sin(t * Math.PI * 20);
    const dy = (Math.random() - 0.5) * intensity * Math.sin(t * Math.PI * 25);
    ctx.translate(dx, dy);
  }

  _stepBadge(ctx, step, text, x, y, active, col) {
    ctx.fillStyle = active ? col : 'rgba(255,255,255,0.15)';
    ctx.beginPath(); ctx.arc(x, y, 13, 0, Math.PI * 2); ctx.fill();
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(step, x, y + 4);
    ctx.font = '11px Inter, sans-serif';
    ctx.fillStyle = active ? '#fff' : 'rgba(255,255,255,0.5)';
    ctx.fillText(text, x, y + 22);
    ctx.textAlign = 'left';
  }

  _infoBox(ctx, lines, x, y, w, opts = {}) {
    const lh = 22, padY = 12, padX = 14;
    const bh = lines.length * lh + padY * 2;
    ctx.fillStyle = opts.bg || 'rgba(0,0,0,0.55)';
    ctx.beginPath(); ctx.roundRect(x, y, w, bh, 10); ctx.fill();
    ctx.strokeStyle = opts.border || 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.font = opts.font || '12px Inter, sans-serif';
    ctx.textAlign = 'left';
    lines.forEach((line, i) => {
      ctx.fillStyle = i === 0 ? (opts.titleColor || '#f59e0b') : (opts.textColor || '#e2e8f0');
      if (i === 0) ctx.font = `bold ${opts.titleSize || 12}px Inter, sans-serif`;
      else ctx.font = opts.font || '12px Inter, sans-serif';
      ctx.fillText(line, x + padX, y + padY + 14 + i * lh);
    });
  }

  /* ============ WAR SCENES ============ */
  _warScenes() {
    const lv = this.level;
    return [
      // Scene 1: Siren
      {
        title: '⚠️ 1. ADIM — İkaz Sireni Duyuldu!',
        bg0: '#1a0505', bg1: '#3b0a0a', titleColor: '#fca5a5',
        draw: (ctx, t, w, h) => {
          this._sirenFlash(ctx, w, h, t, 'rgba(239,68,68,');
          // Siren tower
          const sx = w / 2, sy = h * 0.55;
          ctx.fillStyle = '#6b7280'; ctx.fillRect(sx - 6, sy - 60, 12, 60); 
          ctx.fillStyle = '#ef4444';
          ctx.beginPath(); ctx.arc(sx, sy - 65, 18, 0, Math.PI * 2); ctx.fill();
          // Sound waves
          for (let i = 1; i <= 3; i++) {
            const r = 30 + i * 20 + Math.sin(t * Math.PI * 4) * 8;
            const a = Math.max(0, 0.7 - i * 0.2 - t * 0.3);
            ctx.beginPath(); ctx.arc(sx, sy - 65, r, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(239,68,68,${a})`; ctx.lineWidth = 2; ctx.stroke();
          }
          // People reacting
          this._person(ctx, w * 0.25, h * 0.72, 0.9, { expr: 'scared', shirt: '#3b82f6' });
          this._person(ctx, w * 0.75, h * 0.72, 0.9, { expr: 'scared', shirt: '#10b981' });
          const msg = lv === 'primary' ? '🚨 SİREN ÇALIYOR! Panik yapma!' : 'İkaz sireni = Tehlike sinyali. Sakin kal!';
          this._text(ctx, msg, w / 2, h * 0.85, { size: lv === 'primary' ? 17 : 14, color: '#fca5a5' });
          if (lv !== 'primary') this._infoBox(ctx, ['Siren Türü', '• Yükselen ton 3 dk = Hava tehlikesi', '• Sabit ton 1 dk = Tehlike geçti'], w * 0.03, h * 0.58, 210);
        }
      },
      // Scene 2: Panik Yapma
      {
        title: '😤 2. ADIM — SAKİN KAL!',
        bg0: '#0a1628', bg1: '#1e3a5f', titleColor: '#93c5fd',
        draw: (ctx, t, w, h) => {
          this._teacher(ctx, w / 2, h * 0.6, 1.1);
          this._speechBubble(ctx, lv === 'primary' ? '🌟 Sakin olun! Beni dinleyin!' : 'Acele etmeyin, panik yapmayın!', w / 2, h * 0.28, { size: 14 });
          this._person(ctx, w * 0.28, h * 0.68, 0.85, { shirt: '#3b82f6', expr: 'calm' });
          this._person(ctx, w * 0.72, h * 0.68, 0.85, { shirt: '#ec4899', expr: 'calm' });
          this._person(ctx, w * 0.18, h * 0.72, 0.8, { shirt: '#10b981', expr: 'calm' });
          this._person(ctx, w * 0.82, h * 0.72, 0.8, { shirt: '#f59e0b', expr: 'calm' });
          const tip = lv === 'primary' ? '👩‍🏫 Öğretmenini dinle! O ne derse onu yap.' : 'Öğretmenin talimatları hayat kurtarır.';
          this._text(ctx, tip, w / 2, h * 0.88, { size: 14, color: '#bfdbfe' });
          if (lv === 'high') this._infoBox(ctx, ['Görevli Öğrenci', '• Kapıyı kapat', '• Yoklama al', '• Öğretmene bildir'], w - 200, h * 0.55, 190);
        }
      },
      // Scene 3: Sığınağa Git
      {
        title: '🏚️ 3. ADIM — SIĞINAĞA GİDİN!',
        bg0: '#0f1117', bg1: '#1a1f2e', titleColor: '#a78bfa',
        draw: (ctx, t, w, h) => {
          // Building with shelter
          this._building(ctx, w * 0.05, h * 0.25, w * 0.35, h * 0.55, { dark: true, color: '#374151', rows: 2, cols: 3 });
          // Shelter entrance
          ctx.fillStyle = '#7c3aed';
          ctx.fillRect(w * 0.12, h * 0.72, 60, 8);
          ctx.font = 'bold 10px Inter, sans-serif';
          ctx.fillStyle = '#a78bfa'; ctx.textAlign = 'center';
          ctx.fillText('▼ SIĞINAK', w * 0.22, h * 0.83);
          ctx.textAlign = 'left';
          // Arrow path
          const prog = Math.min(t * 1.4, 1);
          ctx.strokeStyle = '#a78bfa'; ctx.lineWidth = 3;
          ctx.setLineDash([8, 4]);
          ctx.beginPath();
          ctx.moveTo(w * 0.65, h * 0.6);
          ctx.lineTo(w * 0.65 - (w * 0.65 - w * 0.22) * prog, h * 0.6 + (h * 0.78 - h * 0.6) * prog);
          ctx.stroke(); ctx.setLineDash([]);
          // People walking
          const px = w * 0.65 - (w * 0.65 - w * 0.38) * prog;
          this._person(ctx, px, h * 0.68, 0.9, { shirt: '#3b82f6', expr: 'calm', armAngle: Math.sin(t * 10) * 0.5 });
          this._person(ctx, px + 35, h * 0.68, 0.85, { shirt: '#ec4899', expr: 'calm' });
          const lines = lv === 'primary'
            ? ['📌 Sığınak Kuralları', '• Duvara yakın yürü', '• Koşma!', '• Arkadaşını bırakma']
            : ['📌 Sığınak Prosedürü', '• Sıralı ve düzenli ilerle', '• Çantanı al (varsa)', '• Pencerelerden uzak dur', '• Kapıları kapat'];
          this._infoBox(ctx, lines, w * 0.58, h * 0.25, 220);
        }
      },
      // Scene 4: Pencereden Uzak Dur
      {
        title: '🪟 4. ADIM — Pencerelerden Uzak Dur!',
        bg0: '#1a0a00', bg1: '#2d1a00', titleColor: '#fcd34d',
        draw: (ctx, t, w, h) => {
          this._sirenFlash(ctx, w, h, t * 0.5, 'rgba(251,191,36,');
          // Window
          const wx = w * 0.5 - 40, wy = h * 0.2;
          ctx.fillStyle = '#1e3a5f'; ctx.fillRect(wx, wy, 80, 100);
          ctx.strokeStyle = '#6b7280'; ctx.lineWidth = 4;
          ctx.strokeRect(wx, wy, 80, 100);
          // X danger sign
          const fade = 0.6 + Math.sin(t * Math.PI * 4) * 0.4;
          ctx.strokeStyle = `rgba(239,68,68,${fade})`; ctx.lineWidth = 5;
          ctx.beginPath(); ctx.moveTo(wx + 10, wy + 10); ctx.lineTo(wx + 70, wy + 90); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(wx + 70, wy + 10); ctx.lineTo(wx + 10, wy + 90); ctx.stroke();
          // Safe person
          this._person(ctx, w * 0.2, h * 0.7, 0.95, { shirt: '#10b981', expr: 'calm' });
          this._speechBubble(ctx, lv === 'primary' ? '✅ Duvarda duruyorum!' : '✅ Duvara yaslandım', w * 0.2, h * 0.43, { size: 12, bg: 'rgba(16,185,129,0.9)', textColor: '#fff' });
          // Danger tip
          const tips = lv === 'primary'
            ? ['⚠️ Cam tehlikeli!', '• Camdan uzak dur', '• Duvara yaslan', '• Otur veya eğil']
            : ['⚠️ Cam Kırılma Riski', '• Cam: 5m güvenli mesafe', '• Varsa perdeler kapat', '• Zemine eğilebilirsin', '• Başını kolla'];
          this._infoBox(ctx, tips, w * 0.55, h * 0.35, 215);
        }
      },
      // Scene 5: Karartma
      {
        title: '🌑 5. ADIM — Karartma Sağla!',
        bg0: '#000005', bg1: '#0a0a1a', titleColor: '#c4b5fd',
        draw: (ctx, t, w, h) => {
          this._building(ctx, w * 0.1, h * 0.15, w * 0.8, h * 0.65, { dark: true, color: '#111827', rows: 3, cols: 4 });
          // Curtain falling animation
          const curtH = Math.min(t * 2, 1) * 80;
          for (let c = 0; c < 4; c++) {
            ctx.fillStyle = '#1c1917';
            ctx.fillRect(w * 0.1 + 18 + c * (w * 0.8 / 4), h * 0.15 + 12, (w * 0.8 / 4) - 22, curtH);
          }
          const msg = lv === 'primary'
            ? '🌑 Tüm ışıkları söndür! Perdeleri kapat!'
            : 'Karartma: Düşmana konum bilgisi verme.';
          this._text(ctx, msg, w / 2, h * 0.88, { size: 14, color: '#c4b5fd' });
          const info = ['🌑 Karartma Adımları', '• Tüm ışıkları kapat', '• Koyu renk perdeleri çek', '• Dış kapı/pencere ışığı yok', '• Jeneratör kızıl ışık modu'];
          this._infoBox(ctx, info, w * 0.05, h * 0.4, 200, { border: 'rgba(196,181,253,0.3)', titleColor: '#c4b5fd' });
        }
      },
      // Scene 6: Toplanma Noktası
      {
        title: '🏟️ 6. ADIM — Toplanma Noktasına Git!',
        bg0: '#052e16', bg1: '#064e3b', titleColor: '#6ee7b7',
        draw: (ctx, t, w, h) => {
          // Ground
          ctx.fillStyle = '#14532d';
          ctx.fillRect(0, h * 0.78, w, h * 0.22);
          // Assembly sign
          ctx.fillStyle = '#059669';
          ctx.fillRect(w / 2 - 70, h * 0.35, 140, 45);
          ctx.font = 'bold 14px Inter, sans-serif';
          ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
          ctx.fillText('🏟️ TOPLANMA ALANI', w / 2, h * 0.37 + 20);
          // People gathering
          const positions = [0.2, 0.35, 0.5, 0.65, 0.8];
          positions.forEach((px, i) => {
            const delay = i * 0.15;
            const prog = Math.max(0, Math.min((t - delay) * 2, 1));
            const py = h * 0.55 + (h * 0.78 - h * 0.55) * (1 - prog);
            this._person(ctx, w * px, py, 0.8, { shirt: ['#3b82f6','#ec4899','#10b981','#f59e0b','#8b5cf6'][i], expr: 'calm' });
          });
          const info = lv === 'primary'
            ? ['✅ Toplanmak için:', '• Öğretmeni takip et', '• Yer: Okul bahçesi / stadyum', '• Birbirini bırakma']
            : ['✅ Toplanma Protokolü', '• Birincil: Okul bahçesi açık alanı', '• İkincil: İlçe stadyumu', '• Yoklama alınır', '• Veli bilgilendirmesi başlar'];
          this._infoBox(ctx, info, w * 0.04, h * 0.2, 200, { titleColor: '#6ee7b7' });
          ctx.textAlign = 'left';
        }
      },
      // Scene 7: Acil İletişim
      {
        title: '📻 7. ADIM — Acil İletişim Kanalları',
        bg0: '#1c1917', bg1: '#292524', titleColor: '#fbbf24',
        draw: (ctx, t, w, h) => {
          // Radio illustration
          const rx = w / 2 - 50, ry = h * 0.2;
          ctx.fillStyle = '#374151'; ctx.fillRect(rx, ry, 100, 70);
          ctx.fillStyle = '#1f2937'; ctx.fillRect(rx + 8, ry + 8, 60, 40);
          ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(rx + 85, ry + 20, 10, 0, Math.PI * 2); ctx.stroke();
          // Antenna
          ctx.strokeStyle = '#9ca3af'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(rx + 80, ry); ctx.lineTo(rx + 60, ry - 30); ctx.stroke();
          // Signal waves
          for (let i = 1; i <= 3; i++) {
            const a = Math.abs(Math.sin(t * Math.PI * 3 + i)) * 0.7;
            ctx.strokeStyle = `rgba(251,191,36,${a})`; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.arc(rx + 60, ry - 30, i * 12, -Math.PI / 2, 0); ctx.stroke();
          }
          const channels = [
            ['📻 TRT Radyo 1', 'AM 567 kHz'],
            ['📡 AFAD FM', '89.8 MHz'],
            ['📱 AFAD Mobil', 'iOS & Android'],
            ['📞 AFAD Acil', '122'],
            ['🚑 112 Acil', 'Sağlık']
          ];
          channels.forEach(([label, val], i) => {
            const cx = w * 0.08 + (i % 2) * (w * 0.46), cy = h * 0.52 + Math.floor(i / 2) * 48;
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.beginPath(); ctx.roundRect(cx, cy, w * 0.42, 38, 8); ctx.fill();
            ctx.font = 'bold 12px Inter, sans-serif'; ctx.fillStyle = '#fbbf24'; ctx.textAlign = 'left';
            ctx.fillText(label, cx + 10, cy + 15);
            ctx.font = '11px Inter, sans-serif'; ctx.fillStyle = '#e5e7eb';
            ctx.fillText(val, cx + 10, cy + 30);
          });
          ctx.textAlign = 'left';
        }
      },
      // Scene 8: Veli Koordinasyonu
      {
        title: '👨‍👩‍👧 8. ADIM — Veli Koordinasyonu',
        bg0: '#0c1445', bg1: '#1e3a8a', titleColor: '#93c5fd',
        draw: (ctx, t, w, h) => {
          // Child
          this._person(ctx, w * 0.3, h * 0.6, 1.0, { shirt: '#3b82f6', expr: 'calm' });
          // Parent approaching
          const parentX = w * 0.9 - (w * 0.9 - w * 0.62) * Math.min(t * 1.5, 1);
          this._person(ctx, parentX, h * 0.57, 1.1, { shirt: '#6d28d9', skin: '#d4a470', expr: 'calm' });
          // School sign
          ctx.fillStyle = '#1e3a8a';
          ctx.beginPath(); ctx.roundRect(w * 0.35, h * 0.18, 160, 35, 8); ctx.fill();
          ctx.font = 'bold 13px Inter, sans-serif'; ctx.fillStyle = '#93c5fd'; ctx.textAlign = 'center';
          ctx.fillText('🏫 OKUL TOPLANMA ALANI', w * 0.35 + 80, h * 0.18 + 22);
          ctx.textAlign = 'left';
          const rules = lv === 'primary'
            ? ['👨‍👩‍👧 Veli Gelince:', '• Yalnız gitme!', '• Sadece velini bekle', '• Öğretmenden izin al']
            : ['👨‍👩‍👧 Veli Bilgilendirme:', '• Okul SMS sistemi aktif', '• Toplanma noktasında bekle', '• Kimlik kontrolü', '• Veli imzası ile teslim'];
          this._infoBox(ctx, rules, w * 0.04, h * 0.28, 200, { titleColor: '#93c5fd' });
          const msg = lv === 'primary' ? '🌟 Velini bekle, yalnız ayrılma!' : 'Veli yoklama listesi, okul yönetimi tarafından tutulur.';
          this._text(ctx, msg, w / 2, h * 0.88, { size: 13, color: '#bfdbfe' });
        }
      },
      // Scene 9: Özet
      {
        title: '✅ ÖZET — Her Zaman Hazır Ol!',
        bg0: '#0f1117', bg1: '#1a1f2e',
        draw: (ctx, t, w, h) => {
          const steps = ['1. Siren duyunca sakin kal','2. Öğretmeni dinle','3. Sığınağa git','4. Camdan uzak dur','5. Karartma sağla','6. Toplanma noktası','7. Radyo dinle','8. Velini bekle'];
          const cols = 2, rows = 4;
          const cw = w / cols - 20, ch = (h * 0.75) / rows;
          steps.forEach((s, i) => {
            const cx = 12 + (i % cols) * (cw + 16);
            const cy = h * 0.1 + Math.floor(i / cols) * ch;
            const prog = Math.min(Math.max((t * 3 - i * 0.3), 0), 1);
            ctx.globalAlpha = prog;
            ctx.fillStyle = 'rgba(239,68,68,0.15)';
            ctx.beginPath(); ctx.roundRect(cx, cy, cw, ch - 6, 8); ctx.fill();
            ctx.strokeStyle = 'rgba(239,68,68,0.4)'; ctx.lineWidth = 1;
            ctx.stroke();
            ctx.font = 'bold 12px Inter, sans-serif'; ctx.fillStyle = '#fca5a5'; ctx.textAlign = 'left';
            ctx.fillText(s, cx + 10, cy + ch / 2 + 4);
            ctx.globalAlpha = 1;
          });
          this._text(ctx, '🛡️ Hazırlıklı olmak seni ve arkadaşlarını korur!', w / 2, h * 0.92, { size: 13, color: '#6ee7b7' });
        }
      }
    ];
  }

  /* ============ EARTHQUAKE SCENES ============ */
  _quakeScenes() {
    const lv = this.level;
    return [
      // Scene 1: Sarsıntı Başlıyor
      {
        title: '🌍 1. ADIM — Sarsıntı Başlıyor!',
        bg0: '#1c0a00', bg1: '#3b1200', titleColor: '#fcd34d',
        draw: (ctx, t, w, h) => {
          ctx.save();
          if (t > 0.1) this._shake(ctx, t, 5 * Math.sin(t * Math.PI));
          this._building(ctx, w * 0.15, h * 0.15, w * 0.7, h * 0.65, { color: '#374151', dark: false, rows: 3, cols: 4 });
          // Crack animation
          if (t > 0.5) {
            ctx.strokeStyle = '#f87171'; ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(w * 0.4, h * 0.15);
            ctx.lineTo(w * 0.42, h * 0.35);
            ctx.lineTo(w * 0.39, h * 0.55);
            ctx.stroke();
          }
          ctx.restore();
          const msg = lv === 'primary' ? '😱 Sarsıntı var! Ne yapacağını biliyorum!' : 'P dalgası hissedildi. 8-10 saniye içinde S dalgası gelir.';
          this._text(ctx, msg, w / 2, h * 0.88, { size: 13, color: '#fcd34d' });
          this._sirenFlash(ctx, w, h, t * 2, 'rgba(251,191,36,');
        }
      },
      // Scene 2: Çök-Kapan-Tutun
      {
        title: '🙇 2. ADIM — ÇÖK — KAPAN — TUTUN!',
        bg0: '#0d1117', bg1: '#1e2535', titleColor: '#6ee7b7',
        draw: (ctx, t, w, h) => {
          // Table
          ctx.fillStyle = '#78350f'; ctx.fillRect(w / 2 - 70, h * 0.55, 140, 12);
          ctx.fillRect(w / 2 - 65, h * 0.67, 10, 40);
          ctx.fillRect(w / 2 + 55, h * 0.67, 10, 40);
          // Person under table (crouching)
          ctx.save(); ctx.translate(w / 2, h * 0.65);
          ctx.fillStyle = '#FBBF77'; ctx.beginPath(); ctx.arc(0, -10, 12, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#3b82f6'; ctx.fillRect(-18, -3, 36, 20); // crouched body
          ctx.restore();
          // Steps
          const steps = [
            { icon: '⬇️', label: 'ÇÖK', desc: 'Dize çök', col: '#ef4444' },
            { icon: '🛡️', label: 'KAPAN', desc: 'Başını koru', col: '#f59e0b' },
            { icon: '✊', label: 'TUTUN', desc: 'Sabit bir şeyi tut', col: '#10b981' }
          ];
          steps.forEach((s, i) => {
            const active = t > i * 0.28;
            this._stepBadge(ctx, s.icon, s.label, w * 0.18 + i * (w * 0.32), h * 0.25, active, s.col);
            if (active) {
              ctx.font = '11px Inter, sans-serif'; ctx.fillStyle = '#e5e7eb'; ctx.textAlign = 'center';
              ctx.fillText(s.desc, w * 0.18 + i * (w * 0.32), h * 0.38);
              ctx.textAlign = 'left';
            }
          });
          this._text(ctx, lv === 'primary' ? '🌟 Masa altına geç ve başını koru!' : '📌 Açık alan yoksa köşeye gidin, ayakta durmayın!', w / 2, h * 0.9, { size: 13, color: '#a7f3d0' });
        }
      },
      // Scene 3: Masa Altı
      {
        title: '🪑 3. ADIM — Masa/Sıra Altına Geç!',
        bg0: '#0f1117', bg1: '#1a2535', titleColor: '#93c5fd',
        draw: (ctx, t, w, h) => {
          // Classroom
          ctx.fillStyle = '#1f2937'; ctx.fillRect(w * 0.05, h * 0.1, w * 0.9, h * 0.78);
          // Desks
          const dx = [0.15, 0.4, 0.65];
          dx.forEach((dxi, i) => {
            const dy = h * 0.45;
            ctx.fillStyle = '#78350f'; ctx.fillRect(w * dxi - 40, dy, 80, 10);
            ctx.fillRect(w * dxi - 35, dy + 10, 10, 35);
            ctx.fillRect(w * dxi + 25, dy + 10, 10, 35);
            if (t > i * 0.25) {
              // Student under desk
              ctx.save(); ctx.translate(w * dxi, dy + 18);
              ctx.fillStyle = '#FBBF77'; ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill();
              ctx.fillStyle = ['#3b82f6','#ec4899','#10b981'][i]; ctx.fillRect(-14, 10, 28, 16);
              ctx.restore();
            }
          });
          const info = lv === 'primary'
            ? ['📌 Masa Altı Kuralları', '• Dize çök', '• Kafanı kollarınla koru', '• Masayı tut', '• Sarsıntı bitene kadar']
            : ['📌 Masa Altı Protokolü', '• Masa bacaklarını tut', '• Sırt masaya dönük', '• Ağzını kapat, nefes al', '• Göz kapat, başı koru', '• Sarsıntı bitene bekle'];
          this._infoBox(ctx, info, w * 0.72, h * 0.12, 200);
        }
      },
      // Scene 4: Asansör Kullanma
      {
        title: '🚫 4. ADIM — ASANSÖR KULLANMA!',
        bg0: '#1a0505', bg1: '#3b0a0a', titleColor: '#fca5a5',
        draw: (ctx, t, w, h) => {
          // Elevator (red X)
          const ex = w / 2 - 35, ey = h * 0.18;
          ctx.fillStyle = '#374151'; ctx.fillRect(ex, ey, 70, 100);
          ctx.strokeStyle = '#6b7280'; ctx.lineWidth = 3; ctx.strokeRect(ex, ey, 70, 100);
          // Door line
          ctx.strokeStyle = '#9ca3af'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(w / 2, ey); ctx.lineTo(w / 2, ey + 100); ctx.stroke();
          // Big X
          const blink = 0.5 + Math.sin(t * Math.PI * 5) * 0.5;
          ctx.strokeStyle = `rgba(239,68,68,${blink})`; ctx.lineWidth = 6;
          ctx.beginPath(); ctx.moveTo(ex + 8, ey + 8); ctx.lineTo(ex + 62, ey + 92); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(ex + 62, ey + 8); ctx.lineTo(ex + 8, ey + 92); ctx.stroke();
          // Stairs (green check)
          const sx = w * 0.68;
          ctx.fillStyle = '#14532d'; ctx.fillRect(sx, h * 0.18, 100, 110);
          for (let i = 0; i < 5; i++) {
            ctx.fillStyle = '#22c55e';
            ctx.fillRect(sx + i * 18, h * 0.18 + 90 - i * 18, 18, 4);
          }
          ctx.font = 'bold 13px Inter, sans-serif'; ctx.fillStyle = '#22c55e'; ctx.textAlign = 'center';
          ctx.fillText('✅ MERDİVEN', sx + 50, h * 0.18 + 120);
          ctx.fillStyle = '#ef4444'; ctx.textAlign = 'center';
          ctx.fillText('🚫 ASANSÖR', w / 2, h * 0.18 + 115);
          ctx.textAlign = 'left';
          this._text(ctx, lv === 'primary' ? '⚠️ Depremde ASANSÖR yasak! Merdiveni kullan!' : 'Asansör kuyusu kapanabilir. Merdivenler her zaman güvenlidir.', w / 2, h * 0.87, { size: 13, color: '#fca5a5' });
        }
      },
      // Scene 5: Binadan Çıkış
      {
        title: '🚪 5. ADIM — Düzenli Çıkış!',
        bg0: '#052e16', bg1: '#064e3b', titleColor: '#6ee7b7',
        draw: (ctx, t, w, h) => {
          // Building exterior
          this._building(ctx, w * 0.05, h * 0.08, w * 0.9, h * 0.62, { color: '#1f2937', dark: false, rows: 3, cols: 4 });
          // Door
          ctx.fillStyle = '#15803d';
          ctx.fillRect(w / 2 - 20, h * 0.52, 40, 18);
          ctx.font = 'bold 9px Inter, sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
          ctx.fillText('ÇIKIŞ', w / 2, h * 0.63);
          // People exiting in line
          const lineCount = 4;
          for (let i = 0; i < lineCount; i++) {
            const prog = Math.max(0, Math.min((t * 2 - i * 0.35), 1));
            const px = w / 2 + 30 + i * 45 * prog;
            const py = h * 0.74;
            if (prog > 0) this._person(ctx, px, py, 0.8, { shirt: ['#3b82f6','#ec4899','#10b981','#f59e0b'][i], expr: 'calm' });
          }
          const rules = lv === 'primary'
            ? ['🚪 Çıkış Kuralları:', '• Koşma! Yürü!', '• Sıra halinde çık', '• Başını kolla', '• Bahçeye çık']
            : ['🚪 Tahliye Protokolü:', '• Sıralı ve sakin yürüyün', '• Baş seviyesi altında tut', '• Kapıyı kapat (yavaşça)', '• İtfaiye merdiveninden değil', '• Toplanma alanına git'];
          this._infoBox(ctx, rules, w * 0.04, h * 0.25, 205, { titleColor: '#6ee7b7' });
          ctx.textAlign = 'left';
        }
      },
      // Scene 6: Toplanma Alanı
      {
        title: '🏃 6. ADIM — Toplanma Alanına Git!',
        bg0: '#0c4a1c', bg1: '#14532d', titleColor: '#86efac',
        draw: (ctx, t, w, h) => {
          // Sky (daylight)
          ctx.fillStyle = '#0ea5e9'; ctx.fillRect(0, 0, w, h * 0.5);
          // Ground
          ctx.fillStyle = '#166534'; ctx.fillRect(0, h * 0.72, w, h * 0.28);
          // Assembly sign on pole
          ctx.fillStyle = '#6b7280'; ctx.fillRect(w / 2 - 3, h * 0.3, 6, h * 0.42);
          ctx.fillStyle = '#15803d'; ctx.fillRect(w / 2 - 50, h * 0.28, 100, 38);
          ctx.font = 'bold 11px Inter, sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
          ctx.fillText('🌿 TOPLANMA ALANI', w / 2, h * 0.52);
          ctx.textAlign = 'left';
          // People
          [0.15, 0.28, 0.72, 0.85].forEach((px, i) => {
            const prog = Math.min(t * 1.6 - i * 0.2, 1);
            if (prog > 0) this._person(ctx, w * px, h * 0.76 - (h * 0.76 - h * 0.76) * prog, 0.85, { shirt: ['#3b82f6','#ec4899','#10b981','#f59e0b'][i], expr: 'calm' });
          });
          const info = ['✅ Toplanma Sonrası:', '• Öğretmen yoklama alır', '• Yaralı varsa bildir', '• Binaya girme!', '• Artçı sarsıntı gelir'];
          this._infoBox(ctx, info, w * 0.37, h * 0.3, 195, { titleColor: '#86efac' });
        }
      },
      // Scene 7: Artçı Sarsıntı
      {
        title: '⚡ 7. ADIM — Artçı Sarsıntıya Dikkat!',
        bg0: '#1c1917', bg1: '#292524', titleColor: '#fcd34d',
        draw: (ctx, t, w, h) => {
          // Damage building
          ctx.save();
          const shakeIntensity = Math.sin(t * Math.PI * 6) > 0.8 ? 4 : 0;
          if (shakeIntensity > 0) ctx.translate((Math.random() - 0.5) * shakeIntensity, (Math.random() - 0.5) * shakeIntensity);
          this._building(ctx, w * 0.15, h * 0.12, w * 0.7, h * 0.55, { color: '#374151', dark: true, rows: 2, cols: 3 });
          ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(w * 0.4, h * 0.12); ctx.lineTo(w * 0.45, h * 0.4); ctx.lineTo(w * 0.38, h * 0.67); ctx.stroke();
          ctx.restore();
          this._person(ctx, w / 2, h * 0.8, 1.0, { shirt: '#f59e0b', expr: 'calm' });
          this._speechBubble(ctx, lv === 'primary' ? '⚡ Artçı gelirse tekrar çök!' : '⚡ Artçı sarsıntı! Tekrar çök-kapan-tutun!', w / 2, h * 0.57, { size: 12 });
          const info = ['⚡ Artçı Sarsıntı:', '• İlk 24 saat dikkatli ol', '• Binaya girme', '• Açık alanda kal', lv === 'high' ? '• AFAD kanalından takip et' : '• Öğretmenin yanında kal'];
          this._infoBox(ctx, info, w * 0.04, h * 0.12, 200, { titleColor: '#fcd34d' });
        }
      },
      // Scene 8: Enkaz altı
      {
        title: '🆘 8. ADIM — Enkaz Altında Kalırsan!',
        bg0: '#0f0a05', bg1: '#1c1409', titleColor: '#fbbf24',
        draw: (ctx, t, w, h) => {
          // Dark rubble scene
          ctx.fillStyle = '#292524'; ctx.fillRect(0, h * 0.55, w, h * 0.45);
          [0.1, 0.3, 0.5, 0.7, 0.9].forEach(rx => {
            ctx.fillStyle = '#44403c'; ctx.beginPath();
            ctx.ellipse(w * rx, h * 0.58, 40 + Math.random() * 20, 12, 0, 0, Math.PI * 2); ctx.fill();
          });
          // Person trapped (silhouette)
          ctx.fillStyle = 'rgba(251,191,36,0.7)';
          ctx.beginPath(); ctx.arc(w / 2, h * 0.62, 14, 0, Math.PI * 2); ctx.fill();
          // Phone flash
          const flash = Math.abs(Math.sin(t * Math.PI * 2));
          ctx.fillStyle = `rgba(255,255,255,${flash * 0.8})`;
          ctx.beginPath(); ctx.roundRect(w / 2 + 20, h * 0.57, 18, 28, 3); ctx.fill();
          const rules = lv === 'primary'
            ? ['🆘 Enkaz Altında:', '• BAĞIR! Sesini duyur', '• Boru/duvara vur', '• Kıpırda az', '• Bekle, yardım gelecek']
            : ['🆘 Enkaz Altı Protokolü:', '• Sesli bağır + vur: 3+3+3', '• Telefon varsa ara: 112', '• Kıpırdamayı azalt', '• Nefes: Burundan yavaş', '• Umudu kesme, bekle'];
          this._infoBox(ctx, rules, w * 0.04, h * 0.15, 210, { titleColor: '#fbbf24', border: 'rgba(251,191,36,0.3)' });
          this._text(ctx, lv === 'primary' ? '💪 Güçlü ol! Yardım yolda!' : '⏳ Statik bekleme hayat kurtarır.', w / 2, h * 0.91, { size: 13, color: '#fbbf24' });
        }
      },
      // Scene 9: Özet
      {
        title: '✅ ÖZET — Deprem Protokolü',
        bg0: '#0f1117', bg1: '#1a1f2e',
        draw: (ctx, t, w, h) => {
          const steps = ['1. Sarsıntı: Sakin kal','2. Çök-Kapan-Tutun','3. Masa altına geç','4. Asansör kullanma','5. Düzenli çıkış','6. Toplanma alanı','7. Artçı dikkat','8. Enkaz: Bekle+vur'];
          const cols = 2;
          const cw = w / cols - 20, ch = (h * 0.76) / 4;
          steps.forEach((s, i) => {
            const cx = 12 + (i % cols) * (cw + 16);
            const cy = h * 0.1 + Math.floor(i / cols) * ch;
            const prog = Math.min(Math.max((t * 3 - i * 0.3), 0), 1);
            ctx.globalAlpha = prog;
            ctx.fillStyle = 'rgba(245,158,11,0.15)';
            ctx.beginPath(); ctx.roundRect(cx, cy, cw, ch - 6, 8); ctx.fill();
            ctx.strokeStyle = 'rgba(245,158,11,0.35)'; ctx.lineWidth = 1; ctx.stroke();
            ctx.font = 'bold 12px Inter, sans-serif'; ctx.fillStyle = '#fcd34d'; ctx.textAlign = 'left';
            ctx.fillText(s, cx + 10, cy + ch / 2 + 4);
            ctx.globalAlpha = 1;
          });
          this._text(ctx, '🌍 Hazırlıklı olmak depremde hayat kurtarır!', w / 2, h * 0.93, { size: 13, color: '#6ee7b7' });
        }
      }
    ];
  }
}

// Global instance
let animator = null;

function initAnimator() {
  animator = new EmergencyAnimator('animCanvas');
}
