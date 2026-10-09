# Windows EXE imzalama hazırlığı

Araştırma tarihi: 09.10.2026. Mevcut kurulum EXE'si hâlâ imzasızdır. Hesap, ücretli abonelik veya sertifika satın alımı başlatılmadı.

## Şirket adına: Azure Artifact Signing

Microsoft'un Basic planı aylık 9,99 USD; ayda 5.000 imza dahil. Yerel vergi ve faturalandırma tutarı başvuru sırasında kontrol edilmelidir. Romanya, desteklenen Avrupa Birliği ülkelerindendir; şirket adına kimlik doğrulaması yapılabilir. Bireysel Public Trust başvuruları şu anda yalnızca ABD ve Kanada için açıktır.

Gerekenler: Azure aboneliği, Microsoft Entra hesabı, şirketin yasal adı ve kayıt belgeleri, şirkete ait web sitesi/alan adına bağlı e-posta ve yetkili kişinin kimlik doğrulaması. Belgeler Microsoft'un kendi başvuru ekranlarına yüklenir. Doğrulama onaylanmadan imzalama tamamlanamaz.

Hesap ve doğrulanmış Public Trust sertifika profili oluşturulduktan sonra projedeki `perde-windows/electron-builder.azure.cjs` ayarı kullanılabilir. Public Trust Test veya Private Trust, müşteriye dağıtım için Public Trust yerine kullanılmamalıdır.

Bu ayrı ayar imzalamayı zorunlu tutar ve çıktıyı `release-signed` klasörüne yazar. Uygulama EXE'si, kaldırıcı ve kurulum EXE'si yeniden paketlenip imzalanmalıdır; yalnızca dış kurulum dosyasını imzalamak yeterli olmayabilir.

Ortamda gereken gizli olmayan ayarlar:

- ATELIER_SIGNING_PUBLISHER: doğrulanmış sertifika CN/yayıncı adı.
- ATELIER_SIGNING_ENDPOINT: hesabın Azure bölgesine ait HTTPS endpoint.
- ATELIER_SIGNING_ACCOUNT: Artifact Signing hesabı adı.
- ATELIER_SIGNING_PROFILE: Public Trust sertifika profili adı.

Kimlik doğrulaması Microsoft'un desteklediği yöntemle ayrıca ayarlanır. Hesap parolası veya AZURE_CLIENT_SECRET sohbet mesajına, kaynak koduna veya log dosyasına yazılmamalıdır. Sertifika profiline yalnızca gereken imzalama yetkisi verilmelidir.

İmzalama hesabı hazırlandıktan sonra proje klasöründe komut:

```text
npx electron-builder --config electron-builder.azure.cjs --win nsis --x64 --publish never
```

Bu hazırlık gerçek imzalama testi değildir. Son çıktıda Authenticode, zaman damgası ve güven zinciri kontrol edilmeli; hedef bilgisayarda Smart App Control açıkken kurulum ve açılış denenmelidir. İmza, bütün Windows güvenlik uyarılarının kesinlikle kalkacağı garantisi değildir.

## Bireysel başvuru alternatifi: SSL.com

SSL.com IV Code Signing bireysel geliştiriciler içindir. İncelenen satın alma sayfasında sertifika 129 USD/yıl; eSigner bulut imzalama Tier 1 ayrıca 20 USD/ay veya yıllık ödemede 180 USD/yıl olarak listeleniyor. İkisi için yıllık ödemeli örnek toplam 309 USD, vergi hariçtir. Bu toplam tek başına sertifika fiyatı olarak sunulmamalıdır. Ülke uygunluğu, kabul edilen belgeler, güncel toplam ve ilk 30 günlük deneme şartları satın almadan önce sağlayıcının ekranından teyit edilmelidir.

## Kaynaklar

- https://azure.microsoft.com/en-us/products/artifact-signing
- https://learn.microsoft.com/en-us/azure/artifact-signing/quickstart
- https://learn.microsoft.com/en-us/windows/msix/package/sign-msix-package-guide
- https://secure.ssl.com/certificates/code-signing/buy
- https://www.ssl.com/guide/esigner-pricing-for-code-signing/
- https://www.electron.build/v26/docs/features/code-signing/code-signing-win/
