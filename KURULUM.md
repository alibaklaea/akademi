# Ankara Zeka ve Bilim Akademisi — öğrenci uygulaması

Yalnızca Çocuk Kulübü öğrencilerinin girebildiği Pentago, Küre ve Satranç uygulaması (telefona kurulabilir web uygulaması).

## 1. Sunucu (Google Tablo + Apps Script) — bir kez
1. Google Drive → Yeni → Google E-Tablolar. Adı: **Akademi · Öğrenciler ve Modüller**.
2. Uzantılar → Apps Script → `apps-script/Kod.gs` dosyasının tamamını yapıştır → Kaydet.
3. İşlev listesinden **kurulum** → Çalıştır → izin ver. Tabloda Öğrenciler, Modüller, İlerleme sayfaları oluşur.
4. Dağıt → Yeni dağıtım → Web uygulaması → Çalıştıran: **Ben**, Erişim: **Herkes** → Dağıt → URL'yi kopyala.
5. `config.js` içindeki `api: ""` kısmına bu URL yazılır (Claude'a URL'yi vermen yeterli).

## 2. Öğrenci ekleme
- Öğrenciler sayfasına Ad Soyad ve Telefon yaz. Tabloyu yenile → **Akademi** menüsü → **Eksik kodları üret**.
- Her öğrencinin kodunu veliye WhatsApp'tan sen gönder. Öğrenci ad soyad + telefon + kodla girer.
- İlk girişte hesap o cihaza kilitlenir. Yeni cihaz için satırı seç → Akademi → **Seçili öğrencinin cihaz kilidini sıfırla**.
- Durum sütununa **pasif** yazarsan öğrenci giremez.

## 3. Oyun ve konu açma
- Modüller sayfasında **Açık** sütununa EVET yazdığın modüller öğrencilerde açılır (uygulama açıldığında güncellenir).
- Yeni oyun/konu eklemek için uygulama güncellenir; tabloya yeni satır `kurulum` ile gelir.

## 4. Güncelleme
- Sorular Öğretmen Masası bankalarından gelir: `node araclar/veri-uret.mjs`.
- Sürüm değişince `sw.js` içindeki SURUM artırılır.
