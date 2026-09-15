// 慢性腎臓病管理アプリ用の簡易サービスワーカー
// ・自分のファイル(HTML/CSS/JS/アイコン等)はキャッシュして、電波が無くても開けるようにする
// ・Googleスプレッドシート(Apps Script)への同期通信はキャッシュ対象外（常にネットワークへ）
const CACHE_NAME = "ckd-app-cache-v1";
const APP_SHELL = [
  "./",
  "./慢性腎臓病管理アプリ.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return; // 同期(POST)はそのまま素通り

  let url;
  try { url = new URL(req.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return; // 外部(Apps Script等)への通信はキャッシュしない

  event.respondWith(
    fetch(req)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req))
  );
});
