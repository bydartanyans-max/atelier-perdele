export interface DesktopBridge {
  readStore(): Promise<string | null>;
  writeStore(raw: string): Promise<void>;
  document(html: string, name: string, print: boolean): Promise<void>;
}
export function desktop(): DesktopBridge | undefined {
  return typeof window === 'undefined' ? undefined : (window as unknown as {atelierDesktop?: DesktopBridge}).atelierDesktop;
}
