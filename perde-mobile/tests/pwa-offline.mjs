import {webkit,devices} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await webkit.launch({headless:true});
try {
 const context=await browser.newContext({...devices['iPhone 13']});
 const page=await context.newPage();
 page.on('dialog',d=>d.accept());
 await page.goto('http://127.0.0.1:8092');
 await page.getByLabel('Denumire magazin',{exact:true}).fill('TEST IPHONE');
 await page.getByLabel('Adresă magazin',{exact:true}).fill('Baia Mare');
 await page.getByRole('button',{name:'Salvează setările',exact:true}).click();
 await page.getByText('Comenzi',{exact:true}).click();
 await page.getByRole('button',{name:'Deschide exemplul cu 5 ferestre',exact:true}).click();
 await page.getByText('4. Rezumat',{exact:true}).click();
 await page.getByRole('button',{name:'Confirmă și salvează comanda',exact:true}).click();
 await page.getByText('CMD-00001',{exact:true}).waitFor();
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller) await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));});
 await context.setOffline(true);
 await page.reload();
 await page.getByText('Client Exemplu',{exact:true}).waitFor();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.getByRole('button',{name:'Șterge comanda CMD-00001',exact:true}).click();
 await page.getByText('Prima comandă începe aici',{exact:true}).waitFor();
 await page.reload();
 await page.getByText('Prima comandă începe aici',{exact:true}).waitFor();
 await page.screenshot({path:'artifacts/iphone-offline.png'});
 console.log('PASS: iPhone viewport in WebKit, service worker, offline startup, persisted orders and offline deletion.');
}finally{await browser.close();}
