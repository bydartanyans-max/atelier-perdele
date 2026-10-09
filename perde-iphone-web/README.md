# Atelier Perdele iPhone web app

Static Romanian order app for Safari and Home Screen use. Includes the approved curtain calculations, PDF form, manual products, customer data, advance/balance, revisions, backups, and confirmed permanent order deletion.

Production access is public through Sites; no sign-in is required. Customer orders remain in browser-local storage; there is no database or automatic synchronization with Android or desktop. No customer records, uploaded shop logos, or authentication secrets are included in this source.

Add the published HTTPS address to the iPhone Home Screen using Safari's share menu, then open the new icon online once. Start entering records or restore a JSON backup in that Home Screen instance. Safari and Home Screen storage may differ. Use the same icon consistently and export periodic backups; clearing website data or removing the app can lose local data.

The service worker caches only the app shell and icons after a successful authenticated load. Authentication endpoints are excluded. Offline cache is a convenience and may be evicted by the browser. After an online launch, WebKit tests verified an offline reload with saved records and offline deletion. Actual iPhone/AirPrint behavior still requires device testing.

Printing opens the Romanian form in a separate window. In iPhone's print interface use the preview/share controls to save a PDF or send it. Allow pop-ups if the form does not open.

The published app includes apple-touch icons, viewport safe-area support and a standalone web manifest. The dist directory is self-contained. The optional prepare.cjs refreshes it from the adjacent project's standalone HTML; PNG icons are generated with perde-mobile/tests/pwa-icons.mjs. preview.cjs serves localhost:8092 for QA only.

Validation: WebKit at mobile size passed orders, m²/accessories, revisions, PDF form window, JSON export/restore, deletion cancel/confirm, persistent reload. A separate iPhone 13 viewport test passed service-worker/offline startup and saved-order deletion. This is not a test on physical iPhone hardware.
