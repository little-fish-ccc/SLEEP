// 沉眠符咒 Service Worker —— 应用壳缓存（离线可用）
const VERSION = '20260930b';
const CACHE = 'shenmian-shell-' + VERSION;
const ASSETS = [
  './',
  './?v=' + VERSION,
  './index.html',
  './index.html?v=' + VERSION,
  './manifest.json?v=' + VERSION,
  './icon-192.png?v=' + VERSION,
  './icon-512.png?v=' + VERSION
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(ASSETS).catch(function () {}); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  // 仅缓存同源资源；外部 CDN（如 twemoji）始终走网络
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    caches.match(req).then(function (cached) {
      if (cached) return cached;
      return fetch(req).then(function (resp) {
        if (resp && resp.status === 200 && resp.type === 'basic') {
          var copy = resp.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return resp;
      }).catch(function () { return caches.match('./index.html'); });
    })
  );
});
