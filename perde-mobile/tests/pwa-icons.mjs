import {chromium} from '@playwright/test';
import {readFile} from 'node:fs/promises';
const svg = await readFile('../perde-iphone-web/dist/icon.svg','utf8');
const browser = await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try {
 for(const size of [192,512]) {
  const page=await browser.newPage({viewport:{width:size,height:size}});
  await page.setContent('<style>body{margin:0}svg{width:100vw;height:100vh;display:block}</style>'+svg);
  await page.screenshot({path:`../perde-iphone-web/dist/icon-${size}.png`});
  await page.close();
 }
} finally {await browser.close();}
