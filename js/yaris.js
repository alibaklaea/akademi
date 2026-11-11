// Yarış: canlı düello (Pentago, Küre, Satranç), bulmaca düellosu, turnuvalar, haftalık sıralama.
// Hamleler burada kural motoruyla doğrulanır; sunucu sırayı ve sonucu tutar. Oyuncu 1 başlar: Pentago siyah, Küre mor, Satranç beyaz.
window.YARIS_KUR = function (ctx) {
  const { sunucu, $, esc, T, M, V, ogr, DEMO, bulmaca, KATALOG } = ctx, acik = { has: ctx.acikMi };
  const RENK = { Pentago: ['siyah ⚫', 'beyaz ⚪'], 'Küre': ['mor 🟣', 'turuncu 🟠'], 'Satranç': ['beyaz ♙', 'siyah ♟'] };

  // ---------- oyun uyarlayıcıları: yeni(), uygula(durum, hamle), sonuc(durum) → 0 devam | 1 | 2 | 'berabere' ----------
  const UY = {
    Pentago: { yeni: () => ({ b: Array(36).fill(0), kazanan: 0 }),
      uygula(d, h) { const P = M.pentago, p = d.sira; const k = P.pKoy(d.b, p, h.i); if (k.bitti) return { b: k.tahta, kazanan: p };
        if (h.q < 0) throw new Error('çevirme eksik'); const c = P.pCevir(k.tahta, p, h.q, h.d); return { b: c.tahta, kazanan: c.sonuc }; },
      sonuc: (d) => d.kazanan },
    'Küre': { yeni: () => ({ rows: M.kure.kBaslangic(), al: [0, 0], kazanan: 0 }),
      uygula(d, h) { const K = M.kure, k = d.sira === 1 ? 'M' : 'T';
        if (d.rows[h.r0][h.c0] !== k || !K.kGidis(d.rows, h.r0, h.c0).some(([a, b]) => a === h.r && b === h.c)) throw new Error('kuralsız hamle');
        const o = K.kOyna(d.rows, h.r0, h.c0, h.r, h.c); if (o.dortlu) throw new Error('dörtlü'); const al = d.al.slice(); al[d.sira - 1] += o.al.length;
        let kazanan = al[d.sira - 1] >= 4 ? d.sira : 0; if (!kazanan && !K.kHamleler(o.rows, k === 'M' ? 'T' : 'M').length) kazanan = 'berabere';
        return { rows: o.rows, al, kazanan }; },
      sonuc: (d) => d.kazanan },
    'Satranç': { yeni: () => ({ c: new window.Chess() }),
      uygula(d, h) { const c = new window.Chess(d.c.fen()); if (!c.move({ from: h.from, to: h.to, promotion: 'q' })) throw new Error('kuralsız'); return { c }; },
      sonuc: (d) => (d.c.in_checkmate() ? (d.c.turn() === 'w' ? 2 : 1) : d.c.in_draw() || d.c.in_stalemate() ? 'berabere' : 0) },
  };
  function oynat(oyun, hamleler) { // hamle listesini baştan oynatır
    const U = UY[oyun]; let d = { ...U.yeni(), sira: 1 };
    for (const h of hamleler) { d = { ...U.uygula(d, h), sira: d.sira === 1 ? 2 : 1 }; }
    return d;
  }
  const sonucMetni = (D, s) => s === 'berabere' ? 'Berabere' : `${s === 1 ? D.o1 : D.o2} kazandı`;

  // ---------- canlı düello ekranı ----------
  function duelloEkrani(id) {
    let D = null, d = null, sec = null, bekle = null, cevir = false, mesaj = '', yukleniyor = false;
    async function cek() { const c = await sunucu({ islem: 'duelloDurum', id }); if (!c.ok) { $('#sahne').innerHTML = `<p class="geri kotu">${esc(c.hata || 'Düello açılamadı.')}</p><a class="btn" href="#yaris/duello">‹ Düellolar</a>`; return; }
      const yeni = JSON.stringify(c.duello.hamleler) !== JSON.stringify(D && D.hamleler) || !D || D.durum !== c.duello.durum;
      D = c.duello; if (yeni) { d = oynat(D.oyun, D.hamleler); sec = null; bekle = null; ciz(); } }
    const benNo = () => (D.o1 === ogr.ad ? 1 : D.o2 === ogr.ad ? 2 : 0);
    const siramMi = () => D.durum === 'oynanıyor' && d.sira === benNo() && !yukleniyor;
    async function gonder(h) {
      let y; try { y = { ...UY[D.oyun].uygula(d, h), sira: d.sira === 1 ? 2 : 1 }; } catch (e) { mesaj = 'Bu hamle kurallara uymuyor.'; return ciz(); }
      const s = UY[D.oyun].sonuc(y); yukleniyor = true; const once = d; d = y; sec = null; bekle = null; ciz();
      const c = await sunucu({ islem: 'hamle', id, sira: D.hamleler.length, hamle: h, sonuc: s ? sonucMetni(D, s) : '' });
      yukleniyor = false; if (!c.ok) { d = once; mesaj = c.hata || 'Hamle gönderilemedi.'; }
      await cek(); ciz();
    }
    function tahta() {
      const ben = benNo(), aktif = siramMi();
      if (D.oyun === 'Pentago') { const bb = bekle ? M.pentago.pKoy(d.b, d.sira, bekle.i).tahta : d.b; return T.pentago(bb, d.kazanan && d.kazanan !== 'berabere' ? M.pentago.besliler(d.b).flatMap((L) => L.map((i) => [Math.floor(i / 6), i % 6, 'o'])) : [], { dokun: aktif && !bekle, ok: aktif && !!bekle, sec: bekle ? 'ABCDEF'[bekle.i % 6] + (Math.floor(bekle.i / 6) + 1) : null }); }
      if (D.oyun === 'Küre') { let hedef = []; if (sec) { const [r, c] = sec; hedef = M.kure.kGidis(d.rows, r, c); } return T.kure(d.rows, [], { dokun: aktif, hedef, sec: sec ? 'ABCDEFG'[sec[1]] + (sec[0] + 1) : null }); }
      const hed = sec ? d.c.moves({ square: sec, verbose: true }).map((x) => x.to) : [];
      return T.satranc(d.c.fen(), { dokun: aktif, sec, hedef: hed, cevir: ben === 2 });
    }
    function ciz() {
      if (!D) return; const ben = benNo(), s = UY[D.oyun].sonuc(d), rakip = ben === 1 ? D.o2 : D.o1;
      const durum = D.durum === 'bitti' ? `🏁 ${esc(D.sonuc || sonucMetni(D, s))}` : D.durum !== 'oynanıyor' ? '⏳ Rakip bekleniyor…' : siramMi() ? `Sıra sende (${RENK[D.oyun][ben - 1]})` : yukleniyor ? 'Gönderiliyor…' : `${esc(rakip || 'Rakip')} düşünüyor…`;
      $('#sahne').innerHTML = `<div class="ust-cubuk"><a class="btn" href="#yaris/duello">‹ Düellolar</a><span>${esc(D.oyun)} düellosu${D.turnuva ? ` · Turnuva ${esc(D.tur)}. tur` : ''}</span></div>
        <div class="oyun"><div class="oyun-tahta">${tahta()}</div><div class="oyun-yan">
          <div class="vs"><span class="${d.sira === 1 && D.durum === 'oynanıyor' ? 'aktif' : ''}">${esc(D.o1)}<small>${RENK[D.oyun][0]}</small></span><b>VS</b><span class="${d.sira === 2 && D.durum === 'oynanıyor' ? 'aktif' : ''}">${esc(D.o2 || '…')}<small>${RENK[D.oyun][1]}</small></span></div>
          <p class="durum">${durum}</p>${D.oyun === 'Küre' ? `<p class="skor">Alınan taş: ${esc(D.o1)} ${d.al[0]} · ${esc(D.o2 || '…')} ${d.al[1]} (4 alan kazanır)</p>` : ''}
          ${D.oyun === 'Pentago' && bekle ? '<p class="ipucu">Şimdi sarı oklardan birine dokunup bir tablayı çevir.</p>' : ''}${mesaj ? `<p class="geri kotu">${esc(mesaj)}</p>` : ''}
          <div class="dugmeler">${D.durum === 'oynanıyor' || D.durum === 'bekliyor' || D.durum === 'davet' ? `<button class="btn" id="pes">${D.durum === 'oynanıyor' ? '🏳 Pes et' : 'İptal et'}</button>` : ''}<a class="btn" href="#yaris/duello">Lobiye dön</a></div>
          <p class="kucuk">Hamle sayısı: ${D.hamleler.length}. Tahta kendiliğinden yenilenir.</p></div></div>`;
      mesaj = '';
      document.querySelectorAll('.dk').forEach((r) => r.onclick = () => tikla(r.dataset.k));
      document.querySelectorAll('.ok').forEach((g) => g.onclick = () => { if (bekle) gonder({ i: bekle.i, q: +g.dataset.q, d: +g.dataset.d }); });
      if ($('#pes')) $('#pes').onclick = async () => { if (!confirm(D.durum === 'oynanıyor' ? 'Pes edersen rakibin kazanır. Emin misin?' : 'Düello iptal edilsin mi?')) return; await sunucu({ islem: 'pesEt', id }); cek(); };
    }
    function tikla(k) {
      if (!siramMi()) return;
      if (D.oyun === 'Pentago') { const i = 'ABCDEF'.indexOf(k[0]) + (+k[1] - 1) * 6; if (d.b[i]) return; const t = M.pentago.pKoy(d.b, d.sira, i);
        if (t.bitti) return gonder({ i, q: -1, d: 0 }); bekle = { i }; return ciz(); }
      if (D.oyun === 'Küre') { const r = +k.slice(1) - 1, c = 'ABCDEFG'.indexOf(k[0]), ben = d.sira === 1 ? 'M' : 'T';
        if (d.rows[r][c] === ben) { sec = sec && sec[0] === r && sec[1] === c ? null : [r, c]; return ciz(); }
        if (!sec) return; const o = M.kure.kOyna(d.rows, sec[0], sec[1], r, c);
        if (!M.kure.kGidis(d.rows, sec[0], sec[1]).some(([a, b]) => a === r && b === c)) { mesaj = 'Oraya gidemezsin.'; return ciz(); }
        if (o.dortlu) { mesaj = 'Bu hamle dörtlü yapar: taşların dörtlü olamaz.'; return ciz(); }
        return gonder({ r0: sec[0], c0: sec[1], r, c }); }
      const t = d.c.get(k); if (sec && d.c.moves({ square: sec, verbose: true }).some((x) => x.to === k)) return gonder({ from: sec, to: k });
      sec = t && t.color === d.c.turn() ? (sec === k ? null : k) : null; ciz();
    }
    const yokla = setInterval(() => { if (!location.hash.startsWith('#yaris/oyna/' + id)) return clearInterval(yokla); if (!yukleniyor) cek(); }, DEMO ? 1500 : 2500);
    $('#sahne').innerHTML = '<p class="kucuk">Düello yükleniyor…</p>'; cek();
  }

  // ---------- düello lobisi ----------
  async function lobi() {
    $('#sahne').innerHTML = `<div class="ust-cubuk"><a class="btn" href="#yaris">‹ Yarış</a><span>Canlı düello</span></div><p class="kucuk">Yükleniyor…</p>`;
    const [c, a] = await Promise.all([sunucu({ islem: 'duellolar' }), sunucu({ islem: 'arkadaslar' })]); if (!c.ok) return;
    const L = c.liste, ben = ogr.ad, kart = (D) => { const rakip = D.o1 === ben ? D.o2 : D.o1, bana = D.durum === 'davet' && D.o2 === ben, acikBekleyen = D.durum === 'bekliyor' && D.o1 !== ben;
      return `<div class="dkart"><b>${esc(D.oyun)}</b><span>${D.o1 === ben ? 'Sen' : esc(D.o1)} – ${D.o2 ? (D.o2 === ben ? 'Sen' : esc(D.o2)) : '<i>herkese açık</i>'}</span><small>${D.durum === 'bitti' ? '🏁 ' + esc(D.sonuc) : D.durum === 'oynanıyor' ? `▶ Oynanıyor · ${D.hamleler.length} hamle` : D.durum === 'davet' ? (bana ? '📨 Seni davet etti' : '📨 Davet gönderildi') : '⏳ Rakip bekleniyor'}${D.turnuva ? ' · turnuva maçı' : ''}</small>
        ${bana || acikBekleyen ? `<button class="btn ana kucuk" data-katil="${D.id}">Kabul et ve oyna</button>` : `<a class="btn kucuk" href="#yaris/oyna/${D.id}">${D.durum === 'bitti' ? 'Oyunu gör' : 'Aç'}</a>`}</div>`; };
    const gr = (b, f) => { const X = L.filter(f); return X.length ? `<h3 class="grup">${b}</h3><div class="dliste">${X.map(kart).join('')}</div>` : ''; };
    $('#sahne').innerHTML = `<div class="ust-cubuk"><a class="btn" href="#yaris">‹ Yarış</a><span>Canlı düello</span><button class="btn kucuk" id="yenile" style="margin-left:auto">↻ Yenile</button></div>
      <div class="kart-kutu"><h3>Yeni düello</h3><div class="satir"><label>Oyun<select id="dOyun">${['Pentago', 'Küre', 'Satranç'].map((o) => `<option>${o}</option>`).join('')}</select></label>
        <label>Rakip<select id="dRakip"><option value="">Herkese açık (ilk gelen oynar)</option>${(a.liste || []).map((x) => `<option>${esc(x)}</option>`).join('')}</select></label></div>
        <button class="btn ana" id="dAc">⚔ Düello başlat</button><p class="kucuk">Sen başlarsın: Pentago'da siyah, Küre'de mor, Satrançta beyazsın.</p></div>
      ${gr('Seni bekleyenler', (D) => (D.durum === 'davet' && D.o2 === ben) || (D.durum === 'bekliyor' && D.o1 !== ben))}
      ${gr('Devam eden oyunların', (D) => D.durum === 'oynanıyor' || ((D.durum === 'bekliyor' || D.durum === 'davet') && D.o1 === ben))}${gr('Bitenler (son 3 gün)', (D) => D.durum === 'bitti')}`;
    $('#yenile').onclick = lobi;
    $('#dAc').onclick = async () => { const c2 = await sunucu({ islem: 'duelloAc', oyun: $('#dOyun').value, rakip: $('#dRakip').value }); if (c2.ok) location.hash = 'yaris/oyna/' + c2.id; };
    document.querySelectorAll('[data-katil]').forEach((b) => b.onclick = async () => { const c2 = await sunucu({ islem: 'duelloKatil', id: b.dataset.katil }); if (c2.ok) location.hash = 'yaris/oyna/' + b.dataset.katil; else alert(c2.hata); });
  }

  // ---------- bulmaca düellosu ----------
  const bulmacaModulleri = () => KATALOG.filter((m) => m.tur === 'bulmaca' && acik.has(m.k));
  async function meydanLobi() {
    $('#sahne').innerHTML = `<div class="ust-cubuk"><a class="btn" href="#yaris">‹ Yarış</a><span>Bulmaca düellosu</span></div><p class="kucuk">Yükleniyor…</p>`;
    const [c, a] = await Promise.all([sunucu({ islem: 'meydanlar' }), sunucu({ islem: 'arkadaslar' })]); if (!c.ok) return; const ben = ogr.ad;
    const kart = (x) => { const m = KATALOG.find((k) => k.k === x.modul), benimki = x.o1 === ben, cozdum = benimki ? x.d1 !== '' : x.o2 === ben && x.d2 !== '';
      const kaz = x.durum === 'bitti' ? (+x.d1 > +x.d2 || (+x.d1 === +x.d2 && +x.t1 < +x.t2) ? x.o1 : +x.d2 > +x.d1 || +x.t2 < +x.t1 ? x.o2 : 'Berabere') : '';
      return `<div class="dkart"><b>${esc(m ? `${m.oyun} · ${m.ad}` : x.modul)}</b><span>${benimki ? 'Sen' : esc(x.o1)} ${x.d1 !== '' ? `(${x.d1}/10, ${x.t1} sn)` : ''} – ${x.o2 ? (x.o2 === ben ? 'Sen' : esc(x.o2)) : '<i>herkese açık</i>'} ${x.d2 !== '' ? `(${x.d2}/10, ${x.t2} sn)` : ''}</span>
        <small>${kaz ? `🏆 ${kaz === 'Berabere' ? 'Berabere' : esc(kaz === ben ? 'Sen' : kaz) + ' kazandı'}` : cozdum ? '⏳ Rakibin çözmesi bekleniyor' : '📨 Sıra sende'}</small>
        ${!cozdum && !kaz && m ? `<button class="btn ana kucuk" data-coz="${x.id}">Çöz</button>` : ''}</div>`; };
    $('#sahne').innerHTML = `<div class="ust-cubuk"><a class="btn" href="#yaris">‹ Yarış</a><span>Bulmaca düellosu</span><button class="btn kucuk" id="yenile" style="margin-left:auto">↻ Yenile</button></div>
      <div class="kart-kutu"><h3>Meydan oku</h3><p class="kucuk">İkiniz de aynı 10 soruyu çözersiniz. Daha çok doğru yapan, eşitlikte daha hızlı olan kazanır.</p>
        <div class="satir"><label>Konu<select id="mMod">${bulmacaModulleri().map((m) => `<option value="${m.k}">${esc(m.oyun)} · ${esc(m.ad)}</option>`).join('')}</select></label>
        <label>Rakip<select id="mRakip"><option value="">Herkese açık</option>${(a.liste || []).map((x) => `<option>${esc(x)}</option>`).join('')}</select></label></div>
        <button class="btn ana" id="mAc">🧩 Meydan oku ve çöz</button></div>
      <div class="dliste">${c.liste.slice().reverse().map(kart).join('') || '<p class="kucuk">Henüz bulmaca düellon yok.</p>'}</div>`;
    $('#yenile').onclick = meydanLobi;
    $('#mAc').onclick = async () => { const m = KATALOG.find((k) => k.k === $('#mMod').value); if (!m) return;
      const H = m.konular.flatMap((i) => V[m.veri][i].s.map((_, j) => [i, j])).sort(() => Math.random() - .5).slice(0, 10);
      const c2 = await sunucu({ islem: 'meydanAc', modul: m.k, sorular: H, rakip: $('#mRakip').value }); if (c2.ok) coz({ id: c2.id, modul: m.k, sorular: H }); };
    document.querySelectorAll('[data-coz]').forEach((b) => b.onclick = () => coz(c.liste.find((x) => x.id === b.dataset.coz)));
  }
  function coz(x) { window.__akdCoz = x; if (location.hash !== '#yaris/coz') location.hash = 'yaris/coz'; else cozBasla(); }
  function cozBasla() {
    const x = window.__akdCoz; if (!x) return meydanLobi(); window.__akdCoz = null;
    const m = KATALOG.find((k) => k.k === x.modul), bas = Date.now();
    const set = x.sorular.map(([i, j]) => ({ q: V[m.veri][i].s[j], id: `${m.veri}-${i}`, j, konu: V[m.veri][i] }));
    bulmaca(m, { set, baslik: 'Bulmaca düellosu', bitince: async (dogru) => { const sure = Math.round((Date.now() - bas) / 1000); await sunucu({ islem: 'meydanSonuc', id: x.id, dogru, sure });
      $('#sahne').innerHTML = `<div class="son"><div class="yildiz">🧩</div><h1>${dogru} / 10</h1><p>${sure} saniyede çözdün. Rakibin çözünce sonucu düello listesinde göreceksin.</p><div class="dugmeler"><a class="btn ana" href="#yaris/bulmaca">Bulmaca düellolarım</a></div></div>`; } });
  }

  // ---------- turnuvalar ----------
  async function turnuvalar() {
    $('#sahne').innerHTML = `<div class="ust-cubuk"><a class="btn" href="#yaris">‹ Yarış</a><span>Turnuvalar</span></div><p class="kucuk">Yükleniyor…</p>`;
    const c = await sunucu({ islem: 'turnuvalar' }); if (!c.ok) return; const ben = ogr.ad;
    $('#sahne').innerHTML = `<div class="ust-cubuk"><a class="btn" href="#yaris">‹ Yarış</a><span>Turnuvalar</span><button class="btn kucuk" id="yenile" style="margin-left:auto">↻ Yenile</button></div>
      ${c.liste.length ? c.liste.map((t) => { const benim = t.maclar.filter((d) => (d.o1 === ben || d.o2 === ben) && +d.tur === +t.tur);
        return `<div class="kart-kutu"><h3>🏆 ${esc(t.ad)} <small class="kucuk">${esc(t.oyun)} · ${t.tur || 0}${t.toplam ? '/' + t.toplam : ''}. tur · ${esc(t.durum)}</small></h3>
        ${benim.map((d) => `<div class="dkart vurgu"><b>Bu turdaki maçın</b><span>${esc(d.o1)} – ${esc(d.o2)}</span><small>${d.o2 === 'BAY' ? 'Bu tur BAY geçtin (+1 puan)' : d.durum === 'bitti' ? '🏁 ' + esc(d.sonuc) : '▶ Oynanmayı bekliyor'}</small>${d.o2 !== 'BAY' ? `<a class="btn ana kucuk" href="#yaris/oyna/${d.id}">${d.durum === 'bitti' ? 'Gör' : 'Maçını oyna'}</a>` : ''}</div>`).join('')}
        <table class="ptablo"><tr><th>#</th><th>Oyuncu</th><th>Puan</th><th title="Rakiplerinin puan toplamı (eşitlik bozma)">Buchholz</th><th>G</th></tr>${t.tablo.map((x, i) => `<tr class="${x.ad === ben ? 'ben' : ''}"><td>${i + 1}</td><td>${esc(x.ad)}</td><td><b>${x.puan}</b></td><td>${x.buchholz}</td><td>${x.galibiyet}</td></tr>`).join('')}</table>
        <details><summary>Tüm maçlar</summary><ul>${t.maclar.map((d) => `<li>${d.tur}. tur: ${esc(d.o1)} – ${esc(d.o2)} · ${d.durum === 'bitti' ? esc(d.sonuc) : 'oynanıyor'}</li>`).join('')}</ul></details></div>`; }).join('') : '<p class="kucuk">Şu an turnuva yok. Öğretmenin turnuva açınca burada görünecek.</p>'}`;
    $('#yenile').onclick = turnuvalar;
  }
  async function siralama() {
    $('#sahne').innerHTML = `<div class="ust-cubuk"><a class="btn" href="#yaris">‹ Yarış</a><span>Haftalık sıralama</span></div><p class="kucuk">Yükleniyor…</p>`;
    const c = await sunucu({ islem: 'siralama' }); if (!c.ok) return;
    $('#sahne').innerHTML = `<div class="ust-cubuk"><a class="btn" href="#yaris">‹ Yarış</a><span>Haftalık sıralama</span></div><p class="kucuk">Son 7 günde doğru çözülen bulmaca sayısı.</p>
      <table class="ptablo">${c.liste.map((x, i) => `<tr class="${x.ad === ogr.ad ? 'ben' : ''}"><td>${['🥇', '🥈', '🥉'][i] || i + 1}</td><td>${esc(x.ad)}</td><td><b>${x.puan}</b> doğru</td></tr>`).join('') || '<tr><td>Bu hafta henüz çözülen yok.</td></tr>'}</table>`;
  }
  function yarisAna() {
    const K = [['duello', 'yaris/duello', '⚔', 'Canlı düello', 'Arkadaşınla kendi cihazından Pentago, Küre ya da Satranç oyna'], ['bulmaca-duello', 'yaris/bulmaca', '🧩', 'Bulmaca düellosu', 'Aynı 10 soru: kim daha çok, kim daha hızlı?'],
      ['turnuva', 'yaris/turnuva', '🏆', 'Turnuvalar', 'Öğretmeninin açtığı turnuvalar, eşleşmeler ve puan tablosu'], ['siralama', 'yaris/siralama', '📊', 'Haftalık sıralama', 'Bu hafta en çok bulmaca çözenler']];
    $('#sahne').innerHTML = `<div class="ust-cubuk"><a class="btn" href="#">‹ Menü</a><span>Yarış</span></div><div class="kartlar">${K.map(([k, h, ik, a, n]) => acik.has(k) ? `<a class="mkart" href="#${h}"><span class="ik">${ik}</span><b>${a}</b><small>${n}</small></a>` : `<a class="mkart kilit"><span class="ik">🔒</span><b>${a}</b><small>Öğretmenin açınca gelecek</small></a>`).join('')}</div>`;
  }
  return { yon(a, b) { if (a === 'duello') return lobi(); if (a === 'oyna') return duelloEkrani(b); if (a === 'bulmaca') return meydanLobi(); if (a === 'coz') return cozBasla(); if (a === 'turnuva') return turnuvalar(); if (a === 'siralama') return siralama(); yarisAna(); }, oynat, UY };
};
