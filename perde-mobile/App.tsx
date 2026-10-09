import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FS from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { WebView } from 'react-native-webview';
import { Company, decimal, deleteOrder, emptyStore, id, Item, itemTotals, Kind, money, newOrder, numberInput, Order, saveOrder, Status, statuses, Store, today, totals, validateItem, validateOrder, WindowOrder, windowTotal } from './src/model';
import { loadStore, parseBackup, persist } from './src/storage';
import { orderHtml } from './src/pdf';
import { sampleCompany, sampleOrder } from './src/sample';
import { desktop } from './src/desktop';

const C = {ink: '#213b3b', muted: '#687e7a', accent: '#236e60', bg: '#f4f6f3', border: '#dbe4df', pale: '#e5efe9'};
function notify(title: string, message = '') {
  if (Platform.OS === 'web') window.alert(`${title}${message ? '\n' + message : ''}`);
  else Alert.alert(title, message);
}
function error(e: unknown) { notify('Verificați informațiile', e instanceof Error ? e.message : 'Operațiunea nu a reușit. Încercați din nou.'); }
function ask(title: string, message: string): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${title}\n${message}`));
  return new Promise(resolve => Alert.alert(title, message, [{text: 'Renunță', style: 'cancel', onPress: () => resolve(false)}, {text: 'Continuă', onPress: () => resolve(true)}], {cancelable: true, onDismiss: () => resolve(false)}));
}
function Button({label, onPress, secondary = false, disabled = false}: {label: string; onPress: () => void; secondary?: boolean; disabled?: boolean}) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({pressed}) => [s.button, secondary && s.secondary, (pressed || disabled) && {opacity: .55}]}><Text style={[s.buttonText, secondary && {color: C.accent}]}>{label}</Text></Pressable>;
}
function Field({label, value, onChange, numeric = false, multiline = false, placeholder = ''}: {label: string; value: string; onChange: (s: string) => void; numeric?: boolean; multiline?: boolean; placeholder?: string}) {
  return <View style={s.field}><Text style={s.label}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={onChange} keyboardType={numeric ? 'decimal-pad' : 'default'} multiline={multiline} placeholder={placeholder} placeholderTextColor="#8b9b95" style={[s.input, multiline && {minHeight: 88, textAlignVertical: 'top'}]} /></View>;
}
function Amount({label, value, strong = false}: {label: string; value: number; strong?: boolean}) {
  return <View style={s.amount}><Text style={strong ? s.heading : s.body}>{label}</Text><Text style={strong ? s.heading : s.body}>{money(value)}</Text></View>;
}
function Card({children}: {children: React.ReactNode}) { return <View style={s.card}>{children}</View>; }
function Toggle({label, value, onChange}: {label: string; value: boolean; onChange: (v: boolean) => void}) { return <View style={s.amount}><Text style={s.body}>{label}</Text><Switch accessibilityLabel={label} value={value} onValueChange={onChange} trackColor={{true: C.accent}} /></View>; }

function ProductForm({windowOrder, item, onSave, onClose}: {windowOrder: WindowOrder; item?: Item; onSave: (i: Item) => void; onClose: () => void}) {
  const [kind, setKind] = useState<Kind>(item?.kind ?? 'curtain');
  const [name, setName] = useState(item?.name ?? '');
  const [code, setCode] = useState(item?.code ?? '');
  const [price, setPrice] = useState(String(item?.price ?? ''));
  const [quantity, setQuantity] = useState(String(item?.quantity ?? 1));
  const [factor, setFactor] = useState(String(item?.factor ?? 2));
  const [sewing, setSewing] = useState(String(item?.sewing ?? 0));
  const [style, setStyle] = useState(item?.style ?? 'Rejansă standard');
  const [width, setWidth] = useState(String(item?.width || windowOrder.width || ''));
  const [height, setHeight] = useState(String(item?.height || windowOrder.height || ''));
  const [billedArea, setBilledArea] = useState(item?.billedArea == null ? '' : String(item.billedArea));
  function build(): Item {
    return {id: item?.id ?? id(), kind, name: name.trim(), code: code.trim(), price: numberInput(price),
      quantity: kind === 'curtain' ? 1 : numberInput(quantity), factor: kind === 'curtain' ? numberInput(factor) : 1,
      sewing: kind === 'curtain' ? numberInput(sewing || '0') : 0, style: kind === 'curtain' ? style.trim() : '',
      width: kind === 'area' ? numberInput(width) : 0, height: kind === 'area' ? numberInput(height) : 0,
      billedArea: kind === 'area' && billedArea.trim() ? numberInput(billedArea) : null};
  }
  let preview: ReturnType<typeof itemTotals> | undefined;
  try { const i = build(); validateItem(i, windowOrder); preview = itemTotals(i, windowOrder); } catch {}
  return <Modal visible animationType="slide" onRequestClose={onClose}><SafeAreaView style={s.page}><KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
    <Text style={s.title}>{item ? 'Modifică produsul' : 'Adaugă produs'}</Text><Text style={s.hint}>{windowOrder.name || 'Fereastră'} · Prețuri în lei</Text>
    <View style={s.wrap}>{([['curtain', 'Perdea / draperie · m'], ['area', 'Plisse / jaluzea · m²'], ['piece', 'Accesorii / galerie · buc.']] as [Kind, string][]).map(([k, label]) => <Pressable key={k} onPress={() => setKind(k)} style={[s.chip, kind === k && s.selected]}><Text style={kind === k ? s.selectedText : s.body}>{label}</Text></Pressable>)}</View>
    <Field label="Denumire produs" value={name} onChange={setName} placeholder={kind === 'area' ? 'Plisse / jaluzea' : kind === 'piece' ? 'Șină / galerie / accesoriu' : 'Perdea / draperie'} />
    <Field label="Cod / culoare (opțional)" value={code} onChange={setCode} />
    <Field label={`Preț / ${kind === 'curtain' ? 'metru' : kind === 'area' ? 'm²' : 'bucată'} (lei)`} numeric value={price} onChange={setPrice} />
    {kind === 'curtain' ? <><Text style={s.hint}>Lățime fereastră: {decimal(windowOrder.width)} cm. Fără rezerve de coasere.</Text><Field label="Factor de încrețire (doar în aplicație)" numeric value={factor} onChange={setFactor} /><Field label="Tip de confecționare" value={style} onChange={setStyle} /><Field label="Croitorie / metru material (lei)" numeric value={sewing} onChange={setSewing} /></> : <Field label="Număr de bucăți" numeric value={quantity} onChange={setQuantity} />}
    {kind === 'area' && <><Field label="Lățime produs (cm)" numeric value={width} onChange={setWidth} /><Field label="Înălțime produs (cm)" numeric value={height} onChange={setHeight} /><Field label="Suprafață facturată / bucată (m², opțional)" numeric value={billedArea} onChange={setBilledArea} placeholder="Gol = suprafața calculată din dimensiuni" /><Text style={s.hint}>Puteți stabili manual suprafața minimă facturată.</Text></>}
    {preview && <Card><Text style={s.body}>Cantitate: {decimal(preview.quantity)} {preview.unit}</Text><Amount label="Produs" value={preview.material} />{kind === 'curtain' && <Amount label="Croitorie" value={preview.sewing} />}<Amount label="Total" value={preview.total} strong /></Card>}
    <Button label="Salvează produsul" onPress={() => {try {const i = build(); validateItem(i, windowOrder); onSave(i);} catch(e) {error(e);}}} />
    <Button label="Renunță" secondary onPress={onClose} />
  </ScrollView></KeyboardAvoidingView></SafeAreaView></Modal>;
}

function WindowForm({value, onSave, onClose}: {value?: WindowOrder; onSave: (w: WindowOrder) => void; onClose: () => void}) {
  const [name, setName] = useState(value?.name ?? '');
  const [width, setWidth] = useState(String(value?.width || ''));
  const [height, setHeight] = useState(String(value?.height || ''));
  return <Modal visible animationType="slide" onRequestClose={onClose}><SafeAreaView style={s.page}><ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled"><Text style={s.title}>{value ? 'Modifică fereastra' : 'Fereastră nouă'}</Text><Field label="Nume / cameră" value={name} onChange={setName} placeholder="Ex.: Salon, stânga" /><Field label="Lățime (cm)" numeric value={width} onChange={setWidth} /><Field label="Înălțime (cm, informativ)" numeric value={height} onChange={setHeight} /><Text style={s.hint}>Înălțimea ferestrei este doar informativă și apare în PDF. Schimbarea lățimii recalculează perdelele și draperiile. Dimensiunile produselor în m² se modifică separat.</Text><Button label="Salvează fereastra" onPress={() => {try {const w = numberInput(width); if (!w) throw new Error('Lățimea trebuie să fie pozitivă.'); onSave({id: value?.id ?? id(), name: name.trim(), width: w, height: height.trim() ? numberInput(height) : 0, items: value?.items ?? []});} catch(e) {error(e);}}} /><Button label="Renunță" secondary onPress={onClose} /></ScrollView></SafeAreaView></Modal>;
}

function PaymentForm({onSave, onClose}: {onSave: (amount: number, date: string) => void; onClose: () => void}) {
  const [amount, setAmount] = useState(''); const [date, setDate] = useState(today());
  return <Modal visible animationType="slide" onRequestClose={onClose}><SafeAreaView style={s.page}><ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled"><Text style={s.title}>Avans / plată nouă</Text><Field label="Suma (lei)" numeric value={amount} onChange={setAmount} /><Field label="Data plății (ZZ.LL.AAAA)" value={date} onChange={setDate} /><Button label="Adaugă plata" onPress={() => {try {onSave(numberInput(amount), date);} catch(e) {error(e);}}} /><Button label="Renunță" secondary onPress={onClose} /></ScrollView></SafeAreaView></Modal>;
}

function Editor({initial, company, busy, onSave, onClose}: {initial: Order; company: Company; busy: boolean; onSave: (o: Order) => Promise<Order>; onClose: () => void}) {
  const [order, setOrder] = useState<Order>(JSON.parse(JSON.stringify(initial)));
  const [step, setStep] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [windowModal, setWindowModal] = useState<{value?: WindowOrder} | null>(null);
  const [productModal, setProductModal] = useState<{window: WindowOrder; item?: Item} | null>(null);
  const [paymentModal, setPaymentModal] = useState(false);
  const [preview, setPreview] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [installationText, setInstallationText] = useState(String(order.installationPrice));
  const [discountText, setDiscountText] = useState(String(order.discount));
  const update = (patch: Partial<Order>) => {setOrder(o => ({...o, ...patch})); setDirty(true);};
  const close = async () => {if (!dirty || await ask('Modificări nesalvate', 'Doriți să părăsiți comanda fără a salva modificările?')) onClose();};
  useEffect(() => {if (Platform.OS === 'web') return; const subscription = BackHandler.addEventListener('hardwareBackPress', () => {void close(); return true;}); return () => subscription.remove();});
  const current = () => ({...order, installationPrice: numberInput(installationText || '0'), discount: numberInput(discountText || '0')});
  const displayed = {...order, installationPrice: Number(installationText.replace(',', '.')) || 0, discount: Number(discountText.replace(',', '.')) || 0};
  const t = totals(displayed);
  async function save(final: boolean) {
    try {
      const candidate = current();
      if (final && candidate.status === 'draft') candidate.status = 'confirmed';
      validateOrder(candidate, company, final || candidate.status !== 'draft');
      if (order.status !== 'draft' && order.revision > 0 && dirty && !await ask('Revizie nouă', 'Comanda anterioară se păstrează în istoric. Formularul modificat trebuie semnat din nou.')) return;
      const saved = await onSave(candidate); setOrder(saved); setDirty(false);
      notify('Comandă salvată', `${saved.number} · Revizia ${saved.revision}`);
    } catch(e) {error(e);}
  }
  async function documentAction(action: 'preview' | 'share' | 'print') {
    setExporting(true);
    try {
      if (dirty || !order.number) throw new Error('Salvați comanda înainte de a genera formularul.');
      const html = orderHtml(order, company);
      if (action === 'preview') {setPreview(true); return;}
      if (desktop()) {await desktop()!.document(html, `${order.number}-r${order.revision}`, action === 'print'); return;}
      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        if (!printWindow) throw new Error('Permiteți ferestrele pop-up pentru a tipări formularul.');
        printWindow.document.open(); printWindow.document.write(html); printWindow.document.close();
        await printWindow.document.fonts.ready;
        await Promise.all(Array.from(printWindow.document.images).map(img => img.complete ? Promise.resolve() : new Promise<void>(resolve => {img.onload = () => resolve(); img.onerror = () => resolve();})));
        printWindow.focus(); printWindow.print(); return;
      }
      if (action === 'print') {await Print.printAsync({html}); return;}
      if (!await Sharing.isAvailableAsync()) throw new Error('Partajarea nu este disponibilă pe acest dispozitiv.');
      const {uri} = await Print.printToFileAsync({html, width: 595, height: 842});
      const target = `${FS.cacheDirectory}${order.number}-r${order.revision}.pdf`;
      await FS.copyAsync({from: uri, to: target});
      await Sharing.shareAsync(target, {mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: 'Trimite fișa de comandă'});
    } catch(e) {error(e);} finally {setExporting(false);}
  }
  const steps = ['Client', 'Ferestre', 'Plată', 'Rezumat'];
  return <><View style={s.top}><Pressable onPress={() => void close()} style={s.back}><Text style={s.link}>‹ Comenzi</Text></Pressable><Text style={s.label}>{order.number || 'Comandă nouă'}{dirty ? ' •' : ''}</Text></View>
    <View style={[s.wrap, {paddingHorizontal: 18}]}>{steps.map((label, n) => <Pressable key={label} onPress={() => setStep(n)} style={[s.step, step === n && s.selected]}><Text style={step === n ? s.selectedText : s.body}>{n+1}. {label}</Text></Pressable>)}</View>
    <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      {step === 0 && <><Text style={s.title}>Datele clientului</Text><Field label="Nume client" value={order.customer} onChange={customer => update({customer})} /><Field label="Telefon" value={order.phone} onChange={phone => update({phone})} /><Field label="Adresă (opțional)" value={order.address} onChange={address => update({address})} multiline /><Field label="Data comenzii (ZZ.LL.AAAA)" value={order.date} onChange={date => update({date})} /><Field label="Data livrării (ZZ.LL.AAAA)" value={order.delivery} onChange={delivery => update({delivery})} /><Text style={s.hint}>Numărul comenzii se atribuie automat la prima salvare.</Text></>}
      {step === 1 && <><Text style={s.title}>Ferestre și produse</Text><Text style={s.hint}>Adăugați separat materialele și accesoriile pentru fiecare fereastră.</Text>{order.windows.map((w, n) => <Card key={w.id}><View style={s.amount}><Text style={s.heading}>Fereastra {n+1}{w.name ? ` · ${w.name}` : ''}</Text><Pressable onPress={() => setWindowModal({value: w})}><Text style={s.link}>Modifică</Text></Pressable></View><Text style={s.hint}>{decimal(w.width)} cm{w.height ? ` × ${decimal(w.height)} cm` : ''}</Text>{w.items.map(i => {const v = itemTotals(i, w); return <View key={i.id} style={s.product}><Pressable onPress={() => setProductModal({window: w, item: i})} style={{flex: 1}}><Text style={s.body}>{i.name}</Text><Text style={s.hint}>{i.code} · {decimal(v.quantity)} {v.unit}</Text><Text style={s.label}>{money(v.total)}{v.sewing > 0 ? ' · croitorie inclusă' : ''}</Text></Pressable><Pressable accessibilityLabel={`Șterge ${i.name}`} onPress={async () => {if (await ask('Șterge produsul', i.name)) update({windows: order.windows.map(x => x.id === w.id ? {...x, items: x.items.filter(item => item.id !== i.id)} : x)});}}><Text style={s.remove}>Șterge</Text></Pressable></View>;})}<Button label="+ Adaugă produs" secondary onPress={() => setProductModal({window: w})} /><Amount label="Total fereastră" value={windowTotal(w)} strong /><Pressable onPress={async () => {if (await ask('Șterge fereastra', 'Se vor elimina și produsele acestei ferestre.')) update({windows: order.windows.filter(x => x.id !== w.id)});}}><Text style={s.remove}>Șterge fereastra</Text></Pressable></Card>)}<Button label="+ Adaugă fereastră" onPress={() => setWindowModal({})} /></>}
      {step === 2 && <><Text style={s.title}>Plată și montaj</Text><Card><Toggle label="Clientul solicită montaj" value={order.installation} onChange={installation => update({installation})} />{order.installation && <Field label="Cost montaj (lei)" numeric value={installationText} onChange={v => {setInstallationText(v); setDirty(true);}} />}<Field label="Reducere (lei)" numeric value={discountText} onChange={v => {setDiscountText(v); setDirty(true);}} /></Card><Card><Text style={s.heading}>Avans și plăți</Text>{order.payments.map((p, n) => <View key={p.id} style={s.product}><View style={{flex: 1}}><Text style={s.body}>{n === 0 ? 'Avans' : 'Plată'} · {p.date}</Text><Text style={s.heading}>{money(p.amount)}</Text></View><Pressable onPress={async () => {if (await ask('Șterge plata', money(p.amount))) update({payments: order.payments.filter(x => x.id !== p.id)});}}><Text style={s.remove}>Șterge</Text></Pressable></View>)}<Button label="+ Adaugă avans / plată" secondary onPress={() => setPaymentModal(true)} /></Card><Card><Amount label="Subtotal" value={t.subtotal} /><Amount label="Montaj" value={t.installation} /><Amount label="Reducere" value={displayed.discount} /><Amount label="Total" value={t.total} strong /><Amount label="Achitat" value={t.paid} /><Amount label="Rest de plată" value={t.remaining} strong /></Card></>}
      {step === 3 && <><Text style={s.title}>Rezumat comandă</Text><Card><Text style={s.heading}>{order.customer || 'Client necompletat'}</Text><Text style={s.body}>{order.phone}</Text><Text style={s.hint}>Livrare: {order.delivery || 'Nespecificată'} · {order.windows.length} ferestre</Text><Amount label="Total" value={t.total} strong /><Amount label="Achitat" value={t.paid} /><Amount label="Rest de plată" value={t.remaining} strong /></Card><Text style={s.label}>Starea comenzii</Text><View style={s.wrap}>{(Object.keys(statuses) as Status[]).map(status => <Pressable key={status} onPress={() => update({status})} style={[s.chip, order.status === status && s.selected]}><Text style={order.status === status ? s.selectedText : s.body}>{statuses[status]}</Text></Pressable>)}</View><Button label={order.status === 'draft' ? 'Confirmă și salvează comanda' : 'Salvează comanda'} disabled={busy} onPress={() => void save(true)} /><Button label="Previzualizează formularul" secondary disabled={busy || exporting} onPress={() => void documentAction('preview')} /><Button label="PDF · Salvează / distribuie" secondary disabled={busy || exporting} onPress={() => void documentAction('share')} /><Button label="Tipărește formularul" secondary disabled={busy || exporting} onPress={() => void documentAction('print')} /><Text style={s.hint}>Semnătura clientului se obține pe formularul tipărit. Modificările comenzilor salvate se păstrează ca revizii.</Text></>}
      {step < 3 && <Button label={`Continuă · ${steps[step+1]}`} onPress={() => setStep(step+1)} />}
      <Button label={order.status === 'draft' ? 'Salvează ciorna' : 'Salvează modificările'} secondary disabled={busy} onPress={() => void save(false)} />
    </ScrollView></KeyboardAvoidingView>
    {windowModal && <WindowForm value={windowModal.value} onClose={() => setWindowModal(null)} onSave={w => {update({windows: windowModal.value ? order.windows.map(x => x.id === w.id ? w : x) : [...order.windows, w]}); setWindowModal(null);}} />}
    {productModal && <ProductForm windowOrder={productModal.window} item={productModal.item} onClose={() => setProductModal(null)} onSave={i => {update({windows: order.windows.map(w => w.id === productModal.window.id ? {...w, items: productModal.item ? w.items.map(x => x.id === i.id ? i : x) : [...w.items, i]} : w)}); setProductModal(null);}} />}
    {paymentModal && <PaymentForm onClose={() => setPaymentModal(false)} onSave={(amount, date) => {const candidate = current(); candidate.payments = [...candidate.payments, {id: id(), amount, date}]; validateOrder(candidate, company); update({payments: candidate.payments}); setPaymentModal(false);}} />}
    <Modal visible={preview} animationType="slide" onRequestClose={() => setPreview(false)}><SafeAreaView style={s.page}><View style={s.top}><Text style={s.heading}>Fișa de comandă</Text><Button label="Închide" secondary onPress={() => setPreview(false)} /></View>{preview && (Platform.OS === 'web' ? React.createElement('iframe', {srcDoc: orderHtml(order, company), title: 'Fișa de comandă', style: {width: '100%', flex: 1, border: 0, height: '80vh'}}) : <WebView source={{html: orderHtml(order, company)}} originWhitelist={['about:*']} javaScriptEnabled={false} onShouldStartLoadWithRequest={request => request.url === 'about:blank'} style={{flex: 1}} />)}</SafeAreaView></Modal>
  </>;
}

function Settings({store, busy, onSave, onRestore}: {store: Store; busy: boolean; onSave: (company: Company) => Promise<void>; onRestore: (store: Store) => Promise<void>}) {
  const [company, setCompany] = useState(store.company); const [working, setWorking] = useState(false);
  const patch = (p: Partial<Company>) => setCompany(c => ({...c, ...p}));
  async function chooseLogo() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({mediaTypes: ['images'], allowsEditing: true, quality: .6, base64: true});
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset.base64 || asset.base64.length > 2_000_000) throw new Error('Alegeți o siglă mai mică (maximum aproximativ 1,5 MB).');
      patch({logo: `data:${asset.mimeType === 'image/png' ? 'image/png' : 'image/jpeg'};base64,${asset.base64}`});
    } catch(e) {error(e);}
  }
  async function backup() {
    setWorking(true);
    try {
      const raw = JSON.stringify(store, null, 2);
      if (Platform.OS === 'web') {
        const url = URL.createObjectURL(new Blob([raw], {type: 'application/json'})); const a = document.createElement('a'); a.href = url; a.download = 'atelier-perdele-backup.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); return;
      }
      if (!await Sharing.isAvailableAsync()) throw new Error('Partajarea nu este disponibilă.');
      const uri = `${FS.cacheDirectory}atelier-perdele-backup-${today()}.json`;
      await FS.writeAsStringAsync(uri, raw);
      await Sharing.shareAsync(uri, {mimeType: 'application/json', UTI: 'public.json', dialogTitle: 'Salvează backupul'});
    } catch(e) {error(e);} finally {setWorking(false);}
  }
  async function restore() {
    setWorking(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({type: ['application/json', 'text/plain'], copyToCacheDirectory: true});
      if (result.canceled) return;
      const raw = Platform.OS === 'web' ? await (await fetch(result.assets[0].uri)).text() : await FS.readAsStringAsync(result.assets[0].uri);
      const imported = parseBackup(raw);
      if (!await ask('Restaurează backupul', `Cele ${imported.orders.length} comenzi din backup vor înlocui toate datele curente. Exportați mai întâi un backup al datelor curente.`)) return;
      await onRestore(imported); setCompany(imported.company); notify('Backup restaurat');
    } catch(e) {error(e);} finally {setWorking(false);}
  }
  return <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled"><Text style={s.eyebrow}>ATELIER PERDELE</Text><Text style={s.title}>Date magazin</Text><Text style={s.hint}>Aceste informații apar în fișa de comandă. Comenzile deja salvate păstrează datele magazinului din momentul salvării.</Text><Card>{company.logo && <Image source={{uri: company.logo}} style={{width: 150, height: 70, resizeMode: 'contain', marginBottom: 12}} />}<Button label="Alege sigla magazinului" secondary onPress={() => void chooseLogo()} />{company.logo && <Pressable onPress={() => patch({logo: undefined})}><Text style={s.remove}>Elimină sigla</Text></Pressable>}<Field label="Denumire magazin" value={company.name} onChange={name => patch({name})} /><Field label="Adresă magazin" multiline value={company.address} onChange={address => patch({address})} /><Field label="Telefon magazin" value={company.phone} onChange={phone => patch({phone})} /><Field label="Condiții de comandă (Română)" multiline value={company.conditions} onChange={conditions => patch({conditions})} /><Text style={s.hint}>Monedă: lei · Dimensiuni introduse în centimetri</Text><Button label="Salvează setările" disabled={busy || working} onPress={async () => {try {if (!company.name.trim() || !company.address.trim()) throw new Error('Completați denumirea și adresa magazinului.'); await onSave(company); Alert.alert('Setări salvate');} catch(e) {error(e);}}} /></Card><Card><Text style={s.heading}>Copie de siguranță</Text><Text style={s.hint}>Datele sunt păstrate pe acest dispozitiv. Salvați periodic un backup în Fișiere, iCloud Drive sau Google Drive. Backupul include clienți, plăți, revizii și sigla magazinului.</Text><Button label="Exportă backup" secondary disabled={working || busy} onPress={() => void backup()} /><Button label="Restaurează din backup" secondary disabled={working || busy} onPress={() => void restore()} /></Card></ScrollView>;
}

export default function App() {
  const [store, setStore] = useState<Store>(emptyStore()); const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false); const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<'orders' | 'settings'>('orders'); const [editor, setEditor] = useState<Order | null>(null);
  const [search, setSearch] = useState(''); const [filter, setFilter] = useState<Status | 'all'>('all');
  const [historyOrder, setHistoryOrder] = useState<Order | null>(null); const [historyPreview, setHistoryPreview] = useState<Order | null>(null);
  async function load() {setLoadError(false); try {const value = await loadStore(); setStore(value); if (!value.company.name) setTab('settings'); setLoaded(true);} catch(e) {setLoadError(true); error(e);}}
  useEffect(() => {void load();}, []);
  async function commit(next: Store) {if (busy) throw new Error('Așteptați salvarea curentă.'); setBusy(true); try {await persist(next); setStore(next);} finally {setBusy(false);}}
  async function removeOrder(order: Order) {
    if (busy) return;
    if (!await ask('Șterge comanda?', `${order.number} · ${order.customer || 'Client necompletat'}\nComanda, plățile și toate reviziile sale vor fi șterse definitiv. Această acțiune nu poate fi anulată.`)) return;
    try {await commit(deleteOrder(store, order.id));} catch(e) {error(e);}
  }
  const visible = store.orders.filter(o => (filter === 'all' || o.status === filter) && `${o.customer} ${o.number} ${o.phone}`.toLocaleLowerCase('ro-RO').includes(search.toLocaleLowerCase('ro-RO')));
  const outstanding = store.orders.filter(o => o.status !== 'draft').reduce((n, o) => n + totals(o).remaining, 0);
  return <SafeAreaProvider><SafeAreaView style={s.page}><StatusBar style="dark" />{!loaded ? <View style={s.loading}>{loadError ? <><Text style={s.heading}>Datele nu au putut fi încărcate.</Text><Text style={s.hint}>Nu am suprascris datele existente.</Text><Button label="Încearcă din nou" onPress={() => void load()} /></> : <ActivityIndicator size="large" color={C.accent} />}</View> : editor ? <Editor key={editor.id} initial={editor} company={store.company} busy={busy} onClose={() => setEditor(null)} onSave={async o => {const next = saveOrder(store, o); await commit(next); return next.orders[0];}} /> : <>
    {tab === 'settings' ? <Settings store={store} busy={busy} onSave={company => commit({...store, company})} onRestore={commit} /> : <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled"><Text style={s.eyebrow}>{store.company.name || 'ATELIER PERDELE'}</Text><Text style={s.title}>Comenzile tale</Text><Text style={s.hint}>Măsurători, produse și plăți, într-un singur loc.</Text><Card><Text style={s.hint}>DE ÎNCASAT · COMENZI CONFIRMATE</Text><Text style={s.total}>{money(outstanding)}</Text><Text style={s.hint}>{store.orders.length} comenzi salvate</Text></Card><Button label="+ Comandă nouă" onPress={() => setEditor(newOrder())} /><Field label="Caută o comandă" value={search} onChange={setSearch} placeholder="Client, număr sau telefon" /><View style={s.wrap}>{(['all', ...Object.keys(statuses)] as (Status | 'all')[]).map(status => <Pressable key={status} onPress={() => setFilter(status)} style={[s.chip, filter === status && s.selected]}><Text style={filter === status ? s.selectedText : s.body}>{status === 'all' ? 'Toate' : statuses[status]}</Text></Pressable>)}</View>{visible.map(o => <Card key={o.id}><Pressable onPress={() => setEditor(o)}><View style={s.amount}><Text style={s.heading}>{o.customer || 'Client necompletat'}</Text><Text style={s.badge}>{statuses[o.status]}</Text></View><Text style={s.hint}>{o.number} · {o.date}</Text><Text style={s.body}>Livrare: {o.delivery || '—'}</Text><Amount label="Rest de plată" value={totals(o).remaining} /></Pressable>{store.history.some(h => h.id === o.id) && <Pressable onPress={() => setHistoryOrder(o)}><Text style={s.link}>Vezi reviziile anterioare</Text></Pressable>}<Pressable accessibilityRole="button" accessibilityLabel={`Șterge comanda ${o.number}`} disabled={busy} onPress={() => void removeOrder(o)} style={[s.deleteOrder, busy && {opacity: .55}]}><Text style={s.deleteOrderText}>Șterge comanda</Text></Pressable></Card>)}{!visible.length && <Card><Text style={s.heading}>{store.orders.length ? 'Nicio comandă găsită' : 'Prima comandă începe aici'}</Text><Text style={s.hint}>Adăugați clientul, apoi ferestrele și produsele.</Text>{!store.orders.length && <Button label="Deschide exemplul cu 5 ferestre" secondary onPress={async () => {try {if (!store.company.name) await commit({...store, company: sampleCompany}); setEditor(sampleOrder());} catch(e) {error(e);}}} />}</Card>}</ScrollView>}
    <View style={s.nav}><Pressable onPress={() => setTab('orders')} style={s.navItem}><Text style={[s.navText, tab === 'orders' && {color: C.accent}]}>Comenzi</Text></Pressable><Pressable onPress={() => setTab('settings')} style={s.navItem}><Text style={[s.navText, tab === 'settings' && {color: C.accent}]}>Magazin și backup</Text></Pressable></View>
    <Modal visible={!!historyOrder} onRequestClose={() => setHistoryOrder(null)}><SafeAreaView style={s.page}><ScrollView contentContainerStyle={s.content}><Text style={s.title}>Revizii · {historyOrder?.number}</Text>{store.history.filter(h => h.id === historyOrder?.id).slice().reverse().map(h => <Card key={`${h.id}-${h.revision}`}><Text style={s.heading}>Revizia {h.revision}</Text><Text style={s.body}>{h.customer} · {money(totals(h).total)}</Text><Button label="Vezi formularul salvat" secondary onPress={() => {setHistoryOrder(null); setHistoryPreview(h);}} /></Card>)}<Button label="Închide" onPress={() => setHistoryOrder(null)} /></ScrollView></SafeAreaView></Modal>
    <Modal visible={!!historyPreview} onRequestClose={() => setHistoryPreview(null)}><SafeAreaView style={s.page}><Button label="Închide revizia" secondary onPress={() => setHistoryPreview(null)} />{historyPreview && (Platform.OS === 'web' ? React.createElement('iframe', {srcDoc: orderHtml(historyPreview, store.company), title: 'Revizie', style: {width: '100%', flex: 1, border: 0}}) : <WebView source={{html: orderHtml(historyPreview, store.company)}} javaScriptEnabled={false} originWhitelist={['about:*']} onShouldStartLoadWithRequest={r => r.url === 'about:blank'} />)}</SafeAreaView></Modal>
    </>}</SafeAreaView></SafeAreaProvider>;
}

const s = StyleSheet.create({
  page: {flex: 1, backgroundColor: C.bg}, content: {padding: 20, paddingBottom: 40, width: '100%', maxWidth: 760, alignSelf: 'center'},
  title: {fontSize: 29, fontWeight: '700', color: C.ink, marginBottom: 12, marginTop: 8}, eyebrow: {fontSize: 11, letterSpacing: 2, fontWeight: '700', color: C.accent, marginTop: 10},
  heading: {fontSize: 16, fontWeight: '700', color: C.ink, flexShrink: 1}, body: {fontSize: 14, color: C.ink, lineHeight: 21}, hint: {fontSize: 12, color: C.muted, lineHeight: 19, marginVertical: 6}, label: {fontSize: 12, fontWeight: '600', color: C.ink, marginBottom: 6},
  card: {backgroundColor: '#fff', borderRadius: 16, padding: 18, marginVertical: 8, borderWidth: 1, borderColor: C.border}, total: {fontSize: 30, fontWeight: '700', color: C.accent},
  field: {marginVertical: 9}, input: {backgroundColor: '#fff', color: C.ink, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 13, fontSize: 16, minHeight: 48},
  button: {backgroundColor: C.accent, padding: 14, borderRadius: 11, marginVertical: 6, alignItems: 'center', minHeight: 48, justifyContent: 'center'}, buttonText: {fontSize: 14, fontWeight: '700', color: '#fff'}, secondary: {backgroundColor: C.pale},
  wrap: {flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginVertical: 10}, chip: {paddingHorizontal: 12, paddingVertical: 10, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: C.border}, selected: {backgroundColor: C.accent, borderColor: C.accent}, selectedText: {color: '#fff', fontSize: 13},
  amount: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingVertical: 7}, product: {flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border, gap: 12}, link: {color: C.accent, fontSize: 14, fontWeight: '600', paddingVertical: 8}, remove: {color: '#a54d3b', fontSize: 12, paddingVertical: 10},
  deleteOrder: {marginTop: 12, borderWidth: 1, borderColor: '#e8c8c1', backgroundColor: '#fff5f2', borderRadius: 10, minHeight: 44, alignItems: 'center', justifyContent: 'center'}, deleteOrderText: {color: '#a54d3b', fontSize: 14, fontWeight: '600'},
  nav: {flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.border, backgroundColor: '#fff'}, navItem: {flex: 1, padding: 20, alignItems: 'center'}, navText: {fontSize: 14, fontWeight: '700', color: C.muted},
  top: {paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10}, back: {paddingVertical: 10}, step: {paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, backgroundColor: '#e8eeea'}, badge: {fontSize: 11, color: C.accent, padding: 7, backgroundColor: C.pale, borderRadius: 8}, loading: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30},
});
