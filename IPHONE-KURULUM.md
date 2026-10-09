# Atelier Perdele — iPhone hazırlığı

Android'de onaylanan uygulamanın aynı kaynak kodu iOS için hazırlandı. `Atelier-Perdele-iPhone-kaynak.zip` bir kaynak proje paketidir; telefona kurulacak IPA değildir.

Bu Windows bilgisayarda Xcode olmadığı için iOS native derlemesi ve Apple imzalaması yapılmadı. iOS JavaScript dışa aktarımı native derleme veya gerçek cihaz testi yerine geçmez.

## Expo hesabı olmadan Mac üzerinden

1. Bir Mac üzerinde Xcode, Node.js 22 ve CocoaPods kurun. Xcode'u açıp ilk kurulum işlemlerini tamamlayın.
2. ZIP dosyasını Mac'e açın. Terminal'de proje klasörüne geçip `bash build-iphone.command` çalıştırın.
3. İmzalama hesabı istenirse `ios/AtelierPerdele.xcworkspace` dosyasını Xcode'da açın. Uygulama hedefinde Signing & Capabilities → Team alanından Apple hesabınızı seçin. Gerekirse bundle identifier'ı hesabınız için benzersiz yapın ve aynı değeri app.json'a da yazın.
4. iPhone'u USB ile bağlayın; telefonda bilgisayara güvenin. Gerekirse Developer Mode'u açın. Scripti tekrar çalıştırıp telefonu seçin.
5. Release derlemesi JavaScript kodunu uygulamaya gömer; kurulumdan sonra bilgisayar ve Expo Go gerekmez.

Ücretsiz Apple hesabıyla Personal Team kullanıldığında cihaz kurulum profili 7 gün sonra sona erer; yeniden imzalama/kurulum gerekir. Bu yöntem müşteriye sürekli kullanım sağlamak için uygun değildir. TestFlight veya kayıtlı cihazlara Ad Hoc dağıtım için Apple Developer üyeliği ve ilgili imzalama/cihaz kaydı gerekir. Hesap parolasını paylaşmayın; Apple girişini kendiniz yapın.

Mac ve Apple Developer hesabı mevcut değilse bağımsız iPhone kurulumu henüz tamamlanamaz. Expo hesabı kullanmama tercihi korunmuştur; bulut derlemesi veya yayın başlatılmadı.

## Cihazda kontrol

Mağaza logosu, sipariş kaydetme ve yeniden açma, pencere yüksekliği, plise/jaluzi hesabı, aksesuarlar, PDF paylaşımı, AirPrint ve yedek dışa aktarma/geri yükleme denenmelidir. Android kayıtları otomatik aktarılmaz; Android'den JSON yedeği alıp iPhone'da geri yükleyebilirsiniz.

Kaynaklar: https://docs.expo.dev/guides/local-app-overview/ ve https://developer.apple.com/help/account/basics/about-your-developer-account
