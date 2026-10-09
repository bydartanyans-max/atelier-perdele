# Atelier Perdele

Android ve iPhone için tek kullanıcılı, Romence perde mağazası uygulaması. React Native + Expo SDK 54 kullanır. Kayıtlar cihazda saklanır; sunucu veya kullanıcı hesabı gerektirmez.

## Çalıştırma

Bu çalışma alanında Node.js proje kökündeki `.tools` klasöründedir. PowerShell'de `start-mobile.ps1` dosyasını çalıştırın. Başka bilgisayarda Node.js 22+ kurduktan sonra:

```sh
cd perde-mobile
npm ci
npm start
```

Android telefonda Expo Go'nun SDK 54 uyumlu sürümüyle terminaldeki QR kodunu okutun; telefon ve bilgisayar aynı Wi-Fi'de olmalıdır. Expo Go bir test ortamıdır, bağımsız APK değildir. Sürüm seçimi: https://expo.dev/go?platform=android&device=true&sdkVersion=54

Tarayıcı önizlemesi: `npm run web`. Tarayıcıdaki PDF düğmesi yazdırma penceresi açar; PDF olarak kaydedilebilir. Native paylaşım, yazdırma ve dosya seçimi gerçek Android/iPhone üzerinde ayrıca denenmelidir.

## Android APK ve iPhone kurulumu

Expo hesabı olmadan yerel Android APK hazırlanabilir. Bu çalışma alanındaki araçları kullanmak için kök klasörde PowerShell'de:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\setup-android.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\install-android-sdk.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\build-android.ps1
```

Araçlar `.tools` klasöründedir; sistemin kalıcı Java/SDK veya PowerShell ayarlarını değiştirmez. İlk iki adım yalnızca ilk kurulumda gerekir; SDK kurulumu lisans kabulünü içerir. Derleme sonucu kök klasörde `Atelier-Perdele-test.apk` oluşturulur. Release paketi JavaScript kodunu içerir; Expo Go veya Metro sunucusu gerekmez. Test paketi şablonun Android debug sertifikasıyla imzalanır; mağaza dağıtımı için kalıcı özel imza anahtarı hazırlanmalıdır. ARM64 ve ARM32 Android 7+ telefonları hedefler.

`eas.json` Android için `preview` APK profilini içerir. Expo hesabı ile `npx eas-cli build --platform android --profile preview` çalıştırılabilir. Bulut derlemesi ayrı oturum/hesap gerektirir; henüz yapılmamıştır.

iPhone kurulumu Android APK yüklemekle aynı değildir. TestFlight / imzalı dağıtım için Apple Developer hesabı ve iOS provisioning gerekir. EAS Build ile Windows'tan iOS derlemesi hazırlanabilir; müşterinin telefonuna kurulum ayrıca ayarlanmalıdır. App Store veya bulut yayını yapılmamıştır.

## İş kuralları

- Ölçüler cm girilir. Kumaş metre miktarı = pencere eni / 100 × kat oranı. Dikim payı eklenmez.
- Kumaş bedeli ve dikim bedeli aynı hesaplanan metre üzerinden ayrı hesaplanır. Kat oranı PDF'de görünmez.
- Plise/jaluzi: en × boy / 10.000; isteğe bağlı elle girilen faturalandırılacak m² alanı, parça adediyle çarpılır. Alan/miktarlar 2 ondalığa yuvarlanır.
- Korniş, boru ve aksesuarlar adet üzerinden hesaplanır. Ürünler elle girilir; stok/ürün kartı yoktur.
- Para birimi lei. Montaj, sabit tutar indirimi, avans ve sonraki ödemeler bakiyeyi günceller. Vergi ayrıştırması yoktur; girilen fiyatlar müşteriye uygulanacak son fiyatlardır.
- Sipariş numarası ilk kayıtta atanır. Tarihler ZZ.LL.AAAA girilir; form tarihi otomatik başlar.
- Ciorna / În lucru / Pregătită / Livrată durumları bulunur.
- Önceki kayıtlar revizyon olarak saklanır ve görüntülenebilir. İmzalar basılı formda alınır; uygulamada dijital imza yoktur.
- Mağaza bilgileri ve koşullar sipariş kaydında kopyalanır; ayar değişikliği eski PDF'leri değiştirmez.
- Backup JSON dosyası müşteri bilgilerini içerir. Export/restore manuel yapılır. Otomatik bulut yedeklemesi yoktur.

## Kontroller

```sh
npm run typecheck
npm test
npx expo export --platform all
```

Hesaplama, ödeme, revizyon, doğrulama ve PDF içerikleri test edilir. Cihazda: logo seçimi, kayıt sonrası yeniden açma, m² fiyatı, aksesuar ekleme, PDF paylaşma/yazdırma ve backup geri yükleme ayrıca denenmelidir.

Sipariş koşulları mağaza ayarlarında düzenlenebilir. Özel üretim tekstil koşulları standart aksesuarların yasal haklarını kaldırmaz. Başlangıç metni önceki PDF tasarımıyla aynıdır.

Android test APK'sı bu bilgisayarda Expo hesabı kullanmadan derlendi: `../Atelier-Perdele-test.apk` (29,4 MB). APK Signature Scheme v2 imzası doğrulandı; gömülü JavaScript paketi ve iki ARM mimarisinin Hermes kütüphaneleri kontrol edildi. Kurulum adımları `../APK-KURULUM.txt` dosyasında. Gerçek telefon testi henüz yapılmadı; iPhone için IPA üretilmedi.

Windows'ta ilk derlemede Gradle önbellek klasörlerini taşıma sorunu yaşandı. Tamamlanmış önbellek klasörleri kurtarıldı ve tek çalışan, dosya izlemesi kapalı derleme başarıyla tamamlandı. Build scripti bu seçenekleri içerir.

SDK 54 telefon testine uyumluluk için seçildi. `npm audit` bağımlılık ağacında 35 bildirim raporladı; uyumlu düzeltmeler uygulandı, Expo/React Native sürümünü değiştiren zorunlu güncellemeler uygulanmadı. Üretim dağıtımından önce desteklenen SDK sürümüyle bu rapor yeniden değerlendirilmelidir.
