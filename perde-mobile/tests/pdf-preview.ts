import {chromium} from '@playwright/test';
import {orderHtml} from '../src/pdf';
import {sampleOrder, sampleCompany} from '../src/sample';
import path from 'node:path';

async function main() {
  const browser = await chromium.launch({executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true});
  try {
    const page = await browser.newPage({viewport: {width: 794, height: 1123}});
    const order = sampleOrder();
    order.number = 'DEMO-001'; order.status = 'confirmed';
    await page.setContent(orderHtml(order, sampleCompany));
    const boxes = await page.locator('header > section').evaluateAll(elements => elements.map(el => {const b = el.getBoundingClientRect(); return {x: b.x, width: b.width};}));
    const header = await page.locator('header').boundingBox();
    if (!header || Math.abs(boxes[1].x + boxes[1].width/2 - (header.x+header.width/2)) > 1) throw new Error('Order header is not centered');
    const output = path.resolve('..', 'comanda_perdele_ro_antet_final.pdf');
    await page.pdf({path: output, format: 'A4', printBackground: true, displayHeaderFooter: true});
    await page.screenshot({path: path.resolve('artifacts', 'antet-final.png'), fullPage: true});
    console.log(output);
  } finally {await browser.close();}
}
void main();
