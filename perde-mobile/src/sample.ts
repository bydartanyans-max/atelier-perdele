import { conditions, id, newOrder, Order, today } from './model';
export function sampleOrder(): Order {
  const o = newOrder();
  o.customer = 'Client Exemplu'; o.phone = '07XX XXX XXX'; o.address = 'Str. Model nr. 5'; o.delivery = today();
  o.windows = Array.from({length: 5}, (_, n) => ({id: id(), name: `Camera ${n+1}`, width: 300, height: 250, items: [
    {id: id(), kind: 'curtain', name: 'Perdea', code: 'T-01 / alb', price: 300, quantity: 1, factor: 2, sewing: n < 3 ? 80 : 120, style: n < 3 ? 'Rejansă standard' : 'Cu capse', width: 0, height: 0, billedArea: null},
    {id: id(), kind: 'curtain', name: 'Draperie', code: 'F-01 / bej', price: 450, quantity: 1, factor: n < 3 ? 1.5 : 2, sewing: n < 3 ? 80 : 120, style: n < 3 ? 'Rejansă standard' : 'Cu capse', width: 0, height: 0, billedArea: null},
    {id: id(), kind: 'piece', name: n < 3 ? 'Șină 3 m' : 'Set galerie 3 m', code: n < 3 ? 'Alb' : 'Metal', price: n < 3 ? 350 : 900, quantity: 1, factor: 1, sewing: 0, style: '', width: 0, height: 0, billedArea: null},
  ]}));
  o.installation = true; o.installationPrice = 750;
  o.payments = [{id: id(), date: today(), amount: 5000}];
  return o;
}
export const sampleCompany = {name: 'MAGAZIN PERDELE', address: 'Str. Exemplu nr. 10', phone: '07XX XXX XXX', conditions};
