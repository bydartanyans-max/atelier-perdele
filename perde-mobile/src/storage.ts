import AsyncStorage from '@react-native-async-storage/async-storage';
import { emptyStore, Store } from './model';
import { parseBackup } from './backup';
import { desktop } from './desktop';
export { parseBackup } from './backup';
const KEY = 'atelier-perdele-v1';
export async function loadStore(): Promise<Store> {
  const raw = desktop() ? await desktop()!.readStore() : await AsyncStorage.getItem(KEY);
  return raw ? parseBackup(raw) : emptyStore();
}
let queue = Promise.resolve();
export function persist(store: Store): Promise<void> {
  const task = queue.catch(() => {}).then(() => desktop() ? desktop()!.writeStore(JSON.stringify(store)) : AsyncStorage.setItem(KEY, JSON.stringify(store)));
  queue = task;
  return task;
}
