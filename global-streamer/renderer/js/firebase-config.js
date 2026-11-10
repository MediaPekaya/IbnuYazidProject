/* Global Streamer - konfigurasi Firebase (projek: global-streamer).
 * Kunci web Firebase BUKAN rahsia (ia dihantar kepada setiap pelayar). Keselamatan dikawal oleh
 * Firestore rules dan Authentication, bukan oleh kunci ini. */
(function () {
  'use strict';
  window.GS = window.GS || {};
  GS.config = {
    firebase: {
      apiKey: 'AIzaSyAtmju3zcjst2ElnAXLZOuI20dQpN_ckag',
      authDomain: 'global-streamer.firebaseapp.com',
      projectId: 'global-streamer',
      appId: '1:124785984085:web:855c4cf261847ff3760adc',
      messagingSenderId: '124785984085',
    },
    sdkVersion: '10.14.1',

    /* Dasar akses. Buat masa ini app TERUS BOLEH DIGUNA tanpa daftar atau log masuk (authEnabled: false).
     * Untuk menghidupkan log masuk semula, tukar authEnabled kepada true. Tiada senarai UID: sesiapa yang ada akaun boleh log masuk. */
    authEnabled: false, // false = tiada log masuk, tiada pemuatan SDK Firebase, tiada chip pengguna
    requireLogin: true, // paparkan skrin log masuk sebelum app boleh digunakan
    allowSignup: true, // benarkan daftar akaun baharu (emel + kata laluan)
    allowGuest: true, // butang "Teruskan sebagai tetamu". Tukar kepada false sebelum menjual.
    requireLicense: false, // jika true, hanya pengguna dengan licenses/{uid}.active = true boleh guna app
  };
})();
