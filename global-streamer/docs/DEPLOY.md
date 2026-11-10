# Deploy ke Firebase (cara mudah, dari PC Windows)

Projek Firebase: **landing-pages-dc993** (akaun mediapc2026@gmail.com).
Hosting site berasingan: **global-streamer-pc** (site lalai landing page lama TIDAK disentuh).
Link selepas deploy: https://global-streamer-pc.web.app

## Sekali sahaja
1. Pasang **Node.js LTS**: https://nodejs.org (pilih LTS, Next, Next, Finish).
2. Muat turun repo sebagai ZIP (log masuk GitHub dahulu), kemudian Extract:
   https://github.com/MediaPekaya/IbnuYazidProject/archive/refs/heads/ccr-1ea2e3ea-w1ovs5.zip
3. Buka folder `IbnuYazidProject-ccr-1ea2e3ea-w1ovs5\global-streamer`. Klik bar alamat, taip `cmd`, tekan Enter.

## Arahan (salin satu demi satu)
```
npm install -g firebase-tools
firebase login
firebase hosting:sites:create global-streamer-pc
firebase deploy --only firestore,hosting
```
* `firebase login`: pilih akaun **mediapc2026@gmail.com** dalam browser.
* Jika `sites:create` kata nama sudah digunakan, guna nama lain (cth `global-streamer-pc2`) dan ubah baris `"site"` dalam `firebase.json` kepada nama itu. Link menjadi `https://NAMA.web.app`.
* Jika kata site sudah wujud, abaikan dan teruskan arahan seterusnya.

## Kemas kini kemudian
Selepas ada versi baharu: muat turun ZIP semula, dalam folder `global-streamer` jalankan `firebase deploy --only hosting`.
