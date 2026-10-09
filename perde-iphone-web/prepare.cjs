const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = __dirname;
const dist = path.join(root, 'dist');
fs.mkdirSync(dist, {recursive: true});
let html = fs.readFileSync(path.join(root, '../Atelier-Perdele-Tarayici.html'), 'utf8');
html = html.replace('initial-scale=1, shrink-to-fit=no', 'initial-scale=1, shrink-to-fit=no, viewport-fit=cover');
html = html.replace('</head>', `<meta name="theme-color" content="#236e60">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Atelier Perdele">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="manifest" href="./manifest.webmanifest">
<link rel="apple-touch-icon" href="./icon-192.png">
<link rel="icon" href="./icon.svg" type="image/svg+xml">
</head>`);
const bodyEnd = html.lastIndexOf('</body>');
if(bodyEnd < 0) throw new Error('HTML body not found.');
html = html.slice(0, bodyEnd) + `<script>
if ('serviceWorker' in navigator) window.addEventListener('load', function () {
  navigator.serviceWorker.register('./sw.js').catch(function () {});
});
</script>` + html.slice(bodyEnd);
fs.writeFileSync(path.join(dist, 'index.html'), html, 'utf8');
fs.writeFileSync(path.join(dist, 'manifest.webmanifest'), JSON.stringify({id:'/', name:'Atelier Perdele', short_name:'Perdele', lang:'ro', start_url:'/', scope:'/', display:'standalone', background_color:'#f4f6f3', theme_color:'#236e60', icons:[{src:'icon-192.png', sizes:'192x192', type:'image/png'}, {src:'icon-512.png', sizes:'512x512', type:'image/png'}]}, null, 2));
const version = crypto.createHash('sha256').update(html).digest('hex').slice(0, 12);
fs.writeFileSync(path.join(dist, 'sw.js'), `const CACHE='atelier-shell-${version}';
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
});`);
fs.writeFileSync(path.join(dist, 'icon.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" rx="90" fill="#236e60"/><path d="M105 117h302v24H105z" fill="#fff"/><path d="M120 151h124v218c-55-14-98-53-124-94zM268 151h124v124c-26 41-69 80-124 94z" fill="#e5efe9"/><path d="M160 151v154m42-154v190m108-190v190m42-190v154" stroke="#236e60" stroke-width="12"/><path d="M120 376h272" stroke="#fff" stroke-width="12" stroke-linecap="round"/></svg>');
const manifestPath = path.join(root,'.openai','hosting.json');
const hosting=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
hosting.static={directory:'dist'};
fs.writeFileSync(manifestPath,JSON.stringify(hosting,null,2)+'\n');
console.log('Prepared iPhone web app '+version);
