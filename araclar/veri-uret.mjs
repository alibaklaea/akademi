// Öğretmen Masası'ndaki doğrulanmış soru bankalarından uygulama verisini üretir.
// node araclar/veri-uret.mjs → veri/bankalar.js
// Cevaplar kaynakta kural motorlarıyla (Pentago, Küre) ve python-chess ile (satranç) hesaplanmıştır.
import fs from 'fs';
import vm from 'vm';
const KAYNAK = new URL('../../Ogretmen_Masasi/js/', import.meta.url);
const W = {}; vm.createContext(W); W.window = W;
for (const f of ['kulup.js', 'kulup-etkinlik.js', 'kulup-banka.js', 'kulup-banka-satranc.js', 'tazof-kurallar.js']) vm.runInContext(fs.readFileSync(new URL(f, KAYNAK), 'utf8'), W);
const dil = (m) => String(m || '').replace('Halka çiz.', 'Karelere dokun.').replace(' Çarpı koy.', ' Taşlara dokun.').replace(' Beşliyi çiz.', '').replace(' Çizerek bul.', '')
  .replace('Bilyeleri sağdaki boş tablaya çiz.', 'Sağdaki tablada çukura dokun: bir dokunuş siyah, iki beyaz, üç boş.').replace('karesine yıldız çiz.', 'karesine dokun.').replace('Yıldız çiz.', 'Köşeye dokun.')
  .replace('Halka çiz, adını yaz.', 'Karelere dokun.').replace('adını yaz', '').replace('Boş kareyi bul, eksik taşı yaz.', 'Boş karelere dokun.');
const sade = (q) => { const r = { m: dil(q.metin || q.soru), c: q.cevap, d: q.do };
  if (q.tahta) r.t = q.tahta; if (q.tahta2) r.t2 = q.tahta2; if (q.fen) r.f = q.fen.split(' ')[0]; if (q.yildiz) r.y = q.yildiz; if (q.vurgu) r.v = q.vurgu; return r; };
const uygun = (q) => q.do && !q.do.duzelt && (q.do.alanlar || q.do.kare || q.do.cizim);
const tekil = (L) => { const g = new Set(); return L.filter((q) => { const k = JSON.stringify([q.m, q.t, q.f, q.y]); if (g.has(k)) return false; g.add(k); return true; }); };
const konu = (E, B) => ({ ad: E.ad, y: E.yonerge, s: tekil([...E.sorular, ...(E.birlikte || []), ...(B || [])].filter(uygun).map(sade)) });
const SAT = W.KULUP.programlar.SAT.haftalar;
const VERI = {
  surum: new Date().toISOString().slice(0, 10),
  pentago: W.KULUP_ETK.Pentago.map((E, i) => konu(E, W.KULUP_BANKA.Pentago[i])),
  kure: W.KULUP_ETK['Küre'].map((E, i) => konu(E, W.KULUP_BANKA['Küre'][i])),
  satranc: W.KULUP_BANKA_S.haftalar.map((L, i) => ({ ad: SAT[i].ad, y: SAT[i].amac, s: tekil(L.filter(uygun).map(sade)) })),
  kurallar: { Pentago: W.KULUP.kurallar.Pentago, 'Küre': W.KULUP.kurallar['Küre'] },
};
for (const [o, L] of Object.entries({ pentago: VERI.pentago, kure: VERI.kure, satranc: VERI.satranc })) L.forEach((k, i) => { if (k.s.length < 20) throw new Error(`${o} ${i} az soru: ${k.s.length}`); });
fs.mkdirSync(new URL('../veri/', import.meta.url), { recursive: true });
fs.writeFileSync(new URL('../veri/bankalar.js', import.meta.url), '// Üretildi: node araclar/veri-uret.mjs — elle değiştirmeyin.\nwindow.AKADEMI_VERI = ' + JSON.stringify(VERI) + ';\n');
console.log('pentago', VERI.pentago.map((k) => k.s.length).join(','), '| küre', VERI.kure.map((k) => k.s.length).join(','), '| satranç', VERI.satranc.map((k) => k.s.length).join(','));
