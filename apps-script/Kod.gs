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
const SAYFA = { ogr: 'Öğrenciler', mod: 'Modüller', ilr: 'İlerleme', ayar: 'Ayarlar' };
const MODULLER = [
  ['pentago-1', 'Pentago · Tahtayı tanı', 'EVET'], ['pentago-2', 'Pentago · Beşli kur', 'EVET'], ['pentago-3', 'Pentago · Çevirerek kazan', 'HAYIR'], ['pentago-4', 'Pentago · Usta bulmacaları', 'HAYIR'],
  ['pentago-oyun', 'Pentago · Oyun (bilgisayara ve arkadaşa karşı)', 'EVET'],
  ['kure-1', 'Küre · Diziliş ve hareket', 'EVET'], ['kure-2', 'Küre · Dörtlü yasağı ve yakalama', 'HAYIR'], ['kure-oyun', 'Küre · Oyun (bilgisayara ve arkadaşa karşı)', 'HAYIR'],
  ['satranc-tahta', 'Satranç · Tahta (arkadaşınla oyna)', 'EVET'],
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
  const ilk = ss.getSheetByName('Sayfa1') || ss.getSheetByName('Sheet1'); if (ilk && ss.getSheets().length > 1) ss.deleteSheet(ilk);
  Logger.log('Tablo: ' + ss.getUrl());
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Akademi').addItem('Eksik kodları üret', 'kodUret').addItem('Seçili öğrencinin cihaz kilidini sıfırla', 'kilitSifirla').addToUi();
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
