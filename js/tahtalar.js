// Tahta çizimleri (SVG). Dokunulabilir kareler data-k="A1" (Pentago/Küre) ya da "e4" (satranç) taşır.
(function () {
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const isaret = (x, y, k, K) => k === 'o' ? `<circle cx="${x}" cy="${y}" r="${K * .46}" fill="none" stroke="#2b8a3e" stroke-width="3.5"/>`
    : k === 'x' ? `<path d="M${x - K * .3} ${y - K * .3}L${x + K * .3} ${y + K * .3}M${x + K * .3} ${y - K * .3}L${x - K * .3} ${y + K * .3}" stroke="#e03131" stroke-width="4" stroke-linecap="round"/>`
    : k === '*' ? `<text x="${x}" y="${y + K * .2}" text-anchor="middle" font-size="${K * .62}" fill="#f08c00">★</text>`
    : k === 'n' ? `<circle cx="${x}" cy="${y}" r="${K * .46}" fill="none" stroke="#1971c2" stroke-width="3" stroke-dasharray="4 3"/>`
    : k === 'y' ? `<text x="${x}" y="${y + K * .18}" text-anchor="middle" font-size="${K * .5}" fill="#fff">★</text>` : '';
  // Pentago: s = 6 dizgi ('S','B','.') ya da 36 sayı; m = [[r,c,işaret]]; opt.sec = seçili hücre, opt.ok = çevirme okları
  function pentago(s, m = [], opt = {}) {
    const rows = Array.isArray(s) && typeof s[0] === 'number' ? [0, 1, 2, 3, 4, 5].map((r) => s.slice(r * 6, r * 6 + 6).map((x) => '.SB'[x]).join('')) : s;
    const K = 46, A = 10, sol = 22, X = (c) => sol + c * K + (c >= 3 ? A : 0) + K / 2, Y = (r) => sol + r * K + (r >= 3 ? A : 0) + K / 2, G = 6 * K + A + sol + 4;
    let h = '';
    for (const [a, b] of [[0, 0], [0, 3], [3, 0], [3, 3]]) h += `<rect x="${X(b) - K / 2 + 1}" y="${Y(a) - K / 2 + 1}" width="${3 * K - 2}" height="${3 * K - 2}" rx="12" fill="#c92a2a"/>`;
    for (let c = 0; c < 6; c++) h += `<text x="${X(c)}" y="15" text-anchor="middle" font-size="13" fill="#555">${'ABCDEF'[c]}</text>`;
    for (let r = 0; r < 6; r++) h += `<text x="9" y="${Y(r) + 5}" text-anchor="middle" font-size="13" fill="#555">${r + 1}</text>`;
    rows.forEach((sat, r) => [...sat].forEach((ch, c) => { const ad = 'ABCDEF'[c] + (r + 1);
      h += `<circle cx="${X(c)}" cy="${Y(r)}" r="${K * .38}" fill="${ch === 'S' ? '#111' : ch === 'B' ? '#fff' : '#6e0f0f'}" stroke="${ch === 'B' ? '#bbb' : '#4a0a0a'}" stroke-width="2"/>`;
      if (opt.sec === ad) h += `<circle cx="${X(c)}" cy="${Y(r)}" r="${K * .46}" fill="none" stroke="#ffd43b" stroke-width="4"/>`; }));
    m.forEach(([r, c, k]) => { h += isaret(X(c), Y(r), k, K); });
    if (opt.dokun) rows.forEach((sat, r) => [...sat].forEach((_, c) => { h += `<rect class="dk" data-k="${'ABCDEF'[c] + (r + 1)}" x="${X(c) - K / 2}" y="${Y(r) - K / 2}" width="${K}" height="${K}" fill="transparent"/>`; }));
    if (opt.ok) [0, 1, 2, 3].forEach((q) => { const cx = q % 2 ? X(4) : X(1), cy = q >= 2 ? Y(4) : Y(1);
      [[1, '↻', K * .9], [-1, '↺', -K * .9]].forEach(([d, t, dx]) => { h += `<g class="ok" data-q="${q}" data-d="${d}"><circle cx="${cx + dx}" cy="${cy}" r="21" fill="#ffd43b" stroke="#222" stroke-width="2"/><text x="${cx + dx}" y="${cy + 8}" text-anchor="middle" font-size="24" font-weight="800">${t}</text></g>`; }); });
    return `<svg class="tahta" viewBox="0 0 ${G} ${G}">${h}</svg>`;
  }
  function tabla3(s, opt = {}) { // tek tabla (çevirme sorusu)
    const K = 46; let h = `<rect x="2" y="2" width="${3 * K + 4}" height="${3 * K + 4}" rx="12" fill="#c92a2a"/>`;
    s.forEach((sat, r) => [...sat].forEach((ch, c) => { const x = 4 + c * K + K / 2, y = 4 + r * K + K / 2;
      h += `<circle cx="${x}" cy="${y}" r="${K * .38}" fill="${ch === 'S' ? '#111' : ch === 'B' ? '#fff' : '#6e0f0f'}" stroke="#4a0a0a"/>`;
      if (opt.dokun) h += `<rect class="dk3" data-c="${r}${c}" x="${x - K / 2}" y="${y - K / 2}" width="${K}" height="${K}" fill="transparent"/>`; }));
    return `<svg class="tahta kucuk" viewBox="0 0 ${3 * K + 8} ${3 * K + 8}">${h}</svg>`;
  }
  // Küre: rows 7 dizgi ('M','T','.'); m işaretler; opt.hedef = [[r,c]] gidilebilir kareler; opt.sec = 'D4'
  function kure(rows, m = [], opt = {}) {
    const K = 44, sol = 22, G = 7 * K + sol + 4, X = (c) => sol + c * K + K / 2, Y = (r) => sol + r * K + K / 2;
    let h = `<rect x="${sol}" y="${sol}" width="${7 * K}" height="${7 * K}" fill="#fff8f0" stroke="#555" stroke-width="2"/>`;
    h += `<rect x="${sol}" y="${sol}" width="${7 * K}" height="${K}" fill="#ffe8cc"/><rect x="${sol}" y="${sol + 6 * K}" width="${7 * K}" height="${K}" fill="#eadcff"/>`;
    for (let i = 1; i < 7; i++) h += `<path d="M${sol + i * K} ${sol}V${sol + 7 * K}M${sol} ${sol + i * K}H${sol + 7 * K}" stroke="#bbb"/>`;
    for (let c = 0; c < 7; c++) h += `<text x="${X(c)}" y="15" text-anchor="middle" font-size="13" fill="#555">${'ABCDEFG'[c]}</text>`;
    for (let r = 0; r < 7; r++) h += `<text x="9" y="${Y(r) + 5}" text-anchor="middle" font-size="13" fill="#555">${r + 1}</text>`;
    (opt.hedef || []).forEach(([r, c]) => { h += `<circle cx="${X(c)}" cy="${Y(r)}" r="9" fill="#51cf66"/>`; });
    rows.forEach((sat, r) => [...sat].forEach((ch, c) => { if (ch === '.') return; const ad = 'ABCDEFG'[c] + (r + 1);
      h += `<circle cx="${X(c)}" cy="${Y(r)}" r="${K * .38}" fill="${ch === 'M' ? '#7048e8' : '#fd7e14'}" stroke="${opt.sec === ad ? '#ffd43b' : '#333'}" stroke-width="${opt.sec === ad ? 5 : 1.5}"/>`;
      h += `<text x="${X(c)}" y="${Y(r) + 5}" text-anchor="middle" font-size="14" font-weight="800" fill="#fff">${ch}</text>`; }));
    m.forEach(([r, c, k]) => { h += isaret(X(c), Y(r), k, K); });
    if (opt.dokun) for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) h += `<rect class="dk" data-k="${'ABCDEFG'[c] + (r + 1)}" x="${X(c) - K / 2}" y="${Y(r) - K / 2}" width="${K}" height="${K}" fill="transparent"/>`;
    return `<svg class="tahta" viewBox="0 0 ${G} ${G}">${h}</svg>`;
  }
  // Satranç: fen (yalnız taş dizilişi); opt.yildiz/vurgu/hedef kare listeleri, opt.sec, opt.cevir
  const FIG = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
  function satranc(fen, opt = {}) {
    const K = 44, sol = 18, G = 8 * K + sol, sat = fen.split(' ')[0].split('/'), yil = new Set(opt.yildiz || []), vur = new Set(opt.vurgu || []), hed = new Set(opt.hedef || []);
    const kare = (r, c) => { const rr = opt.cevir ? 7 - r : r, cc = opt.cevir ? 7 - c : c; return 'abcdefgh'[cc] + (8 - rr); };
    let h = '';
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { const k = kare(r, c), x = sol + c * K, y = r * K;
      h += `<rect x="${x}" y="${y}" width="${K}" height="${K}" fill="${vur.has(k) ? '#ffe066' : opt.sec === k ? '#ffd43b' : (r + c) % 2 ? '#b58863' : '#f0d9b5'}"/>`; }
    for (let i = 0; i < 8; i++) { h += `<text x="${sol + i * K + K / 2}" y="${G - 3}" text-anchor="middle" font-size="12" fill="#555">${kare(7, i)[0]}</text><text x="8" y="${i * K + K / 2 + 5}" text-anchor="middle" font-size="12" fill="#555">${kare(i, 0)[1]}</text>`; }
    sat.forEach((s, r0) => { let c0 = 0; for (const ch of s) { if (/\d/.test(ch)) { c0 += +ch; continue; }
      const r = opt.cevir ? 7 - r0 : r0, c = opt.cevir ? 7 - c0 : c0, x = sol + c * K + K / 2, y = r * K + K * .8, bey = ch === ch.toUpperCase();
      h += `<text x="${x}" y="${y}" text-anchor="middle" font-size="${K * .82}" font-family="'Segoe UI Symbol','Noto Sans Symbols 2','DejaVu Sans',serif" fill="${bey ? '#fff' : '#111'}" stroke="${bey ? '#111' : '#000'}" stroke-width="${bey ? 1.4 : .5}">${FIG[ch.toLowerCase()]}&#xFE0E;</text>`; c0++; } });
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { const k = kare(r, c), x = sol + c * K + K / 2, y = r * K + K / 2;
      if (hed.has(k)) h += `<circle cx="${x}" cy="${y}" r="8" fill="rgba(43,138,62,.75)"/>`;
      if (yil.has(k)) h += `<text x="${x + K * .3}" y="${y - K * .22}" text-anchor="middle" font-size="16" fill="#e8590c">★</text>`;
      if (opt.dokun) h += `<rect class="dk" data-k="${k}" x="${x - K / 2}" y="${y - K / 2}" width="${K}" height="${K}" fill="transparent"/>`; }
    return `<svg class="tahta" viewBox="0 0 ${G} ${G}">${h}</svg>`;
  }
  window.TAHTA = { pentago, tabla3, kure, satranc, esc };
})();
