import {_electron as electron} from '@playwright/test';
import {mkdir, readFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root = path.resolve('../perde-windows');
const testDir = path.resolve('artifacts/windows-' + Date.now());
await mkdir(testDir, {recursive: true});
const app = await electron.launch({executablePath: path.join(root, 'node_modules/electron/dist/electron.exe'), args: [root], env: {...process.env, ATELIER_TEST_DATA: testDir}});
try {
  const page = await app.firstWindow();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('dialog', d => d.accept());
  await page.getByLabel('Denumire magazin', {exact: true}).fill('MAGAZIN WINDOWS TEST');
  await page.getByLabel('Adresă magazin', {exact: true}).fill('Str. Exemplu 10');
  await page.getByRole('button', {name: 'Salvează setările', exact: true}).click();
  await page.getByText('Comenzi', {exact: true}).click();
  await page.getByRole('button', {name: 'Deschide exemplul cu 5 ferestre', exact: true}).click();
  await page.getByText('4. Rezumat', {exact: true}).click();
  await page.getByRole('button', {name: 'Confirmă și salvează comanda', exact: true}).click();
  await page.getByText('CMD-00001', {exact: true}).waitFor();
  const store = JSON.parse(await readFile(path.join(testDir, 'orders.json'), 'utf8'));
  assert.equal(store.orders.length, 1);
  await page.getByRole('button', {name: 'Previzualizează formularul', exact: true}).click();
  const html = await page.frameLocator('iframe').locator('html').evaluate(el => el.outerHTML);
  assert.ok(html.includes('Înălțime: 2,5 m'));
  await page.getByRole('button', {name: 'Închide', exact: true}).click();
  const pdfPath = path.join(testDir, 'windows-order.pdf');
  await app.evaluate(({dialog}, filePath) => {dialog.showSaveDialog = async () => ({canceled: false, filePath});}, pdfPath);
  await page.evaluate(async ({html}) => window.atelierDesktop.document(html, 'CMD-00001', false), {html});
  assert.equal((await readFile(pdfPath)).subarray(0, 5).toString(), '%PDF-');
  await page.reload();
  await page.getByText('Client Exemplu', {exact: true}).waitFor();
  const backupPath = path.join(testDir, 'backup.json');
  await app.evaluate(({session}, filePath) => {session.defaultSession.on('will-download', (_event, item) => item.setSavePath(filePath));}, backupPath);
  await page.getByText('Magazin și backup', {exact: true}).click();
  await page.getByRole('button', {name: 'Exportă backup', exact: true}).click();
  let backup;
  for (let n = 0; n < 30; n++) {
    try {backup = JSON.parse(await readFile(backupPath, 'utf8')); break;} catch {await new Promise(resolve => setTimeout(resolve, 100));}
  }
  assert.equal(backup?.orders.length, 1);
  const chooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', {name: 'Restaurează din backup', exact: true}).click();
  await (await chooserPromise).setFiles(backupPath);
  await page.getByText('Comenzi', {exact: true}).click();
  await page.getByText('Client Exemplu', {exact: true}).waitFor();
  await page.screenshot({path: path.join(testDir, 'windows.png')});
  page.removeAllListeners('dialog');
  page.once('dialog', dialog => dialog.dismiss());
  await page.getByRole('button', {name: 'Șterge comanda CMD-00001', exact: true}).click();
  assert.equal(JSON.parse(await readFile(path.join(testDir, 'orders.json'), 'utf8')).orders.length, 1);
  page.once('dialog', dialog => {
    assert.ok(dialog.message().includes('CMD-00001'));
    assert.ok(dialog.message().includes('reviziile'));
    return dialog.accept();
  });
  await page.getByRole('button', {name: 'Șterge comanda CMD-00001', exact: true}).click();
  await page.getByText('Prima comandă începe aici', {exact: true}).waitFor();
  const deletedStore = JSON.parse(await readFile(path.join(testDir, 'orders.json'), 'utf8'));
  assert.equal(deletedStore.orders.length, 0);
  assert.equal(deletedStore.nextNumber, 2);
  await page.reload();
  await page.getByText('Prima comandă începe aici', {exact: true}).waitFor();
  assert.equal(await page.evaluate(() => typeof window.require), 'undefined');
  assert.deepEqual(errors, []);
  console.log('PASS: Windows setup, PDF, backup, delete cancellation/confirmation, persistent deletion, isolated renderer.');
} finally {await app.close();}
