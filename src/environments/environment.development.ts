export const environment = {
  production: false,
  apiUrl: 'https://elm.runasp.net/',
  googleDrive: {
    clientId: '754237899761-0jc10q5i1fefpesrv0ped5o5nmfltcim.apps.googleusercontent.com',
    apiKey: 'AIzaSyD-xYLloxnDhTBqndiHC5htdLYZ0cB70ng',
    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
    scopes: 'https://www.googleapis.com/auth/drive.appdata',
  },
  firebaseConfig: {
    apiKey: 'AIzaSyALWzgKIRaXGq_jQCXWSF2vybBLr18r4uA',
    authDomain: 'elm-platform.firebaseapp.com',
    projectId: 'elm-platform',
    storageBucket: 'elm-platform.firebasestorage.app',
    messagingSenderId: '927216205589',
    appId: '1:927216205589:web:1d0e1d6529da47e7af731c',
    measurementId: 'G-KGP3VQKVD7',
  },
};
