# Atelier Perdele Windows

Windows 10/11 x64 için Electron masaüstü uygulaması. Ortak React Native web arayüzünü yerel `atelier://app` adresinden açar; ağ sunucusu veya internet gerekmez. Kurulum dosyası proje kökünde `Atelier-Perdele-Windows-Kurulum.exe` (yaklaşık 106,4 MiB).

Siparişler kullanıcıya ait AppData/Roaming/Atelier Perdele/orders.json dosyasında saklanır. Yazma işlemleri ortak storage modülünde sıraya alınır ve geçici dosya tamamlandıktan sonra asıl dosyanın yerini alır. Kurulum mevcut verileri silmez. Telefon ve bilgisayar otomatik eşitlenmez; JSON yedek aktarımı kullanılır.

PDF kaydetme ve yazdırma, Node erişimi olmayan arayüzden sınırlı IPC köprüsüyle yapılır. Ana çerçeve dışından IPC çağrıları reddedilir. Pencere sandbox ve context isolation kullanır, dış adreslere gezinme ve yeni pencereler engellenir. PDF penceresinde JavaScript kapalıdır.

Yeniden derleme: proje kökündeki `build-windows.ps1`. Bağımlılık sürümleri package-lock.json dosyasında sabitlenir; script npm ci kullanır. Electron/NSIS önbellekleri proje kökündeki .tools klasöründe tutulur. Kurulum ticari kod imzalama sertifikasıyla imzalı değildir; SmartScreen uyarısı görülebilir.

Doğrulama: TypeScript kontrolü ve ortak sekiz test geçti. `perde-mobile/tests/windows-smoke.mjs` bağımsız test klasöründe mağaza kurulumu, sipariş kaydetme, disk kalıcılığı, PDF önizleme/kaydetme, yeniden yükleme ve JSON yedek dışa aktarma/geri yüklemeyi doğruladı. Gerçek yazıcıda çıktı ve başka bilgisayarda kurulum henüz denenmedi. Kullanıcının bilgisayarına otomatik kurulum yapılmadı.

Güvenlik ve paketleme kaynakları: https://www.electronjs.org/docs/latest/tutorial/security/ ve https://www.electron.build/docs/nsis/
