// service-worker.js simple (sin caché todavía)
self.addEventListener('install', event => {
  console.log('Service Worker instalado');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('Service Worker activado');
});

self.addEventListener('fetch', event => {
  // Por ahora solo dejamos que todo pase normal
});
