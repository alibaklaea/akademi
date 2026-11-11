// Yalnızca bilgisayardaki deneme (localhost) için sahte sunucu: demo öğrenciler bilgisayar motoruyla oynar.
// Gerçek kullanımda Google Apps Script (apps-script/Kod.gs) çalışır; turnuva eşleştirme ve puan tablosu oradaki mantığın aynısıdır.
window.DEMO_SUNUCU_KUR = function (ctx) {
  const { M, ogrAd, yaris } = ctx, ANAHTAR = 'akd.demo';
  const DEMOLAR = ['Demo Ada', 'Demo Can', 'Demo Efe', 'Demo Elif', 'Demo Mert'];
  const id = () => Math.random().toString(16).slice(2, 10);
  const oku = () => { try { return JSON.parse(localStorage.getItem(ANAHTAR)); } catch (e) { return null; } };
  const yaz = (s) => { try { localStorage.setItem(ANAHTAR, JSON.stringify(s)); } catch (e) {} };
  function durum() {
    let s = oku(); if (s && s.ben === ogrAd()) return s;
    const ben = ogrAd();
    s = { ben, due: [], mey: [], tur: [{ id: 't1', ad: 'Demo Pentago Turnuvası', oyun: 'Pentago', toplam: 3, tur: 0, durum: 'sürüyor', oyuncular: [ben, ...DEMOLAR] }] };
    s.due.push({ id: id(), oyun: 'Küre', o1: 'Demo Ada', o2: ben, durum: 'davet', hamleler: [], sonuc: '', turnuva: '', tur: '' });
    s.due.push({ id: id(), oyun: 'Pentago', o1: 'Demo Can', o2: '', durum: 'bekliyor', hamleler: [], sonuc: '', turnuva: '', tur: '' });
    s.mey.push({ id: id(), modul: 'pentago-1', sorular: [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6], [3, 7], [3, 8], [0, 9], [1, 10]], o1: 'Demo Elif', d1: 7, t1: 142, o2: '', d2: '', t2: '', durum: 'açık' });
    turEsle(s, s.tur[0]); yaz(s); return s;
  }
  // ---- Kod.gs ile aynı: puan tablosu ve İsviçre eşleştirmesi ----
  const sonucPuan = (d, ad) => d.durum !== 'bitti' ? null : /^berabere/i.test(d.sonuc) ? 0.5 : String(d.sonuc).indexOf(ad + ' kazandı') === 0 ? 1 : 0;
  function tablo(oyuncular, M2) { const T = {}; oyuncular.forEach((a) => { T[a] = { ad: a, puan: 0, galibiyet: 0, oynanan: 0, rakipler: [] }; });
    M2.forEach((d) => { if (d.o2 === 'BAY') { if (T[d.o1]) T[d.o1].puan += 1; return; }
      [d.o1, d.o2].forEach((a, k) => { if (!T[a]) return; T[a].rakipler.push(k ? d.o1 : d.o2); const p = sonucPuan(d, a); if (p === null) return; T[a].puan += p; T[a].oynanan++; if (p === 1) T[a].galibiyet++; }); });
    Object.values(T).forEach((x) => { x.buchholz = x.rakipler.reduce((s, r) => s + (T[r] ? T[r].puan : 0), 0); delete x.rakipler; });
    return Object.values(T).sort((a, b) => b.puan - a.puan || b.buchholz - a.buchholz || b.galibiyet - a.galibiyet || a.ad.localeCompare(b.ad, 'tr')); }
  function turEsle(s, t) {
    const M2 = s.due.filter((d) => d.turnuva === t.id); if (M2.some((d) => d.durum !== 'bitti') || t.tur >= t.toplam) return;
    const oynadi = new Set(M2.map((d) => [d.o1, d.o2].sort().join('|'))), L = tablo(t.oyuncular, M2).map((x) => x.ad), cift = [];
    const bay = L.length % 2 ? (L.slice().reverse().find((a) => !M2.some((d) => d.o1 === a && d.o2 === 'BAY')) || L[L.length - 1]) : null; if (bay) L.splice(L.indexOf(bay), 1);
    while (L.length > 1) { const a = L.shift(); let j = L.findIndex((b) => !oynadi.has([a, b].sort().join('|'))); if (j < 0) j = 0; const b = L.splice(j, 1)[0];
      cift.push(M2.filter((d) => d.o1 === a).length <= M2.filter((d) => d.o1 === b).length ? [a, b] : [b, a]); }
    if (bay) cift.push([bay, 'BAY']); t.tur++;
    cift.forEach(([a, b]) => { const d = { id: id(), oyun: t.oyun, o1: a, o2: b, durum: b === 'BAY' ? 'bitti' : 'oynanıyor', hamleler: [], sonuc: b === 'BAY' ? a + ' kazandı (bay)' : '', turnuva: t.id, tur: t.tur };
      if (b !== 'BAY' && a !== s.ben && b !== s.ben) { const r = Math.random(); d.durum = 'bitti'; d.sonuc = r < .45 ? a + ' kazandı' : r < .9 ? b + ' kazandı' : 'Berabere'; } s.due.push(d); });
  }
  function bilgisayarOynasin(s, d) { // sıra demo oyuncudaysa bir hamle yapar
    if (d.durum !== 'oynanıyor') return; const st = yaris.oynat(d.oyun, d.hamleler), sira = st.sira === 1 ? d.o1 : d.o2; if (!DEMOLAR.includes(sira)) return;
    let h = null;
    if (d.oyun === 'Pentago') { const x = M.pentago.pBilgisayar(st.b, st.sira, 2); if (x) h = { i: x.i, q: x.q, d: x.d }; }
    else if (d.oyun === 'Küre') { const x = M.kure.kBilgisayar(st.rows, st.sira === 1 ? 'M' : 'T', 2); if (x) h = { r0: x.r0, c0: x.c0, r: x.r, c: x.c }; }
    else { const L = st.c.moves({ verbose: true }); const al = L.filter((m) => m.captured); const m = (al.length && Math.random() < .7 ? al : L)[Math.floor(Math.random() * (al.length && Math.random() < .7 ? al : L).length)]; if (m) h = { from: m.from, to: m.to }; }
    if (!h) return; d.hamleler.push(h); const y = yaris.oynat(d.oyun, d.hamleler), son = yaris.UY[d.oyun].sonuc(y);
    if (son) { d.durum = 'bitti'; d.sonuc = son === 'berabere' ? 'Berabere' : `${son === 1 ? d.o1 : d.o2} kazandı`; }
  }
  return function (q) {
    const s = durum(), ben = s.ben, bul = (i) => s.due.find((d) => d.id === i);
    let c = { ok: true };
    if (q.islem === 'arkadaslar') c = { ok: true, liste: DEMOLAR };
    else if (q.islem === 'duellolar') { s.due.forEach((d) => { if (d.durum === 'bekliyor' && d.o1 === ben && Math.random() < .5) { d.o2 = 'Demo Mert'; d.durum = 'oynanıyor'; } }); c = { ok: true, liste: s.due.filter((d) => (d.o1 === ben || d.o2 === ben || (!d.o2 && d.durum === 'bekliyor')) && d.durum !== 'iptal') }; }
    else if (q.islem === 'duelloAc') { const d = { id: id(), oyun: q.oyun, o1: ben, o2: q.rakip || '', durum: q.rakip ? 'oynanıyor' : 'bekliyor', hamleler: [], sonuc: '', turnuva: '', tur: '' }; s.due.push(d); c = { ok: true, id: d.id }; }
    else if (q.islem === 'duelloKatil') { const d = bul(q.id); if (d.durum === 'bekliyor') d.o2 = ben; d.durum = 'oynanıyor'; }
    else if (q.islem === 'duelloDurum') { const d = bul(q.id); if (!d) c = { ok: false, hata: 'Bulunamadı' }; else { if (d.durum === 'bekliyor' && d.o1 === ben) { d.o2 = 'Demo Mert'; d.durum = 'oynanıyor'; } bilgisayarOynasin(s, d); c = { ok: true, duello: JSON.parse(JSON.stringify(d)) }; } }
    else if (q.islem === 'hamle') { const d = bul(q.id); if (q.sira !== d.hamleler.length) c = { ok: false, hata: 'Tahta güncel değil.' }; else { d.hamleler.push(q.hamle); if (q.sonuc) { d.durum = 'bitti'; d.sonuc = q.sonuc; } } }
    else if (q.islem === 'pesEt') { const d = bul(q.id); if (d.durum === 'oynanıyor') { d.durum = 'bitti'; d.sonuc = (d.o1 === ben ? d.o2 : d.o1) + ' kazandı (rakip pes etti)'; } else d.durum = 'iptal'; }
    else if (q.islem === 'meydanAc') { const x = { id: id(), modul: q.modul, sorular: q.sorular, o1: ben, d1: '', t1: '', o2: q.rakip || 'Demo Efe', d2: '', t2: '', durum: 'açık' }; s.mey.push(x); c = { ok: true, id: x.id }; }
    else if (q.islem === 'meydanlar') c = { ok: true, liste: s.mey };
    else if (q.islem === 'meydanSonuc') { const x = s.mey.find((m) => m.id === q.id); if (x.o1 === ben) { x.d1 = q.dogru; x.t1 = q.sure; x.d2 = 4 + Math.floor(Math.random() * 6); x.t2 = 90 + Math.floor(Math.random() * 120); } else { x.o2 = ben; x.d2 = q.dogru; x.t2 = q.sure; } x.durum = 'bitti'; }
    else if (q.islem === 'turnuvalar') { s.tur.forEach((t) => turEsle(s, t)); c = { ok: true, liste: s.tur.map((t) => { const M2 = s.due.filter((d) => d.turnuva === t.id); return { ...t, maclar: M2, tablo: tablo(t.oyuncular, M2) }; }) }; }
    else if (q.islem === 'siralama') c = { ok: true, liste: [{ ad: 'Demo Elif', puan: 47 }, { ad: ben, puan: 31 }, { ad: 'Demo Can', puan: 28 }, { ad: 'Demo Ada', puan: 12 }] };
    yaz(s); return c;
  };
};
