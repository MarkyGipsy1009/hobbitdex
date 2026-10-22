// HobbitDex — service worker : app et images disponibles hors connexion
const SHELL = "hobbitdex-shell-v3";
const IMAGES = "hobbitdex-images-v1";
const DATA = "hobbitdex-data-v1";
const SHELL_FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(SHELL_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  const keep = [SHELL, IMAGES, DATA];
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => !keep.includes(k)).map((k) => caches.delete(k))))
      .then(() => trimImages())
      .then(() => self.clients.claim())
  );
});

const MAX_IMAGES = 4000;
let puts = 0;

// Garde les images les plus récentes : le cache ne doit pas grossir sans fin
async function trimImages() {
  const cache = await caches.open(IMAGES);
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - MAX_IMAGES)).map((k) => cache.delete(k)));
}

async function cacheFirst(req, name, cors) {
  const cache = await caches.open(name);
  const hit = await cache.match(req);
  if (hit) return hit;
  // Scryfall accepte CORS : une réponse lisible compte sa vraie taille, une réponse opaque compte ~7 Mo dans le quota de Chrome
  const res = await fetch(cors ? new Request(req.url, { mode: "cors", credentials: "omit" }) : req);
  if (res && (res.ok || res.type === "opaque")) {
    cache.put(req, res.clone()).catch(() => {});
    if (name === IMAGES && ++puts % 100 === 0) trimImages().catch(() => {});
  }
  return res;
}

async function networkFirst(req, name) {
  const cache = await caches.open(name);
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    const hit = await cache.match(req);
    if (hit) return hit;
    throw err;
  }
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (url.hostname === "cards.scryfall.io") { e.respondWith(cacheFirst(req, IMAGES, true)); return; }
  if (url.hostname === "cmsassets.rgpub.io") { e.respondWith(cacheFirst(req, IMAGES)); return; }
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com" || url.hostname === "cdn.jsdelivr.net") { e.respondWith(cacheFirst(req, SHELL)); return; }
  if (url.hostname === "api.scryfall.com" || url.hostname === "api.riftcodex.com" || url.hostname === "api.frankfurter.dev") { e.respondWith(networkFirst(req, DATA)); return; }
  if (url.origin === self.location.origin) {
    // La page elle-même : réseau d'abord pour recevoir les mises à jour, cache si hors ligne
    if (url.pathname.endsWith(".json")) { e.respondWith(networkFirst(req, DATA)); return; }
    if (req.mode === "navigate") { e.respondWith(networkFirst(req, SHELL).catch(() => caches.match("./index.html"))); return; }
    e.respondWith(cacheFirst(req, SHELL));
  }
});
