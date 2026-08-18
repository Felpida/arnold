const CACHE = 'arnold-v4';
const ASSETS = [
  './', './index.html', './manifest.webmanifest', './icons/icon.svg',
  './js/data.js', './js/menu.js', './js/db.js',
  './js/train.js', './js/progress.js', './js/diet.js', './js/app.js'
];

self.addEventListener('install', e=>{
  e.waitUntil(
    caches.open(CACHE)
      .then(c=>c.addAll(ASSETS))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch', e=>{
  const req = e.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);

  // Open Food Facts y cualquier origen externo: red directa, sin cachear.
  // Sin cobertura devuelve un fallo controlado que diet.js sabe interpretar.
  if(url.origin !== location.origin){
    e.respondWith(
      fetch(req).catch(()=>new Response(
        JSON.stringify({status:0, offline:true}),
        {headers:{'Content-Type':'application/json'}}
      ))
    );
    return;
  }

  // App shell: red primero para que los cambios lleguen al recargar,
  // caché como respaldo cuando no hay conexión.
  e.respondWith(
    fetch(req)
      .then(res=>{
        const copy = res.clone();
        caches.open(CACHE).then(c=>c.put(req, copy));
        return res;
      })
      .catch(()=>caches.match(req).then(hit=>hit || caches.match('./index.html')))
  );
});