import { Company, Store, validateOrder, statuses } from './model';

function companyValid(c: unknown): c is Company {
  if (!c || typeof c !== 'object') return false;
  const x = c as Company;
  return ['name', 'address', 'phone', 'conditions'].every(k => typeof x[k as keyof Company] === 'string') &&
    (x.logo === undefined || (typeof x.logo === 'string' && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(x.logo)));
}
export function parseBackup(raw: string): Store {
  if (raw.length > 30_000_000) throw new Error('Fișierul de backup este prea mare.');
  const s = JSON.parse(raw) as Store;
  if (s.schema !== 1 || !companyValid(s.company) || !Array.isArray(s.orders) || !Array.isArray(s.history) || !Number.isInteger(s.nextNumber) || s.nextNumber < 1) throw new Error('Fișier de backup incompatibil.');
  const orderIds = new Set<string>();
  for (const o of [...s.orders, ...s.history]) {
    if (!o || !['id', 'number', 'date', 'delivery', 'customer', 'phone', 'address', 'updatedAt'].every(k => typeof o[k as keyof typeof o] === 'string') ||
      !Array.isArray(o.windows) || !Array.isArray(o.payments) || !Object.hasOwn(statuses, o.status) || !Number.isInteger(o.revision) || o.revision < 1 ||
      typeof o.installation !== 'boolean' || !companyValid(o.company)) throw new Error('Comandă invalidă în backup.');
    for (const w of o.windows) {
      if (!w || typeof w.id !== 'string' || typeof w.name !== 'string' || !Array.isArray(w.items)) throw new Error('Fereastră invalidă în backup.');
      for (const i of w.items) if (!i || !['curtain', 'area', 'piece'].includes(i.kind) || !['id', 'name', 'code', 'style'].every(k => typeof i[k as keyof typeof i] === 'string') || ![i.quantity, i.factor, i.sewing, i.width, i.height, i.price].every(n => Number.isFinite(n) && n >= 0 && n <= 100000000)) throw new Error('Produs invalid în backup.');
    }
    for (const p of o.payments) if (!p || typeof p.id !== 'string' || typeof p.date !== 'string') throw new Error('Plată invalidă în backup.');
    validateOrder(o, o.company!, false);
  }
  for (const o of s.orders) {
    if (orderIds.has(o.id)) throw new Error('Comenzi duplicate în backup.');
    orderIds.add(o.id);
  }
  const maxNumber = Math.max(0, ...s.orders.map(o => Number(/^CMD-(\d+)$/.exec(o.number)?.[1] ?? 0)), ...s.history.map(o => Number(/^CMD-(\d+)$/.exec(o.number)?.[1] ?? 0)));
  if (s.nextNumber <= maxNumber) throw new Error('Numerotarea comenzilor nu este validă.');
  return s;
}
