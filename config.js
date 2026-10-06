// Configuración del Agendador. Ver README.md → "Puesta en marcha".
export default {
  // firebaseConfig del proyecto. Si apiKey está vacío, la app corre en MODO DEMO (votos solo en este navegador).
  // La apiKey de Firebase no es secreta; la seguridad está en las reglas (firestore.rules).
  firebase: {
    apiKey: 'AIzaSyBUpMnO8InYhzYl477EdZFtAxtFCzMFYvA',
    authDomain: 'agendador-839ba.firebaseapp.com',
    projectId: 'agendador-839ba',
    storageBucket: 'agendador-839ba.firebasestorage.app',
    messagingSenderId: '167658853163',
    appId: '1:167658853163:web:0c3a1a12a30e23d43f6b6e',
  },

  // Cuenta de Firebase Authentication de la administración. La clave es la contraseña de esta cuenta:
  // vive en Firebase, no en el código. (En modo demo cualquier clave sirve.)
  correoAdmin: 'admin@aematec.app',

  // Lista inicial de la junta. Desde el panel de admin se edita y se guarda en Firestore (config/junta).
  miembros: ['Angelo', 'Jennifer', 'Josué', 'Daniela', 'Penélope', 'Alejandro', 'Randall', 'Kendall'],
};
