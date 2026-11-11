// Ankara Zeka ve Bilim Akademisi — öğrenci uygulaması
(function () {
  const V = window.AKADEMI_VERI, T = window.TAHTA, M = window.MOTOR, esc = T.esc, $ = (s) => document.querySelector(s);
  const API = (window.AKADEMI_AYAR || {}).api || '';
  const DEMO = !API && /^(localhost|127\.0\.0\.1)$/.test(location.hostname); // yalnız bilgisayardaki denemede
  const sakla = (k, v) => { try { localStorage.setItem('akd.' + k, JSON.stringify(v)); } catch (e) {} };
  const oku = (k, d) => { try { const v = localStorage.getItem('akd.' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  const cihaz = () => { let c = oku('cihaz'); if (!c) { const a = new Uint8Array(16); crypto.getRandomValues(a); c = [...a].map((x) => x.toString(16).padStart(2, '0')).join(''); sakla('cihaz', c); } return c; };

  // ---------- katalog: Google Tablo'daki "Modüller" anahtarlarıyla aynı ----------
  const KATALOG = [
    { k: 'pentago-1', oyun: 'Pentago', ad: 'Tahtayı tanı', ikon: '◉', tur: 'bulmaca', veri: 'pentago', konular: [0, 1, 2, 3] },
    { k: 'pentago-2', oyun: 'Pentago', ad: 'Beşli kur', ikon: '◉', tur: 'bulmaca', veri: 'pentago', konular: [4, 5, 6] },
    { k: 'pentago-3', oyun: 'Pentago', ad: 'Çevirerek kazan', ikon: '◉', tur: 'bulmaca', veri: 'pentago', konular: [7, 8, 9] },
    { k: 'pentago-4', oyun: 'Pentago', ad: 'Usta bulmacaları', ikon: '◉', tur: 'bulmaca', veri: 'pentago', konular: [10, 11] },
    { k: 'pentago-oyun', oyun: 'Pentago', ad: 'Oyna', ikon: '▶', tur: 'pentago' },
    { k: 'kure-1', oyun: 'Küre', ad: 'Diziliş ve hareket', ikon: '●', tur: 'bulmaca', veri: 'kure', konular: [0, 1, 2, 3, 4] },
    { k: 'kure-2', oyun: 'Küre', ad: 'Dörtlü yasağı ve yakalama', ikon: '●', tur: 'bulmaca', veri: 'kure', konular: [5, 6, 7, 8, 9] },
    { k: 'kure-oyun', oyun: 'Küre', ad: 'Oyna', ikon: '▶', tur: 'kure' },
    { k: 'satranc-tahta', oyun: 'Satranç', ad: 'Arkadaşınla oyna', ikon: '♞', tur: 'satranc' },
    ...V.satranc.map((s, i) => ({ k: 'satranc-' + (i + 1), oyun: 'Satranç', ad: `${i + 1}. ${s.ad}`, ikon: '♟', tur: 'bulmaca', veri: 'satranc', konular: [i] }))];
  let ogr = oku('ogrenci'), acik = new Set(oku('moduller', []));

  // ---------- sunucu ----------
  async function sunucu(govde) {
    if (DEMO) return demoSunucu(govde);
    const y = await fetch(API, { method: 'POST', body: JSON.stringify(govde), headers: { 'Content-Type': 'text/plain;charset=utf-8' } });
    return y.json();
  }
  function demoSunucu(q) { // yalnız localhost: deneme hesabı
    if (q.islem === 'giris') return q.kod === '1234' ? { ok: true, ad: q.ad || 'Deneme Öğrenci', jeton: 'demo', moduller: KATALOG.map((x) => x.k) } : { ok: false, hata: 'Deneme kodu 1234' };
    return { ok: true, ad: ogr && ogr.ad, moduller: KATALOG.map((x) => x.k) };
  }
  async function yenile() {
    if (!ogr) return;
    try { const c = await sunucu({ islem: 'durum', jeton: ogr.jeton });
      if (c.cikis) { cikis(c.hata); return; }
      if (c.ok) { acik = new Set(c.moduller); sakla('moduller', c.moduller); if (location.hash === '' || location.hash === '#') ana(); }
    } catch (e) { /* çevrim dışı: önbellekteki modüllerle devam */ }
    gonder();
  }
  async function gonder() { // ilerleme kuyruğu
    const L = oku('kuyruk', []); if (!L.length || !ogr || DEMO) { if (DEMO) sakla('kuyruk', []); return; }
    try { const c = await sunucu({ islem: 'ilerleme', jeton: ogr.jeton, kayitlar: L.slice(0, 50) }); if (c.ok) sakla('kuyruk', L.slice(c.yazilan)); } catch (e) {}
  }
  function kaydet(modul, dogru, toplam) { const L = oku('kuyruk', []); L.push({ modul, dogru, toplam, zaman: Date.now() }); sakla('kuyruk', L); gonder(); }
  function cikis(not) { ogr = null; sakla('ogrenci', null); sakla('moduller', []); acik = new Set(); location.hash = ''; giris(not); }

  // ---------- giriş ----------
  function giris(not) {
    $('#ust').hidden = true;
    $('#sahne').innerHTML = `<div class="giris"><img src="img/logo.png" alt=""><h1>Ankara Zeka ve Bilim Akademisi</h1><p>Çocuk Kulübü öğrencilerine özel uygulama</p>
      <form id="gf"><label>Adın ve soyadın<input name="ad" autocomplete="name" required placeholder="Öğretmenine verdiğin gibi"></label>
      <label>Telefon numarası<input name="tel" inputmode="tel" required placeholder="05xx xxx xx xx"></label>
      <label>Öğretmen kodu<input name="kod" inputmode="numeric" maxlength="6" required placeholder="4 haneli kod"></label>
      <button class="btn ana">Giriş yap</button><p class="hata" id="gh">${esc(not || '')}</p></form>
      <p class="kucuk">Kodu öğretmenin verir. Hesabın yalnızca bu cihazda açılır.${DEMO ? ' <b>Deneme modu: kod 1234</b>' : ''}</p></div>`;
    $('#gf').onsubmit = async (e) => { e.preventDefault(); const f = new FormData(e.target), b = e.target.querySelector('button'); b.disabled = true; $('#gh').textContent = 'Kontrol ediliyor…';
      try { const c = await sunucu({ islem: 'giris', ad: f.get('ad'), tel: f.get('tel'), kod: f.get('kod'), cihaz: cihaz() });
        if (!c.ok) { $('#gh').textContent = c.hata || 'Giriş yapılamadı.'; b.disabled = false; return; }
        ogr = { ad: c.ad, jeton: c.jeton }; sakla('ogrenci', ogr); acik = new Set(c.moduller); sakla('moduller', c.moduller); location.hash = ''; ana();
      } catch (err) { $('#gh').textContent = 'İnternet bağlantısı yok ya da sunucuya ulaşılamadı.'; b.disabled = false; } };
  }

  // ---------- ana sayfa ----------
  const ilerleme = (m) => { if (m.tur !== 'bulmaca') return null; const C = oku('cozulen', {}); let top = 0, coz = 0;
    m.konular.forEach((i) => { const L = V[m.veri][i].s; top += L.length; coz += (C[`${m.veri}-${i}`] || []).length; }); return [coz, top]; };
  function ana() {
    $('#ust').hidden = false; $('#ustAd').textContent = ogr.ad;
    const gruplar = ['Pentago', 'Küre', 'Satranç'];
    $('#sahne').innerHTML = `<div class="selam"><h2>Merhaba ${esc(ogr.ad.split(' ')[0])}! 👋</h2><p>Bugün hangi oyunu çalışmak istersin?</p></div>
      ${gruplar.map((g) => `<h3 class="grup g-${g === 'Küre' ? 'kure' : g === 'Satranç' ? 'satranc' : 'pentago'}">${g}</h3><div class="kartlar">${KATALOG.filter((m) => m.oyun === g).map((m) => { const a = acik.has(m.k), p = ilerleme(m);
        return `<a class="mkart ${a ? '' : 'kilit'}" ${a ? `href="#m/${m.k}"` : ''}><span class="ik">${a ? m.ikon : '🔒'}</span><b>${esc(m.ad)}</b>${a ? (p ? `<span class="cubuk"><i style="width:${Math.round(100 * p[0] / p[1])}%"></i></span><small>${p[0]}/${p[1]} soru</small>` : '<small>Hemen oyna</small>') : '<small>Öğretmenin açınca gelecek</small>'}</a>`; }).join('')}</div>`).join('')}`;
  }

  // ---------- bulmaca ----------
  function bulmaca(m) {
    const C = oku('cozulen', {}), havuz = m.konular.flatMap((i) => V[m.veri][i].s.map((q, j) => ({ q, id: `${m.veri}-${i}`, j, konu: V[m.veri][i] })));
    const kalan = havuz.filter((x) => !(C[x.id] || []).includes(x.j)), kaynak = kalan.length >= 10 ? kalan : havuz;
    const set = kaynak.sort(() => Math.random() - .5).slice(0, 10); let i = 0, dogru = 0, hata = 0;
    function ciz() {
      const { q, konu } = set[i], d = q.d; hata = 0;
      let tah = '';
      if (q.f) tah = T.satranc(q.f, { yildiz: q.y, vurgu: q.v, dokun: !!d.kare });
      else if (q.t2) tah = `<div class="ikili">${T.tabla3(q.t.s)}<span>→</span>${T.tabla3(['...', '...', '...'], { dokun: true })}</div>`;
      else if (q.t) tah = q.t.tur === 'k' ? T.kure(q.t.s, q.t.m, { dokun: !!d.kare }) : T.pentago(q.t.s, q.t.m, { dokun: !!d.kare });
      $('#sahne').innerHTML = `<div class="ust-cubuk"><a class="btn" href="#">‹ Menü</a><span>${esc(m.oyun)} · ${esc(m.ad)}</span><span class="noktalar">${set.map((_, k) => `<i class="${k < i ? 'tamam' : k === i ? 'simdi' : ''}"></i>`).join('')}</span></div>
        <div class="soru ${tah ? '' : 'yazili'}">${tah ? `<div class="soru-tahta">${tah}</div>` : ''}<div class="soru-yan"><small>${esc(konu.ad)}</small><h2>${esc(q.m)}</h2>
          ${(d.alanlar || []).map((a, k) => `<div class="secim" data-g="${k}">${d.alanlar.length > 1 ? `<small>${esc(a.ad)}</small>` : ''}<div>${a.secenek.map((x) => `<button class="btn sec" data-v="${esc(x)}">${esc(x)}</button>`).join('')}</div></div>`).join('')}
          ${d.kare ? `<p class="ipucu">${d.kare.length ? 'Doğru karelere dokun.' : 'Hiçbir taş alınmıyorsa bir yere dokunmadan “Kontrol et”e bas.'}</p>` : ''}
          <div class="geri" id="gb"></div><div class="dugmeler"><button class="btn ana" id="kontrol">Kontrol et</button><button class="btn" id="sonra" hidden>Sonraki ›</button></div></div></div>`;
      document.querySelectorAll('.secim').forEach((g) => g.querySelectorAll('.sec').forEach((b) => b.onclick = () => { g.querySelectorAll('.sec').forEach((x) => x.classList.remove('secili')); b.classList.add('secili'); }));
      document.querySelectorAll('.dk').forEach((r) => r.onclick = () => { r.classList.toggle('secili'); r.setAttribute('fill', r.classList.contains('secili') ? 'rgba(255,212,59,.55)' : 'transparent'); });
      document.querySelectorAll('.dk3').forEach((r) => r.onclick = () => { const s = ['.', 'S', 'B'], n = s[(s.indexOf(r.dataset.t || '.') + 1) % 3]; r.dataset.t = n; r.setAttribute('fill', n === 'S' ? 'rgba(0,0,0,.85)' : n === 'B' ? 'rgba(255,255,255,.95)' : 'transparent'); });
      $('#kontrol').onclick = kontrol; $('#sonra').onclick = () => { i++; i < set.length ? ciz() : bitir(); };
    }
    function kontrol() {
      const { q, id, j } = set[i], d = q.d; let ok = true;
      for (const [k, a] of (d.alanlar || []).entries()) { const b = document.querySelector(`[data-g="${k}"] .secili`); if (!b) return geri('Önce cevabını seç.', 'uyari'); if (b.dataset.v !== a.dogru) ok = false; }
      if (d.kare) { const s = [...document.querySelectorAll('.dk.secili')].map((r) => r.dataset.k).sort(), dk = d.kare.slice().sort(); if (s.join() !== dk.join()) ok = false; }
      if (d.cizim) { const h = [0, 1, 2].map((r) => [0, 1, 2].map((c) => (document.querySelector(`.dk3[data-c="${r}${c}"]`).dataset.t || '.')).join('')); if (h.join() !== d.cizim.join()) ok = false; }
      if (ok) { if (!hata) { dogru++; C[id] = [...new Set([...(C[id] || []), j])]; sakla('cozulen', C); } geri('✓ Aferin, doğru!', 'iyi'); bitti(); return; }
      hata++; if (hata < 2) return geri('✗ Olmadı, bir daha dene.', 'kotu');
      geri(`Doğru cevap: ${q.c}`, 'kotu'); if (d.kare) document.querySelectorAll('.dk').forEach((r) => { if (d.kare.includes(r.dataset.k)) r.setAttribute('fill', 'rgba(81,207,102,.6)'); }); bitti();
    }
    const geri = (m, c) => { $('#gb').textContent = m; $('#gb').className = 'geri ' + c; };
    const bitti = () => { $('#kontrol').hidden = true; $('#sonra').hidden = false; };
    function bitir() {
      kaydet(m.k, dogru, set.length); const y = dogru >= 9 ? 3 : dogru >= 6 ? 2 : dogru >= 3 ? 1 : 0;
      $('#sahne').innerHTML = `<div class="son"><div class="yildiz">${'★'.repeat(y)}${'☆'.repeat(3 - y)}</div><h1>${dogru} / ${set.length}</h1><p>${y === 3 ? 'Muhteşem! Usta gibi çözdün.' : y === 2 ? 'Çok iyi! Biraz daha pratikle 3 yıldız senin.' : 'Güzel deneme! Tekrar çözdükçe güçleneceksin.'}</p>
        <div class="dugmeler"><button class="btn ana" id="tekrar">Yeni 10 soru</button><a class="btn" href="#">Menü</a></div></div>`;
      $('#tekrar').onclick = () => bulmaca(m);
    }
    ciz();
  }

  // ---------- Pentago oyunu ----------
  function pentagoOyun() {
    const P = M.pentago; let b = Array(36).fill(0), sira = 1, rakip = null, seviye = 2, asama = 'koy', son = null, bitti = 0;
    const kurulum = () => { $('#sahne').innerHTML = `<div class="ust-cubuk"><a class="btn" href="#">‹ Menü</a><span>Pentago</span></div><div class="kur"><h2>Kime karşı oynayacaksın?</h2>
      <div class="dugmeler dikey">${[[1, 'Bilgisayar · Kolay'], [2, 'Bilgisayar · Orta'], [3, 'Bilgisayar · Zor']].map(([s, a]) => `<button class="btn ana" data-s="${s}">🤖 ${a}</button>`).join('')}<button class="btn" data-s="0">👫 Arkadaşımla (aynı cihazda)</button></div>
      <p class="kucuk">Sen siyahsın ve sen başlarsın. Bilyeni koy, sonra bir tablayı çevir.</p></div>`;
      document.querySelectorAll('[data-s]').forEach((x) => x.onclick = () => { rakip = +x.dataset.s ? 'pc' : 'insan'; seviye = +x.dataset.s || 2; ciz(); }); };
    const durumYaz = () => bitti ? (bitti === 'berabere' ? 'Berabere!' : `${bitti === 1 ? 'Siyah' : 'Beyaz'} kazandı! 🎉`) : rakip === 'pc' && sira === 2 ? 'Bilgisayar düşünüyor…' : `Sıra ${sira === 1 ? 'siyahta ⚫' : 'beyazda ⚪'}: ${asama === 'koy' ? 'boş bir çukura bilye koy' : 'bir tablayı çevir (sarı oklar)'}`;
    function ciz() {
      const isa = bitti && bitti !== 'berabere' ? P.besliler(b).flatMap((L) => L.map((i) => [Math.floor(i / 6), i % 6, 'o'])) : [];
      $('#sahne').innerHTML = `<div class="ust-cubuk"><a class="btn" href="#">‹ Menü</a><span>Pentago${rakip === 'pc' ? ` · Bilgisayar (${['', 'kolay', 'orta', 'zor'][seviye]})` : ' · Arkadaşınla'}</span></div>
        <div class="oyun"><div class="oyun-tahta">${P && T.pentago(b, isa, { dokun: !bitti && asama === 'koy' && !(rakip === 'pc' && sira === 2), ok: !bitti && asama === 'cevir', sec: son })}</div>
        <div class="oyun-yan"><p class="durum">${durumYaz()}</p><div class="dugmeler"><button class="btn" id="yeni">Yeni oyun</button></div>
        <details><summary>Kurallar</summary><ul>${V.kurallar.Pentago.map((k) => `<li>${esc(k)}</li>`).join('')}</ul></details></div></div>`;
      document.querySelectorAll('.dk').forEach((r) => r.onclick = () => { const i = 'ABCDEF'.indexOf(r.dataset.k[0]) + (+r.dataset.k[1] - 1) * 6; if (b[i]) return;
        const k = P.pKoy(b, sira, i); b = k.tahta; son = r.dataset.k; if (k.bitti) { bitti = sira; return biter(); } asama = 'cevir'; ciz(); });
      document.querySelectorAll('.ok').forEach((g) => g.onclick = () => { const c = P.pCevir(b, sira, +g.dataset.q, +g.dataset.d); b = c.tahta; son = null; if (c.sonuc) { bitti = c.sonuc; return biter(); } sira = 3 - sira; asama = 'koy'; ciz(); if (rakip === 'pc' && sira === 2) setTimeout(pc, 500); });
      $('#yeni').onclick = () => { b = Array(36).fill(0); sira = 1; asama = 'koy'; bitti = 0; son = null; kurulum(); };
    }
    function pc() { const h = P.pBilgisayar(b, 2, seviye); if (!h) { bitti = 'berabere'; return biter(); }
      const k = P.pKoy(b, 2, h.i); b = k.tahta; son = 'ABCDEF'[h.i % 6] + (Math.floor(h.i / 6) + 1); ciz();
      setTimeout(() => { if (h.q >= 0) b = h.tahta; if (h.sonuc) { bitti = h.sonuc; return biter(); } sira = 1; asama = 'koy'; ciz(); }, 700); }
    function biter() { ciz(); if (rakip === 'pc') kaydet('pentago-oyun', bitti === 1 ? 1 : 0, 1); }
    kurulum();
  }

  // ---------- Küre oyunu ----------
  function kureOyun() {
    const K = M.kure; let rows = K.kBaslangic(), sira = 'M', rakip = null, seviye = 2, sec = null, al = { M: 0, T: 0 }, bitti = '', not = '', hamle = 0;
    const kurulum = () => { $('#sahne').innerHTML = `<div class="ust-cubuk"><a class="btn" href="#">‹ Menü</a><span>Küre</span></div><div class="kur"><h2>Kime karşı oynayacaksın?</h2>
      <div class="dugmeler dikey">${[[1, 'Bilgisayar · Kolay'], [2, 'Bilgisayar · Orta'], [3, 'Bilgisayar · Zor']].map(([s, a]) => `<button class="btn ana" data-s="${s}">🤖 ${a}</button>`).join('')}<button class="btn" data-s="0">👫 Arkadaşımla (aynı cihazda)</button></div>
      <p class="kucuk">Sen morsun (alt sıra) ve sen başlarsın. Rakibin 4 taşını alan kazanır.</p></div>`;
      document.querySelectorAll('[data-s]').forEach((x) => x.onclick = () => { rakip = +x.dataset.s ? 'pc' : 'insan'; seviye = +x.dataset.s || 2; ciz(); }); };
    const yer = (a) => [+a.slice(1) - 1, 'ABCDEFG'.indexOf(a[0])];
    function ciz() {
      let hedef = []; if (sec) { const [r, c] = yer(sec); hedef = K.kGidis(rows, r, c); }
      $('#sahne').innerHTML = `<div class="ust-cubuk"><a class="btn" href="#">‹ Menü</a><span>Küre${rakip === 'pc' ? ` · Bilgisayar (${['', 'kolay', 'orta', 'zor'][seviye]})` : ' · Arkadaşınla'}</span></div>
        <div class="oyun"><div class="oyun-tahta">${T.kure(rows, [], { dokun: !bitti && !(rakip === 'pc' && sira === 'T'), hedef, sec })}</div>
        <div class="oyun-yan"><p class="durum">${bitti ? bitti : rakip === 'pc' && sira === 'T' ? 'Bilgisayar düşünüyor…' : `Sıra ${sira === 'M' ? 'morda 🟣' : 'turuncuda 🟠'}: ${sec ? 'yeşil noktalardan birine dokun' : 'bir taşına dokun'}`}</p>
          <p class="skor">🟣 Mor aldı: <b>${al.M}</b> · 🟠 Turuncu aldı: <b>${al.T}</b> (4 alan kazanır)</p>${not ? `<p class="geri kotu">${esc(not)}</p>` : ''}
          <div class="dugmeler"><button class="btn" id="yeni">Yeni oyun</button>${rakip === 'insan' && !bitti ? '<button class="btn" id="ber">Berabere bitir</button>' : ''}</div>
          <details><summary>Kurallar</summary><ul>${V.kurallar['Küre'].map((k) => `<li>${esc(k)}</li>`).join('')}</ul></details></div></div>`;
      document.querySelectorAll('.dk').forEach((r) => r.onclick = () => tikla(r.dataset.k));
      $('#yeni').onclick = () => { rows = K.kBaslangic(); sira = 'M'; sec = null; al = { M: 0, T: 0 }; bitti = ''; not = ''; hamle = 0; kurulum(); };
      if ($('#ber')) $('#ber').onclick = () => { bitti = 'Oyunu berabere bitirdiniz.'; ciz(); };
    }
    function tikla(a) {
      const [r, c] = yer(a); not = '';
      if (rows[r][c] === sira) { sec = sec === a ? null : a; if (sec && !K.kGidis(rows, r, c).length) not = 'Bu taş şu an hiçbir yere gidemiyor.'; return ciz(); }
      if (!sec) return ciz();
      const [r0, c0] = yer(sec); if (!K.kGidis(rows, r0, c0).some(([x, y]) => x === r && y === c)) { not = 'Oraya gidemezsin.'; return ciz(); }
      const o = K.kOyna(rows, r0, c0, r, c); if (o.dortlu) { not = 'Bu hamle dörtlü yapar: taşların yatay, dikey ya da çapraz dörtlü olamaz.'; return ciz(); }
      uygula(o);
    }
    function uygula(o) { rows = o.rows; al[sira] += o.al.length; sec = null; hamle++;
      if (al[sira] >= 4) { bitti = `${sira === 'M' ? 'Mor' : 'Turuncu'} kazandı! 🎉`; if (rakip === 'pc') kaydet('kure-oyun', sira === 'M' ? 1 : 0, 1); return ciz(); }
      sira = K.rakip(sira); if (!K.kHamleler(rows, sira).length) { bitti = `${sira === 'M' ? 'Morun' : 'Turuncunun'} oynayacak hamlesi kalmadı. Oyunu öğretmeninle değerlendirin.`; return ciz(); }
      ciz(); if (rakip === 'pc' && sira === 'T') setTimeout(() => { const h = K.kBilgisayar(rows, 'T', seviye); if (h) uygula(h); }, 600); }
    kurulum();
  }

  // ---------- satranç tahtası (iki kişi) ----------
  function satrancOyun(deneme = 0) {
    if (!window.Chess) { if (deneme < 20) return setTimeout(() => satrancOyun(deneme + 1), 150); $('#sahne').innerHTML = '<p class="geri kotu">Satranç motoru yüklenemedi. Sayfayı yenile.</p>'; return; }
    const oyun = new window.Chess(); let sec = null, cevir = false;
    function ciz() {
      const hed = sec ? oyun.moves({ square: sec, verbose: true }).map((x) => x.to) : [];
      const d = oyun.in_checkmate() ? `Mat! ${oyun.turn() === 'w' ? 'Siyah' : 'Beyaz'} kazandı 🎉` : oyun.in_stalemate() ? 'Pat: berabere.' : oyun.in_draw() ? 'Berabere.' : `Sıra ${oyun.turn() === 'w' ? 'beyazda ⚪' : 'siyahta ⚫'}${oyun.in_check() ? ' · ŞAH!' : ''}`;
      $('#sahne').innerHTML = `<div class="ust-cubuk"><a class="btn" href="#">‹ Menü</a><span>Satranç · Arkadaşınla</span></div>
        <div class="oyun"><div class="oyun-tahta">${T.satranc(oyun.fen(), { dokun: !oyun.game_over(), sec, hedef: hed, cevir })}</div>
        <div class="oyun-yan"><p class="durum">${d}</p><p class="kucuk">Taşına dokun, yeşil noktalardan birine dokun. Piyon son sıraya ulaşınca vezir olur.</p>
        <div class="dugmeler"><button class="btn" id="geri">↶ Geri al</button><button class="btn" id="cev">⇅ Tahtayı çevir</button><button class="btn" id="yeni">Yeni oyun</button></div></div></div>`;
      document.querySelectorAll('.dk').forEach((r) => r.onclick = () => { const k = r.dataset.k, t = oyun.get(k);
        if (sec && hed.includes(k)) { oyun.move({ from: sec, to: k, promotion: 'q' }); sec = null; return ciz(); }
        sec = t && t.color === oyun.turn() ? (sec === k ? null : k) : null; ciz(); });
      $('#geri').onclick = () => { oyun.undo(); sec = null; ciz(); }; $('#cev').onclick = () => { cevir = !cevir; ciz(); }; $('#yeni').onclick = () => { oyun.reset(); sec = null; ciz(); };
    }
    ciz();
  }

  // ---------- yönlendirme ----------
  function yon() {
    if (!ogr) return giris();
    const h = location.hash.replace(/^#/, ''), [a, k] = h.split('/');
    if (a === 'm') { const m = KATALOG.find((x) => x.k === k); if (!m || !acik.has(m.k)) { location.hash = ''; return; }
      return m.tur === 'bulmaca' ? bulmaca(m) : m.tur === 'pentago' ? pentagoOyun() : m.tur === 'kure' ? kureOyun() : satrancOyun(); }
    ana();
  }
  window.addEventListener('hashchange', yon);
  $('#cikis').onclick = () => { if (confirm('Çıkış yapılsın mı? Yeniden girmek için kodun gerekir.')) cikis(); };
  window.addEventListener('online', gonder);
  yon(); yenile();
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js');
})();
