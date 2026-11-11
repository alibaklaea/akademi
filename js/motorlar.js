// Oyun motorları. Pentago: Ogretmen_Masasi/araclar/pentago-motor.mjs ile aynı kurallar (TAZOF).
// Küre: Ogretmen_Masasi/araclar/etkinlik-uret.mjs gidis/yakala/dorDortlu ile aynı kurallar (TAZOF).
(function () {
  // ===================== PENTAGO =====================
  // tahta: 36 hücre (r*6+c), 0 boş, 1 siyah (ilk oynayan), 2 beyaz. Tabla: 0 sol üst, 1 sağ üst, 2 sol alt, 3 sağ alt. Yön: 1 ↻, -1 ↺
  const LINES = [];
  for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
    const er = r + 4 * dr, ec = c + 4 * dc; if (er < 0 || er > 5 || ec < 0 || ec > 5) continue;
    LINES.push([0, 1, 2, 3, 4].map((k) => (r + k * dr) * 6 + (c + k * dc)));
  }
  const rotate = (b, q, d) => { const n = b.slice(), r0 = q >= 2 ? 3 : 0, c0 = q % 2 ? 3 : 0;
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) n[(r0 + r) * 6 + c0 + c] = d === 1 ? b[(r0 + 2 - c) * 6 + c0 + r] : b[(r0 + c) * 6 + c0 + 2 - r]; return n; };
  const has5 = (b, p) => LINES.some((L) => L.every((i) => b[i] === p));
  const besliler = (b) => LINES.filter((L) => L.every((i) => b[i] && b[i] === b[L[0]]));
  // koyma sonrası: 5 olduysa oyun biter (çevirme yok). Çevirme sonrası: ikisi de 5 → berabere; yalnız rakip 5 → rakip kazanır.
  function pKoy(b, p, i) { const n = b.slice(); n[i] = p; return { tahta: n, bitti: has5(n, p) ? p : 0 }; }
  function pCevir(b, p, q, d) { const n = rotate(b, q, d), a = has5(n, p), o = has5(n, 3 - p);
    return { tahta: n, sonuc: a && o ? 'berabere' : a ? p : o ? 3 - p : n.every((x) => x) ? 'berabere' : 0 }; }
  function pHamleler(b, p) { // tüm hamleler: [hücre, tabla, yön, sonuç]
    const H = [];
    for (let i = 0; i < 36; i++) { if (b[i]) continue; const k = pKoy(b, p, i);
      if (k.bitti) { H.push({ i, q: -1, d: 0, tahta: k.tahta, sonuc: p }); continue; }
      for (let q = 0; q < 4; q++) for (const d of [1, -1]) { const c = pCevir(k.tahta, p, q, d); H.push({ i, q, d, tahta: c.tahta, sonuc: c.sonuc }); } }
    return H;
  }
  const pKazanir = (b, p) => pHamleler(b, p).some((h) => h.sonuc === p);
  function pPuan(b, p) { // açık çizgilerde biriken taşlar (basit değerlendirme)
    let s = 0; for (const L of LINES) { let a = 0, o = 0; for (const i of L) { if (b[i] === p) a++; else if (b[i] === 3 - p) o++; }
      if (!o) s += [0, 1, 4, 16, 64, 0][a]; if (!a) s -= [0, 1, 5, 20, 90, 0][o]; }
    return s + [7, 10, 25, 28].reduce((t, i) => t + (b[i] === p ? 3 : b[i] === 3 - p ? -3 : 0), 0);
  }
  function pBilgisayar(b, p, seviye) { // seviye 1 kolay, 2 orta, 3 zor
    const H = pHamleler(b, p); if (!H.length) return null;
    const kaz = H.filter((h) => h.sonuc === p); if (kaz.length) return kaz[0];
    let iyi = H.filter((h) => h.sonuc !== 3 - p);
    if (seviye >= 2) { const guvenli = iyi.filter((h) => h.sonuc || !pKazanir(h.tahta, 3 - p)); if (guvenli.length) iyi = guvenli; }
    if (!iyi.length) iyi = H;
    if (seviye === 1) return Math.random() < .6 ? iyi[Math.floor(Math.random() * iyi.length)] : iyi.sort((x, y) => pPuan(y.tahta, p) - pPuan(x.tahta, p))[0];
    iyi.forEach((h) => { h.p = pPuan(h.tahta, p) + Math.random() * (seviye === 3 ? .5 : 6); });
    return iyi.sort((x, y) => y.p - x.p)[0];
  }

  // ===================== KÜRE =====================
  // tahta: 7 satır dizgisi, satır 0 üst (turuncunun başlangıç sırası), satır 6 alt (morun). 'M' mor (önce oynar), 'T' turuncu, '.' boş.
  const N = 7, rakip = (k) => (k === 'M' ? 'T' : 'M'), ev = (k) => (k === 'M' ? 6 : 0), ileri = (k) => (k === 'M' ? -1 : 1);
  const kBaslangic = () => ['TTTTTTM', '.......', '.......', '.......', '.......', '.......', 'TMMMMMM'];
  const kc = (rows) => rows.map((s) => [...s]);
  const kAd = (r, c) => 'ABCDEFG'[c] + (r + 1);
  function kGidis(rows, r, c) { // kural 4-5 ve 9: başlangıç sırasındaki taş yalnız ileri/çapraz ileri; diğerleri ileri, geri, çapraz; yana yok; kendi başlangıç sırasına dönüş yok; rakip sırasında tek taş
    const b = kc(rows), k = b[r][c], f = ileri(k), R = [];
    const adim = r === ev(k) ? [[f, 0], [f, -1], [f, 1]] : [[f, 0], [-f, 0], [f, -1], [f, 1], [-f, -1], [-f, 1]];
    for (const [dr, dc] of adim) { const a = r + dr, e = c + dc;
      if (a < 0 || a >= N || e < 0 || e >= N || b[a][e] !== '.') continue;
      if (a === ev(k)) continue;
      if (a === ev(rakip(k)) && r !== a && [...rows[a]].includes(k)) continue;
      R.push([a, e]); }
    return R;
  }
  function kDortlu(b, k) { // kural 6: başlangıç sıraları dışındaki taşlarda yatay/dikey/çapraz 4 taş (boşluk ya da rakip olsa bile)
    for (let r = 1; r <= 5; r++) for (let c = 0; c < N; c++) { if (b[r][c] !== k) continue;
      const say = (dr, dc) => { let n = 0; for (let i = -6; i <= 6; i++) { const a = r + i * dr, e = c + i * dc; if (a < 1 || a > 5 || e < 0 || e > 6) continue; if (b[a][e] === k) n++; } return n; };
      if (say(0, 1) >= 4 || say(1, 0) >= 4 || say(1, 1) >= 4 || say(1, -1) >= 4) return true; }
    return false;
  }
  function kYakala(b, r, c) { // hamleyi yapan oyuncu sıkıştırdığı tüm taşları alır (kural 7); kendi isteğiyle araya giren alınmaz (kural 8)
    const k = b[r][c], o = rakip(k), al = [];
    for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const ara = []; let a = r + dr, e = c + dc;
      while (a >= 0 && a < N && e >= 0 && e < N && b[a][e] === o) { ara.push([a, e]); a += dr; e += dc; }
      if (ara.length && a >= 0 && a < N && e >= 0 && e < N && b[a][e] === k) al.push(...ara); }
    return al;
  }
  function kOyna(rows, r0, c0, r, c) { const b = kc(rows), k = b[r0][c0]; b[r][c] = k; b[r0][c0] = '.';
    const al = kYakala(b, r, c); al.forEach(([a, e]) => { b[a][e] = '.'; }); return { rows: b.map((s) => s.join('')), al, dortlu: kDortlu(b, k) }; }
  function kHamleler(rows, k) { const H = [];
    rows.forEach((s, r) => [...s].forEach((ch, c) => { if (ch !== k) return; kGidis(rows, r, c).forEach(([a, e]) => { const o = kOyna(rows, r, c, a, e); if (!o.dortlu) H.push({ r0: r, c0: c, r: a, c: e, ...o }); }); }));
    return H;
  }
  function kBilgisayar(rows, k, seviye) {
    const H = kHamleler(rows, k); if (!H.length) return null;
    H.forEach((h) => { let tehlike = 0; if (seviye >= 2) { const R = kHamleler(h.rows, rakip(k)); tehlike = R.reduce((m, x) => Math.max(m, x.al.length), 0); }
      h.p = h.al.length * 10 - tehlike * (seviye === 3 ? 9 : 6) + Math.random() * (seviye === 1 ? 12 : 2); });
    return H.sort((x, y) => y.p - x.p)[0];
  }
  window.MOTOR = { pentago: { LINES, rotate, has5, besliler, pKoy, pCevir, pHamleler, pBilgisayar }, kure: { kBaslangic, kGidis, kOyna, kHamleler, kBilgisayar, kDortlu, kAd, rakip } };
})();
