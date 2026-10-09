const CACHE='atelier-shell-8d572fc4ef92';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png'];
self.addEventListener('install', event => event.waitUntil((async () => {
 const cache=await caches.open(CACHE);
 for(const asset of ASSETS) {
  const response=await fetch(asset, {cache:'reload',credentials:'same-origin'});
  if(!response.ok || response.redirected) throw new Error('App shell unavailable');
  if(asset==='./' || asset==='./index.html') {
   if(!(await response.clone().text()).includes('id="root"')) throw new Error('Authentication page is not an app shell');
  }
  await cache.put(asset,response);
 }
})()));
self.addEventListener('activate', event => event.waitUntil((async () => {
 for(const key of await caches.keys()) if(key.startsWith('atelier-shell-') && key!==CACHE) await caches.delete(key);
 await self.clients.claim();
})()));
self.addEventListener('fetch', event => {
 const url=new URL(event.request.url);
 if(event.request.method!=='GET' || url.origin!==self.location.origin) return;
 const asset=ASSETS.find(a => new URL(a,self.registration.scope).pathname===url.pathname);
 if(!asset) return;
 event.respondWith((async () => {
  try { return await fetch(event.request); }
  catch(error) { const cached=await (await caches.open(CACHE)).match(asset); if(cached) return cached; throw error; }
 })());
});