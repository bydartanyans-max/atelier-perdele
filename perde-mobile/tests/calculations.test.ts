import test from 'node:test';
import assert from 'node:assert/strict';
import { id, itemTotals, numberInput, saveOrder, deleteOrder, emptyStore, totals, validDate, validateItem, validateOrder, windowTotal, Item, WindowOrder } from '../src/model';
import { sampleCompany, sampleOrder } from '../src/sample';
import { orderHtml } from '../src/pdf';
import { parseBackup } from '../src/backup';

test('deleting an order removes its payments and revisions without reusing numbers or changing other orders', () => {
  let store = {...emptyStore(), company: sampleCompany};
  store = saveOrder(store, sampleOrder());
  const original = store.orders[0];
  store = saveOrder(store, {...original, customer: 'Updated customer'});
  store = saveOrder(store, sampleOrder());
  const other = store.orders[0];
  const deleted = deleteOrder(store, original.id);
  assert.deepEqual(deleted.orders, [other]);
  assert.equal(deleted.history.length, 0);
  assert.equal(deleted.nextNumber, store.nextNumber);
  assert.equal(store.orders.length, 2);
  assert.equal(store.history.length, 1);
  assert.deepEqual(parseBackup(JSON.stringify(deleted)), deleted);
  assert.equal(saveOrder(deleted, sampleOrder()).orders[0].number, 'CMD-00003');
});

test('approved five-window example reproduces all totals and balances', () => {
  const o = sampleOrder();
  assert.deepEqual(o.windows.map(windowTotal), [5015, 5015, 5015, 6840, 6840]);
  assert.deepEqual(totals(o), {subtotal: 28725, installation: 750, total: 29475, paid: 5000, remaining: 24475});
  assert.equal(itemTotals(o.windows[0].items[1], o.windows[0]).quantity, 4.5);
});
test('window height is printed beside width and does not change curtain calculations', () => {
  const o = sampleOrder();
  const before = totals(o);
  o.windows[0].height = 275;
  assert.deepEqual(totals(o), before);
  assert.equal(itemTotals(o.windows[0].items[0], o.windows[0]).quantity, 6);
  const html = orderHtml(o, sampleCompany);
  assert.ok(html.includes('Lățime: 3 m · Înălțime: 2,75 m'));
});
test('square metres use cm measurements, piece count and optional billed area', () => {
  const w: WindowOrder = {id: id(), name: 'Test', width: 300, height: 200, items: []};
  const i: Item = {id: id(), kind: 'area', name: 'Plisse', code: '', price: 200, quantity: 2, width: 60, height: 100, factor: 1, sewing: 0, style: '', billedArea: null};
  validateItem(i, w);
  assert.equal(itemTotals(i, w).total, 240);
  assert.equal(itemTotals({...i, billedArea: 1}, w).total, 400);
  assert.throws(() => validateItem({...i, quantity: 1.5}, w));
});
test('accessories are billed per piece; installation and discount update balance', () => {
  const o = sampleOrder();
  const accessory = {...o.windows[0].items[2], price: 150, quantity: 4};
  assert.equal(itemTotals(accessory, o.windows[0]).total, 600);
  o.installation = false; o.discount = 100;
  assert.equal(totals(o).total, 28625);
  assert.equal(totals(o).remaining, 23625);
  o.payments.push({id: id(), date: o.date, amount: 23625});
  assert.equal(totals(o).remaining, 0);
  o.payments.push({id: id(), date: o.date, amount: .01});
  assert.throws(() => validateOrder(o, sampleCompany));
});
test('input rejects invalid numbers and calendar dates', () => {
  assert.equal(numberInput('1,5'), 1.5);
  for (const s of ['-2', 'NaN', '1.2.3', 'Infinity', '']) assert.throws(() => numberInput(s));
  assert.equal(validDate('29.02.2024'), true);
  assert.equal(validDate('29.02.2026'), false);
  assert.equal(validDate('31.04.2026'), false);
});
test('saving revisions retains previous signed-form content and unique numbering', () => {
  let store = {...emptyStore(), company: sampleCompany};
  store = saveOrder(store, sampleOrder());
  const old = store.orders[0];
  store = saveOrder(store, {...old, customer: 'Client Nou'});
  assert.equal(store.orders[0].number, 'CMD-00001');
  assert.equal(store.orders[0].revision, 2);
  assert.equal(store.history[0].customer, 'Client Exemplu');
  assert.equal(store.history[0].revision, 1);
  store = saveOrder(store, sampleOrder());
  assert.equal(store.orders[0].number, 'CMD-00002');
});
test('PDF escapes client input, hides factors and retains signatures and lei', () => {
  const o = sampleOrder(); o.customer = '<script>alert(1)</script>';
  const html = orderHtml(o, sampleCompany);
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('×2'));
  assert.ok(!html.includes('FACTOR'));
  assert.ok(html.includes('Semnătura clientului'));
  assert.ok(html.includes(' lei'));
  assert.ok(html.indexOf('Total fereastra 1') > html.indexOf('Șină 3 m'));
});
test('backup round-trip retains revisions and rejects corrupt, duplicate or misnumbered data', () => {
  const store = saveOrder({...emptyStore(), company: sampleCompany}, sampleOrder());
  assert.deepEqual(parseBackup(JSON.stringify(store)), store);
  assert.throws(() => parseBackup(JSON.stringify({...store, schema: 2})));
  assert.throws(() => parseBackup(JSON.stringify({...store, nextNumber: 1})));
  assert.throws(() => parseBackup(JSON.stringify({...store, orders: [store.orders[0], store.orders[0]]})));
  const malformed = structuredClone(store);
  malformed.orders[0].windows[0].items[0].price = -10;
  assert.throws(() => parseBackup(JSON.stringify(malformed)));
});
