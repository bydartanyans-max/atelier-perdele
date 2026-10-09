# Atelier Perdele

Perde mağazaları için Romence, tek kullanıcılı sipariş uygulaması. Android, Windows ve iPhone Safari/ana ekran sürümlerinin kaynak kodlarını içerir.

## İndir ve kullan

Android APK ve Windows kurulum EXE'si GitHub Releases altında v1.0.1 sürümünde bulunur. iPhone web paketi de aynı sürümün ekidir.

iPhone canlı uygulaması: https://atelier-perdele-iphone.tealbirch2.chatgpt.site

iPhone'da Safari ile açın, Paylaş → Ana Ekrana Ekle seçin ve simgeyi ilk kez internet bağlıyken açın. Bu bir web uygulamasıdır; imzalı native IPA oluşturulmadı. WebKit testleri geçti, gerçek iPhone testi yapılmadı.

Windows'ta EXE imzasızdır; Smart App Control engelleyebilir. Alternatif olarak Atelier-Perdele-Tarayici.html dosyasını Edge'de açabilirsiniz. Android APK test anahtarıyla imzalıdır; mevcut uygulamanın üzerine kurarak güncellenir.

Kayıtlar cihazda veya tarayıcıda saklanır; otomatik eşitleme yoktur. Düzenli JSON yedeği alın. Sipariş silme onayından sonra sipariş, ödemeler ve revizyonlar kaldırılır.

## Özellikler

- Müşteri ve mağaza bilgileri/logo, cam bazında en/boy ve ürünler.
- Kumaş kat oranı, ayrı dikim ücreti; dikim payı eklenmez.
- Plise/jaluzi m²; korniş, boru ve aksesuar adet hesabı.
- Lei, avans/ödemeler/bakiye, indirim ve montaj.
- Romence PDF, teslim tarihi ve basılı müşteri imzası alanı.
- Sipariş durumları, arama, revizyonlar ve JSON yedekleme.

## Kaynak ve doğrulama

perde-mobile: React Native/Expo ortak uygulama; perde-windows: Electron masaüstü; perde-iphone-web/dist: yayındaki PWA'nın statik çıktısı.

Node.js 22 ile perde-mobile klasöründe npm ci, npm run typecheck, npm test çalıştırın. Web arayüzü npm run web ile açılır. Android derlemesi için Android SDK/JDK; native iOS için Mac/Xcode ve Apple imzalaması gerekir. Windows'ta proje içindeki araçları kurmak için kök build/setup scriptlerini kullanın.

Dokuz iş kuralı testi geçti. Windows ve WebKit tarayıcı testlerinde kayıt, PDF formu, yedek, silme onayı/iptali ve yeniden açılış kontrol edildi. PWA çevrimdışı açılışı WebKit'te test edildi. Gerçek yazıcı ve fiziksel iPhone ayrıca denenmelidir.

Bu depo müşteri kayıtları, cihaz yedekleri, özel anahtarlar veya yayınlama erişim anahtarları içermez.
