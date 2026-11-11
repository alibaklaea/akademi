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

## 5. Yarış: düello, bulmaca düellosu, turnuva, sıralama
- Modüller sayfasında `duello`, `bulmaca-duello`, `turnuva`, `siralama` satırlarına EVET yaz (kod güncellemesinden sonra **kurulum**'u bir kez daha çalıştır: yeni sayfalar ve satırlar eklenir; mevcut veriye dokunmaz).
- **Canlı düello:** öğrenci oyun ve rakip seçer (ya da herkese açık bırakır). Başlatan başlar: Pentago siyah, Küre mor, Satranç beyaz. Hamleler Düellolar sayfasına yazılır.
- **Bulmaca düellosu:** iki öğrenci aynı 10 soruyu çözer; daha çok doğru, eşitlikte daha kısa süre kazanır.
- **Turnuva:** Turnuvalar sayfasına bir satır yaz: Ad, Oyun (Pentago / Küre / Satranç), Katılımcılar (virgülle; boşsa tüm aktif öğrenciler), Toplam tur. Satırı seç → Akademi → **Seçili turnuvada sonraki turu eşleştir**. İsviçre sistemi: puana göre eşleşir, aynı iki kişi tekrar eşleşmez, tek sayıda oyuncu varsa biri BAY geçer (+1). Galibiyet 1, beraberlik 0,5. Eşitlikte Buchholz (rakiplerin puan toplamı), sonra galibiyet sayısı. Turdaki bütün maçlar bitmeden sonraki tur eşleşmez.
- **Sıralama:** son 7 günde doğru çözülen bulmaca sayısı.
- Not: Apps Script ücretsiz kotası ve ~2,5 sn yenileme yüzünden canlı düello sıra tabanlı oyunlar içindir; aynı anda çok sayıda maç olursa yanıtlar birkaç saniye gecikebilir.
