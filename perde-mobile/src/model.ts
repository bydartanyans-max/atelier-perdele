export type Kind = 'curtain' | 'area' | 'piece';
export type Status = 'draft' | 'confirmed' | 'ready' | 'delivered';
export const statuses: Record<Status, string> = {draft: 'Ciornă', confirmed: 'În lucru', ready: 'Pregătită', delivered: 'Livrată'};
export interface Company { name: string; address: string; phone: string; logo?: string; conditions: string; }
export interface Item {
  id: string; kind: Kind; name: string; code: string; price: number;
  quantity: number; factor: number; sewing: number; style: string;
  width: number; height: number; billedArea: number | null;
}
export interface WindowOrder { id: string; name: string; width: number; height: number; items: Item[]; }
export interface Payment { id: string; amount: number; date: string; }
export interface Order {
  id: string; number: string; date: string; delivery: string;
  customer: string; phone: string; address: string; windows: WindowOrder[];
  installation: boolean; installationPrice: number; discount: number;
  payments: Payment[]; status: Status; revision: number; updatedAt: string;
  company?: Company;
}
export interface Store { schema: 1; company: Company; orders: Order[]; nextNumber: number; history: Order[]; }
export const conditions = [
  'Produsele textile sunt confecționate la comandă, conform măsurilor și opțiunilor confirmate de client.',
  'După începerea confecționării, anularea sau modificarea la cererea clientului nu este acceptată, cu excepția acordului scris al magazinului și a cazurilor prevăzute de lege.',
  'Pentru textilele personalizate comandate la distanță sau în afara magazinului, dreptul de retragere nu se aplică potrivit art. 16 lit. c) din OUG 34/2014. Drepturile legale privind neconformitatea rămân valabile.',
  'Montajul este inclus numai dacă este solicitat și înscris în comandă. Orice schimbare se confirmă în scris.',
  'Prin semnare, clientul confirmă produsele, măsurile, prețurile, avansul, data livrării și condițiile de mai sus.',
].join('\n');
export const emptyStore = (): Store => ({schema: 1, company: {name: '', address: '', phone: '', conditions}, orders: [], nextNumber: 1, history: []});
export const id = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
export function today() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth()+1).padStart(2, '0')}.${d.getFullYear()}`;
}
export const newOrder = (): Order => ({id: id(), number: '', date: today(), delivery: '', customer: '', phone: '', address: '', windows: [], installation: false, installationPrice: 0, discount: 0, payments: [], status: 'draft', revision: 0, updatedAt: new Date().toISOString()});
export const round = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
export const money = (n: number) => new Intl.NumberFormat('ro-RO', {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(n) + ' lei';
export const decimal = (n: number) => new Intl.NumberFormat('ro-RO', {maximumFractionDigits: 2}).format(n);
export function numberInput(s: string) {
  if (!/^\s*\d+(?:[.,]\d+)?\s*$/.test(s)) throw new Error('Introduceți un număr pozitiv, fără separatori de mii.');
  const n = Number(s.trim().replace(',', '.'));
  if (!Number.isFinite(n) || n > 100000000) throw new Error('Valoare prea mare.');
  return n;
}
export function validDate(s: string) {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(s);
  if (!m) return false;
  const date = new Date(+m[3], +m[2]-1, +m[1]);
  return date.getFullYear() === +m[3] && date.getMonth() === +m[2]-1 && date.getDate() === +m[1];
}
export function itemTotals(item: Item, window: WindowOrder) {
  const area = round(item.width * item.height / 10000);
  const quantity = item.kind === 'curtain' ? round(window.width / 100 * item.factor)
    : item.kind === 'area' ? round((item.billedArea ?? area) * item.quantity) : item.quantity;
  const material = round(quantity * item.price);
  const sewing = item.kind === 'curtain' ? round(quantity * item.sewing) : 0;
  return {quantity, material, sewing, total: round(material+sewing), unit: item.kind === 'curtain' ? 'm' : item.kind === 'area' ? 'm²' : 'buc.'};
}
export const windowTotal = (w: WindowOrder) => round(w.items.reduce((n, item) => n + itemTotals(item, w).total, 0));
export function totals(o: Order) {
  const subtotal = round(o.windows.reduce((n, w) => n + windowTotal(w), 0));
  const installation = o.installation ? round(o.installationPrice) : 0;
  const total = round(subtotal + installation - o.discount);
  const paid = round(o.payments.reduce((n, p) => n + p.amount, 0));
  return {subtotal, installation, total, paid, remaining: round(total - paid)};
}
function nonnegative(n: number) { return Number.isFinite(n) && n >= 0 && n <= 100000000; }
export function validateItem(i: Item, w: WindowOrder) {
  if (!i.name.trim()) throw new Error('Introduceți denumirea produsului.');
  if (![i.price, i.sewing, i.width, i.height].every(nonnegative)) throw new Error('Prețul și dimensiunile trebuie să fie valide.');
  if (i.kind === 'curtain' && (!(w.width > 0) || !nonnegative(i.factor) || i.factor === 0)) throw new Error('Introduceți lățimea ferestrei și factorul de încrețire.');
  if (i.kind !== 'curtain' && (!Number.isInteger(i.quantity) || i.quantity < 1)) throw new Error('Numărul de bucăți trebuie să fie întreg și pozitiv.');
  if (i.kind === 'area' && (!(i.width > 0) || !(i.height > 0) || (i.billedArea !== null && (!nonnegative(i.billedArea) || i.billedArea === 0)))) throw new Error('Introduceți dimensiuni și suprafață valide pentru produsul în m².');
}
export function validateOrder(o: Order, company: Company, final = false) {
  if (!validDate(o.date) || (o.delivery && !validDate(o.delivery))) throw new Error('Data trebuie să fie validă, în format ZZ.LL.AAAA.');
  if (![o.installationPrice, o.discount].every(nonnegative)) throw new Error('Costul de montaj sau reducerea nu este validă.');
  for (const w of o.windows) {
    if (![w.width, w.height].every(nonnegative)) throw new Error('Dimensiunile ferestrei nu sunt valide.');
    for (const i of w.items) validateItem(i, w);
  }
  for (const p of o.payments) if (!nonnegative(p.amount) || p.amount === 0 || !validDate(p.date)) throw new Error('Plata sau data plății nu este validă.');
  const t = totals(o);
  if (t.total < 0 || t.remaining < 0) throw new Error('Reducerea sau plățile depășesc valoarea comenzii.');
  if (final) {
    if (!company.name.trim() || !company.address.trim()) throw new Error('Completați numele și adresa magazinului în setări.');
    if (!o.customer.trim() || !o.phone.trim() || !o.delivery) throw new Error('Completați clientul, telefonul și data livrării.');
    if (!o.windows.length || o.windows.some(w => !w.items.length)) throw new Error('Adăugați produse la fiecare fereastră.');
  }
}
export function saveOrder(store: Store, order: Order): Store {
  const old = store.orders.find(o => o.id === order.id);
  const saved = {...order, number: old?.number ?? `CMD-${String(store.nextNumber).padStart(5, '0')}`, revision: (old?.revision ?? 0)+1, updatedAt: new Date().toISOString(), company: {...store.company}};
  return {...store, nextNumber: store.nextNumber + (old ? 0 : 1), orders: [saved, ...store.orders.filter(o => o.id !== order.id)], history: old ? [...store.history, old] : store.history};
}
export function deleteOrder(store: Store, orderId: string): Store {
  return {...store, orders: store.orders.filter(o => o.id !== orderId), history: store.history.filter(o => o.id !== orderId)};
}
