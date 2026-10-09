const http=require('node:http'), fs=require('node:fs/promises'), path=require('node:path');
const root=path.join(__dirname,'dist');
http.createServer(async (req,res) => {
 try {
  const url=new URL(req.url,'http://localhost');
  const target=path.resolve(root,'.'+(url.pathname==='/'?'/index.html':url.pathname));
  if(!target.startsWith(root+path.sep)) {res.writeHead(403).end();return;}
  const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png'};
  res.setHeader('Content-Type',types[path.extname(target)] || 'application/octet-stream');
  res.end(await fs.readFile(target));
 } catch {res.writeHead(404).end();}
}).listen(8092,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:8092'));
