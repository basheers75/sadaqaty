// Sadaqa Jaryeh — Service Worker
// Strategy:
//   • App shell (HTML/JS/CSS/fonts): network-first, fallback cached
//   • Static assets (img/svg/manifest): cache-first
//   • Audio (everyayah.com, mp3quran.net): cache-first, runtime-grow
//   • Tafsir/Geocoding APIs: network only (small payloads, stay fresh)

const VERSION = "v1.0.0";
const SHELL_CACHE = `sadaqa-shell-${VERSION}`;
const AUDIO_CACHE = `sadaqa-audio-${VERSION}`;
const STATIC_CACHE = `sadaqa-static-${VERSION}`;

const SHELL_FILES = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
];

// On install: pre-cache shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_FILES).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

// On activate: drop old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (![SHELL_CACHE, AUDIO_CACHE, STATIC_CACHE].includes(key)) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// Audio host detector
function isAudioRequest(url) {
  return (
    url.hostname === "everyayah.com" ||
    url.hostname.endsWith(".mp3quran.net") ||
    url.pathname.endsWith(".mp3")
  );
}

function isStaticRequest(url) {
  return (
    url.pathname.endsWith(".otf") ||
    url.pathname.endsWith(".woff") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".webp") ||
    url.pathname.endsWith(".ico")
  );
}

function isAPIRequest(url) {
  return (
    url.hostname === "api.alquran.cloud" ||
    url.hostname === "quranenc.com" ||
    url.hostname === "nominatim.openstreetmap.org"
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // 1) Audio — cache-first, network-fallback, store on success
  if (isAudioRequest(url)) {
    event.respondWith(
      caches.open(AUDIO_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const resp = await fetch(req);
          // Only cache successful, full responses (range requests skip)
          if (resp.ok && resp.status === 200) {
            cache.put(req, resp.clone()).catch(() => {});
          }
          return resp;
        } catch (err) {
          return new Response("Audio unavailable offline", { status: 503 });
        }
      })
    );
    return;
  }

  // 2) Static font/image — cache-first
  if (isStaticRequest(url) || url.hostname === "fonts.gstatic.com") {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const resp = await fetch(req);
          if (resp.ok) cache.put(req, resp.clone()).catch(() => {});
          return resp;
        } catch {
          return cached || new Response("Asset unavailable", { status: 503 });
        }
      })
    );
    return;
  }

  // 3) APIs — network only (don't cache, stay fresh)
  if (isAPIRequest(url)) {
    return; // default browser handling
  }

  // 4) App shell — network-first, fall back to cache
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(req)
        .then((resp) => {
          if (resp.ok) {
            const copy = resp.clone();
            caches.open(SHELL_CACHE).then((c) => c.put(req, copy).catch(() => {}));
          }
          return resp;
        })
        .catch(() => caches.match(req).then((c) => c || caches.match("/index.html")))
    );
  }
});
