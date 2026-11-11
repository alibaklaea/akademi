// Çevrim dışı: uygulama kabuğu önbellekte; sunucu (Apps Script) istekleri önbelleğe alınmaz.
const SURUM = "akademi-v1";
const KABUK = ["./", "index.html", "app.css", "config.js", "js/motorlar.js", "js/tahtalar.js", "js/app.js", "veri/bankalar.js", "vendor/chess.min.js", "img/logo.png", "img/ikon-192.png", "manifest.webmanifest"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(SURUM).then((c) => c.addAll(KABUK))); self.skipWaiting(); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== SURUM).map((k) => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request, { cache: "no-cache" }).then((y) => { const k = y.clone(); caches.open(SURUM).then((c) => c.put(e.request, k)); return y; }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
