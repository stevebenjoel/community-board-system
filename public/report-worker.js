const CACHE = 'cbs-public-report-v1';
const SHELL = '/report';
const publicAsset = path => /^\/assets\/[a-zA-Z0-9_.-]+\.(js|css|png|svg)$/.test(path);

async function saveShell(response) {
  const html = await response.clone().text();
  const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map(match => match[1]).filter(publicAsset);
  if (!assets.some(path => path.endsWith('.js'))) throw new Error('A built application is required.');
  const cache = await caches.open(CACHE);
  await cache.addAll(assets);
  await cache.put(SHELL, response);
}
self.addEventListener('install', event => {
  event.waitUntil(fetch(SHELL).then(response => {
    if (!response.ok) throw new Error('Reporting page unavailable.');
    return saveShell(response);
  }).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || event.request.method !== 'GET') return;
  if (event.request.mode === 'navigate' && url.pathname === SHELL) {
    const network = fetch(event.request);
    event.waitUntil(network.then(response => {
      if (response.ok) return saveShell(response.clone());
    }).catch(() => {}));
    event.respondWith(network.then(async response => {
      if (response.ok) return response;
      return (await caches.match(SHELL)) ?? response;
    }).catch(async () => (await caches.match(SHELL)) ?? Response.error()));
  } else if (publicAsset(url.pathname)) {
    event.respondWith(caches.match(event.request).then(cached => cached ?? fetch(event.request)));
  }
});
