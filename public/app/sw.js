// Service worker do PWA -- só cuida do "app shell" estático (HTML/JS/CSS/ícones
// dentro de /app/). Nunca cacheia API/login: dado comercial/financeiro tem que
// vir sempre da rede, senão o usuário vê preço/estoque desatualizado sem saber.
// Estratégia: network-first com fallback pro cache (só funciona offline depois
// de ter aberto o app pelo menos uma vez online).

const CACHE_NAME = 'vidracaria-shell-v1';
const SHELL_FILES = [
  '/app/',
  '/app/index.html',
  '/app/app.js',
  '/app/styles.css',
  '/app/manifest.json',
  '/app/icon-192.png',
  '/app/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET' || !url.pathname.startsWith('/app/')) {
    return; // API, /auth/*, etc. -- sempre direto na rede, sem passar pelo SW.
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match('/app/index.html')))
  );
});
