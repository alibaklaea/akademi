/**
 * Ankara Zeka ve Bilim Akademisi — öğrenci uygulaması arka ucu (Google Apps Script)
 *
 * KURULUM (bir kez):
 *  1) Google Drive'da yeni bir Google E-Tablo aç, adını "Akademi · Öğrenciler ve Modüller" yap.
 *  2) Uzantılar → Apps Script → bu dosyanın tamamını yapıştır → Kaydet.
 *  3) Üstteki işlev listesinden "kurulum" seç → Çalıştır → izin ver. Sayfalar ve modül listesi oluşur; tabloda "Akademi" menüsü çıkar.
 *  4) Dağıt → Yeni dağıtım → Tür: Web uygulaması → Çalıştıran: Ben → Erişim: Herkes → Dağıt. Web uygulaması URL'sini kopyala.
 *  5) Uygulamadaki config.js içine bu URL yazılır.
 *
 * GÜNLÜK KULLANIM (tablodan):
 *  - Öğrenciler sayfası: Ad Soyad, Telefon yaz. "Kod" boşsa menüden Akademi → Eksik kodları üret. Kodu öğrenciye/veliye WhatsApp'tan sen ver.
 *  - Durum "pasif" yazarsan öğrenci giremez. "Cihaz" hücresini silersen öğrenci yeni telefonda/tablette girebilir (kilit sıfırlanır).
 *  - Modüller sayfası: "Açık" sütununa EVET yazdığın oyun ve konular öğrencilerde açılır. Uygulamaya yeni oyun eklendiğinde yeni satır gelir.
 *  - İlerleme sayfası: öğrencinin çözdüğü setler (ad, modül, doğru/toplam) otomatik yazılır.
 */
const SAYFA = { ogr: 'Öğrenciler', mod: 'Modüller', ilr: 'İlerleme', ayar: 'Ayarlar', due: 'Düellolar', mey: 'Bulmaca Düelloları', tur: 'Turnuvalar' };
const MODULLER = [
  ['pentago-1', 'Pentago · Tahtayı tanı', 'EVET'], ['pentago-2', 'Pentago · Beşli kur', 'EVET'], ['pentago-3', 'Pentago · Çevirerek kazan', 'HAYIR'], ['pentago-4', 'Pentago · Usta bulmacaları', 'HAYIR'],
  ['pentago-oyun', 'Pentago · Oyun (bilgisayara ve arkadaşa karşı)', 'EVET'],
  ['kure-1', 'Küre · Diziliş ve hareket', 'EVET'], ['kure-2', 'Küre · Dörtlü yasağı ve yakalama', 'HAYIR'], ['kure-oyun', 'Küre · Oyun (bilgisayara ve arkadaşa karşı)', 'HAYIR'],
  ['satranc-tahta', 'Satranç · Tahta (arkadaşınla oyna)', 'EVET'],
  ['duello', 'Yarış · Canlı düello', 'HAYIR'], ['bulmaca-duello', 'Yarış · Bulmaca düellosu', 'HAYIR'], ['turnuva', 'Yarış · Turnuvalar', 'HAYIR'], ['siralama', 'Yarış · Haftalık sıralama', 'HAYIR'],
].concat(['Satranç tahtası ve taşlar', 'Kale ve fil', 'Vezir ve şah', 'At', 'Piyon, terfi ve geçerken alma', 'Şah çekme, mat ve pat', 'Rok ve taş değerleri', 'Temel matlar', 'Açılış tuzakları', 'Taktik: çatal', 'Taktik: açmaz', 'Son yatay matı']
  .map((a, i) => ['satranc-' + (i + 1), 'Satranç · ' + (i + 1) + '. konu: ' + a, i === 0 ? 'EVET' : 'HAYIR']));

function tablo_() {
  const id = PropertiesService.getScriptProperties().getProperty('TABLO');
  if (!id) throw new Error('Önce kurulum() çalıştırılmalı.');
  return SpreadsheetApp.openById(id);
}

function kurulum() {
  const P = PropertiesService.getScriptProperties();
  const ss = SpreadsheetApp.getActiveSpreadsheet() || (P.getProperty('TABLO') ? SpreadsheetApp.openById(P.getProperty('TABLO')) : SpreadsheetApp.create('Akademi · Öğrenciler ve Modüller'));
  P.setProperty('TABLO', ss.getId());
  if (!P.getProperty('GIZLI')) P.setProperty('GIZLI', Utilities.getUuid() + Utilities.getUuid());
  const sayfa = (ad, baslik) => { let s = ss.getSheetByName(ad); if (!s) { s = ss.insertSheet(ad); s.appendRow(baslik); s.setFrozenRows(1); s.getRange(1, 1, 1, baslik.length).setFontWeight('bold').setBackground('#fff3bf'); } return s; };
  const o = sayfa(SAYFA.ogr, ['Ad Soyad', 'Telefon', 'Kod', 'Cihaz', 'Durum', 'Son giriş', 'Grup']);
  o.getRange('B:C').setNumberFormat('@');
  const m = sayfa(SAYFA.mod, ['Anahtar', 'Ad', 'Açık', 'Not']);
  const var_ = m.getLastRow() > 1 ? m.getRange(2, 1, m.getLastRow() - 1, 1).getValues().map((r) => r[0]) : [];
  MODULLER.forEach((r) => { if (!var_.includes(r[0])) m.appendRow([r[0], r[1], r[2], '']); });
  sayfa(SAYFA.ilr, ['Zaman', 'Ad Soyad', 'Modül', 'Doğru', 'Toplam']);
  sayfa(SAYFA.due, ['ID', 'Oyun', 'Oyuncu 1 (başlar)', 'Oyuncu 2', 'Durum', 'Hamleler', 'Sonuç', 'Turnuva', 'Tur', 'Güncelleme']);
  sayfa(SAYFA.mey, ['ID', 'Modül', 'Sorular', 'Oyuncu 1', 'Doğru 1', 'Süre 1 (sn)', 'Oyuncu 2', 'Doğru 2', 'Süre 2 (sn)', 'Durum', 'Zaman']);
  sayfa(SAYFA.tur, ['ID', 'Ad', 'Oyun', 'Katılımcılar (virgülle; boşsa tüm aktif öğrenciler)', 'Toplam tur', 'Şimdiki tur', 'Durum']);
  const ilk = ss.getSheetByName('Sayfa1') || ss.getSheetByName('Sheet1'); if (ilk && ss.getSheets().length > 1) ss.deleteSheet(ilk);
  Logger.log('Tablo: ' + ss.getUrl());
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Akademi').addItem('Eksik kodları üret', 'kodUret').addItem('Seçili öğrencinin cihaz kilidini sıfırla', 'kilitSifirla').addSeparator().addItem('Seçili turnuvada sonraki turu eşleştir', 'turnuvaTur').addToUi();
}
function kodUret() {
  const s = tablo_().getSheetByName(SAYFA.ogr), n = s.getLastRow() - 1; if (n < 1) return;
  const R = s.getRange(2, 1, n, 5).getValues();
  R.forEach((r, i) => { if (r[0] && !r[2]) s.getRange(i + 2, 3).setValue(String(1000 + Math.floor(Math.random() * 9000))); if (r[0] && !r[4]) s.getRange(i + 2, 5).setValue('aktif'); });
}
function kilitSifirla() { const s = SpreadsheetApp.getActiveSheet(), r = s.getActiveRange().getRow(); if (s.getName() === SAYFA.ogr && r > 1) s.getRange(r, 4).setValue(''); }

// ---------- yardımcılar ----------
const kucuk_ = (s) => String(s || '').toLocaleLowerCase('tr-TR').normalize('NFC').replace(/\s+/g, ' ').trim();
const tel_ = (s) => String(s || '').replace(/\D/g, '').slice(-10);
const imza_ = (veri) => Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(veri, PropertiesService.getScriptProperties().getProperty('GIZLI')));
function jeton_(o) { const v = Utilities.base64EncodeWebSafe(JSON.stringify(o), Utilities.Charset.UTF_8); return v + '.' + imza_(v); }
function jetonAc_(j) {
  const [v, i] = String(j || '').split('.'); if (!v || i !== imza_(v)) return null;
  const o = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(v)).getDataAsString('UTF-8'));
  return o.son > Date.now() ? o : null;
}
const cevap_ = (o) => ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
function ogrenciBul_(ad, tel) {
  const s = tablo_().getSheetByName(SAYFA.ogr), n = s.getLastRow() - 1; if (n < 1) return null;
  const R = s.getRange(2, 1, n, 7).getValues();
  for (let i = 0; i < n; i++) if (kucuk_(R[i][0]) === kucuk_(ad) && tel_(R[i][1]) === tel_(tel) && tel_(tel).length === 10) return { satir: i + 2, r: R[i], s };
  return null;
}
function aciklar_() {
  const s = tablo_().getSheetByName(SAYFA.mod), n = s.getLastRow() - 1; if (n < 1) return [];
  return s.getRange(2, 1, n, 3).getValues().filter((r) => /^evet$/i.test(String(r[2]).trim())).map((r) => String(r[0]));
}

// ---------- web uygulaması ----------
function doGet() { return cevap_({ ok: true, ad: 'Ankara Zeka ve Bilim Akademisi' }); }
function doPost(e) {
  try {
    const q = JSON.parse(e.postData.contents || '{}');
    if (q.islem === 'giris') return cevap_(giris_(q));
    const j = jetonAc_(q.jeton); if (!j) return cevap_({ ok: false, cikis: true, hata: 'Oturumun süresi doldu. Yeniden giriş yap.' });
    const o = ogrenciBul_(j.ad, j.tel);
    if (!o || String(o.r[4]).trim() === 'pasif' || String(o.r[3]) !== j.cihaz) return cevap_({ ok: false, cikis: true, hata: 'Bu hesap bu cihazda açık değil. Öğretmenine söyle.' });
    if (q.islem === 'durum') return cevap_({ ok: true, ad: o.r[0], moduller: aciklar_() });
    if (YARIS[q.islem]) return cevap_(YARIS[q.islem](o.r[0], q));
    if (q.islem === 'ilerleme') {
      const L = (q.kayitlar || []).slice(0, 50), s = tablo_().getSheetByName(SAYFA.ilr);
      L.forEach((k) => s.appendRow([new Date(k.zaman || Date.now()), o.r[0], String(k.modul).slice(0, 40), +k.dogru || 0, +k.toplam || 0]));
      return cevap_({ ok: true, yazilan: L.length });
    }
    return cevap_({ ok: false, hata: 'Bilinmeyen işlem.' });
  } catch (err) { return cevap_({ ok: false, hata: 'Sunucu hatası: ' + err.message }); }
}
function giris_(q) {
  const C = CacheService.getScriptCache(), anahtar = 'deneme-' + tel_(q.tel), deneme = +(C.get(anahtar) || 0);
  if (deneme >= 5) return { ok: false, hata: 'Çok fazla yanlış deneme. 15 dakika sonra tekrar dene.' };
  const yanlis = (m) => { C.put(anahtar, String(deneme + 1), 900); return { ok: false, hata: m }; };
  const o = ogrenciBul_(q.ad, q.tel);
  if (!o) return yanlis('Ad soyad ya da telefon listede yok. Öğretmeninin yazdığı gibi yaz.');
  if (String(o.r[2]).trim() !== String(q.kod || '').trim()) return yanlis('Kod yanlış. Kodu öğretmeninden al.');
  if (String(o.r[4]).trim() === 'pasif') return { ok: false, hata: 'Hesabın kapalı. Öğretmenine söyle.' };
  const cihaz = String(q.cihaz || '').slice(0, 64); if (cihaz.length < 16) return { ok: false, hata: 'Cihaz tanınmadı.' };
  if (o.r[3] && String(o.r[3]) !== cihaz) return { ok: false, hata: 'Bu hesap başka bir telefonda/tablette açık. Yeni cihaz için öğretmenin kilidi sıfırlamalı.' };
  if (!o.r[3]) o.s.getRange(o.satir, 4).setValue(cihaz);
  o.s.getRange(o.satir, 6).setValue(new Date());
  C.remove(anahtar);
  return { ok: true, ad: o.r[0], jeton: jeton_({ ad: o.r[0], tel: tel_(o.r[1]), cihaz, son: Date.now() + 1000 * 60 * 60 * 24 * 120 }), moduller: aciklar_() };
}

// ===================== YARIŞ: canlı düello, bulmaca düellosu, turnuva, sıralama =====================
// Hamleler istemcide kural motoruyla doğrulanır; sunucu sırayı (yalnız sırası gelen oyuncu hamle ekler) ve sonucu tutar.
const satirlar_ = (ad) => { const s = tablo_().getSheetByName(ad), n = s.getLastRow() - 1; return { s, R: n > 0 ? s.getRange(2, 1, n, s.getLastColumn()).getValues() : [] }; };
const yeniId_ = () => Utilities.getUuid().slice(0, 8);
const kilit_ = (f) => { const L = LockService.getScriptLock(); L.waitLock(20000); try { return f(); } finally { L.releaseLock(); } };
const aktifler_ = () => satirlar_(SAYFA.ogr).R.filter((r) => r[0] && String(r[4]).trim() !== 'pasif').map((r) => String(r[0]));
function duelloNesne_(r) { return { id: r[0], oyun: r[1], o1: r[2], o2: r[3], durum: r[4], hamleler: JSON.parse(r[5] || '[]'), sonuc: r[6], turnuva: r[7], tur: r[8] }; }
const YARIS = {
  arkadaslar: (ben) => ({ ok: true, liste: aktifler_().filter((a) => a !== ben) }),
  duellolar: (ben) => ({ ok: true, liste: satirlar_(SAYFA.due).R.filter((r) => (r[2] === ben || r[3] === ben || (!r[3] && r[4] === 'bekliyor')) && r[4] !== 'iptal')
    .filter((r) => r[4] !== 'bitti' || Date.now() - new Date(r[9]).getTime() < 3 * 864e5).map(duelloNesne_).slice(-30) }),
  duelloAc: (ben, q) => kilit_(() => { const { s } = satirlar_(SAYFA.due), id = yeniId_(), oyun = ['Pentago', 'Küre', 'Satranç'].includes(q.oyun) ? q.oyun : 'Pentago';
    const rakip = q.rakip && aktifler_().includes(q.rakip) && q.rakip !== ben ? q.rakip : '';
    s.appendRow([id, oyun, ben, rakip, rakip ? 'davet' : 'bekliyor', '[]', '', '', '', new Date()]); return { ok: true, id }; }),
  duelloKatil: (ben, q) => kilit_(() => { const { s, R } = satirlar_(SAYFA.due), i = R.findIndex((r) => r[0] === q.id); if (i < 0) return { ok: false, hata: 'Düello bulunamadı.' };
    const r = R[i]; if (r[2] === ben) return { ok: true };
    if (r[4] === 'bekliyor' && !r[3]) { s.getRange(i + 2, 4, 1, 2).setValues([[ben, 'oynanıyor']]); s.getRange(i + 2, 10).setValue(new Date()); return { ok: true }; }
    if (r[4] === 'davet' && r[3] === ben) { s.getRange(i + 2, 5).setValue('oynanıyor'); s.getRange(i + 2, 10).setValue(new Date()); return { ok: true }; }
    return { ok: false, hata: 'Bu düelloya katılamazsın.' }; }),
  duelloDurum: (ben, q) => { const r = satirlar_(SAYFA.due).R.find((x) => x[0] === q.id); return r ? { ok: true, duello: duelloNesne_(r) } : { ok: false, hata: 'Düello bulunamadı.' }; },
  hamle: (ben, q) => kilit_(() => { const { s, R } = satirlar_(SAYFA.due), i = R.findIndex((r) => r[0] === q.id); if (i < 0) return { ok: false, hata: 'Düello bulunamadı.' };
    const d = duelloNesne_(R[i]); if (d.durum !== 'oynanıyor') return { ok: false, hata: 'Oyun devam etmiyor.' };
    const sira = d.hamleler.length % 2 === 0 ? d.o1 : d.o2; if (sira !== ben) return { ok: false, hata: 'Sıra sende değil.' };
    if (q.sira !== d.hamleler.length) return { ok: false, hata: 'Tahta güncel değil, yenileniyor.' };
    d.hamleler.push(q.hamle); const son = q.sonuc ? String(q.sonuc).slice(0, 60) : '';
    s.getRange(i + 2, 5, 1, 3).setValues([[son ? 'bitti' : 'oynanıyor', JSON.stringify(d.hamleler), son]]); s.getRange(i + 2, 10).setValue(new Date()); return { ok: true }; }),
  pesEt: (ben, q) => kilit_(() => { const { s, R } = satirlar_(SAYFA.due), i = R.findIndex((r) => r[0] === q.id); if (i < 0) return { ok: false };
    const d = duelloNesne_(R[i]); if (d.o1 !== ben && d.o2 !== ben) return { ok: false };
    if (d.durum === 'bekliyor' || d.durum === 'davet') { s.getRange(i + 2, 5).setValue('iptal'); return { ok: true }; }
    if (d.durum === 'oynanıyor') { s.getRange(i + 2, 5, 1, 3).setValues([['bitti', JSON.stringify(d.hamleler), (d.o1 === ben ? d.o2 : d.o1) + ' kazandı (rakip pes etti)']]); s.getRange(i + 2, 10).setValue(new Date()); }
    return { ok: true }; }),
  meydanAc: (ben, q) => kilit_(() => { const { s } = satirlar_(SAYFA.mey), id = yeniId_(); s.appendRow([id, String(q.modul).slice(0, 30), JSON.stringify(q.sorular || []).slice(0, 2000), ben, '', '', String(q.rakip || ''), '', '', 'açık', new Date()]); return { ok: true, id }; }),
  meydanlar: (ben) => ({ ok: true, liste: satirlar_(SAYFA.mey).R.filter((r) => r[3] === ben || r[6] === ben || (!r[6] && r[9] === 'açık')).slice(-30).map((r) => ({ id: r[0], modul: r[1], sorular: JSON.parse(r[2] || '[]'), o1: r[3], d1: r[4], t1: r[5], o2: r[6], d2: r[7], t2: r[8], durum: r[9] })) }),
  meydanSonuc: (ben, q) => kilit_(() => { const { s, R } = satirlar_(SAYFA.mey), i = R.findIndex((r) => r[0] === q.id); if (i < 0) return { ok: false, hata: 'Bulunamadı.' };
    const r = R[i], d = Math.max(0, Math.min(10, +q.dogru || 0)), sn = Math.max(1, Math.round(+q.sure || 0));
    if (r[3] === ben && r[4] === '') s.getRange(i + 2, 5, 1, 2).setValues([[d, sn]]);
    else if (r[3] !== ben && r[7] === '' && (!r[6] || r[6] === ben)) s.getRange(i + 2, 7, 1, 3).setValues([[ben, d, sn]]);
    else return { ok: false, hata: 'Bu düelloyu zaten çözdün.' };
    const y = s.getRange(i + 2, 1, 1, 11).getValues()[0]; if (y[4] !== '' && y[7] !== '') s.getRange(i + 2, 10).setValue('bitti'); return { ok: true }; }),
  turnuvalar: () => { const D = satirlar_(SAYFA.due).R.map(duelloNesne_);
    return { ok: true, liste: satirlar_(SAYFA.tur).R.filter((r) => r[0] && r[6] && r[6] !== 'gizli').map((r) => { const M = D.filter((d) => d.turnuva === r[0]); return { id: r[0], ad: r[1], oyun: r[2], toplam: r[4], tur: r[5], durum: r[6], maclar: M, tablo: puanTablosu_(oyuncular_(r), M) }; }) }; },
  siralama: () => { const L = satirlar_(SAYFA.ilr).R.filter((r) => Date.now() - new Date(r[0]).getTime() < 7 * 864e5), P = {};
    L.forEach((r) => { P[r[1]] = (P[r[1]] || 0) + (+r[3] || 0); }); return { ok: true, liste: Object.entries(P).map(([ad, puan]) => ({ ad, puan })).sort((a, b) => b.puan - a.puan).slice(0, 30) }; },
};
const oyuncular_ = (r) => { const L = String(r[3] || '').split(',').map((x) => x.trim()).filter(Boolean); return L.length ? L : aktifler_(); };
function sonucPuan_(d, ad) { // sonuç metni: "<ad> kazandı ..." ya da "Berabere ..."
  if (d.durum !== 'bitti') return null; if (/^berabere/i.test(d.sonuc)) return 0.5; return String(d.sonuc).indexOf(ad + ' kazandı') === 0 ? 1 : 0;
}
function puanTablosu_(oyuncular, M) { // TAZOF tarzı: puan, sonra Buchholz (rakiplerin puan toplamı), sonra galibiyet
  const T = {}; oyuncular.forEach((a) => { T[a] = { ad: a, puan: 0, galibiyet: 0, oynanan: 0, rakipler: [] }; });
  M.forEach((d) => { if (d.o2 === 'BAY') { if (T[d.o1]) T[d.o1].puan += 1; return; }
    [d.o1, d.o2].forEach((a, k) => { if (!T[a]) return; T[a].rakipler.push(k ? d.o1 : d.o2); const p = sonucPuan_(d, a); if (p === null) return; T[a].puan += p; T[a].oynanan++; if (p === 1) T[a].galibiyet++; }); });
  Object.values(T).forEach((x) => { x.buchholz = x.rakipler.reduce((s, r) => s + (T[r] ? T[r].puan : 0), 0); delete x.rakipler; });
  return Object.values(T).sort((a, b) => b.puan - a.puan || b.buchholz - a.buchholz || b.galibiyet - a.galibiyet || a.ad.localeCompare(b.ad, 'tr'));
}
// Öğretmen: Turnuvalar sayfasında satırı seç → Akademi → Seçili turnuvada sonraki turu eşleştir
// İsviçre sistemi: puana göre sırala, daha önce eşleşmeyenleri eşle; tek sayıda oyuncu varsa sonuncu BAY geçer (1 puan).
function turnuvaTur() {
  const s = SpreadsheetApp.getActiveSheet(), satir = s.getActiveRange().getRow(), ui = SpreadsheetApp.getUi();
  if (s.getName() !== SAYFA.tur || satir < 2) { ui.alert('Turnuvalar sayfasında bir turnuva satırını seç.'); return; }
  const r = s.getRange(satir, 1, 1, 7).getValues()[0]; let id = r[0];
  if (!['Pentago', 'Küre', 'Satranç'].includes(r[2])) { ui.alert('Oyun sütununa Pentago, Küre ya da Satranç yaz.'); return; }
  if (!id) { id = yeniId_(); s.getRange(satir, 1).setValue(id); r[0] = id; }
  const D = satirlar_(SAYFA.due), M = D.R.map(duelloNesne_).filter((d) => d.turnuva === id), tur = (+r[5] || 0) + 1;
  if (M.some((d) => d.durum !== 'bitti')) { ui.alert('Bu turda bitmemiş maçlar var. Önce maçlar bitmeli.'); return; }
  if (r[4] && tur > +r[4]) { s.getRange(satir, 7).setValue('bitti'); ui.alert('Turnuva tamamlandı.'); return; }
  const tablo = puanTablosu_(oyuncular_(r), M), oynadi = new Set(M.map((d) => [d.o1, d.o2].sort().join('|')));
  const L = tablo.map((x) => x.ad), cift = [];
  const bay = L.length % 2 ? (L.slice().reverse().find((a) => !M.some((d) => d.o1 === a && d.o2 === 'BAY')) || L[L.length - 1]) : null;
  if (bay) L.splice(L.indexOf(bay), 1);
  while (L.length > 1) { const a = L.shift(); let j = L.findIndex((b) => !oynadi.has([a, b].sort().join('|'))); if (j < 0) j = 0; const b = L.splice(j, 1)[0];
    const ilk = M.filter((d) => d.o1 === a).length <= M.filter((d) => d.o1 === b).length; cift.push(ilk ? [a, b] : [b, a]); }
  if (bay) cift.push([bay, 'BAY']);
  cift.forEach(([a, b]) => D.s.appendRow([yeniId_(), r[2], a, b, b === 'BAY' ? 'bitti' : 'oynanıyor', '[]', b === 'BAY' ? a + ' kazandı (bay)' : '', id, tur, new Date()]));
  s.getRange(satir, 6, 1, 2).setValues([[tur, 'sürüyor']]);
  ui.alert(tur + '. tur eşleştirildi: ' + cift.map((c) => c.join(' – ')).join(', '));
}
