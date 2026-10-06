// Configuración del Agendador. Ver README.md → "Puesta en marcha".
export default {
  // Pegá aquí el objeto firebaseConfig de tu proyecto de Firebase.
  // Mientras apiKey esté vacío, la app corre en MODO DEMO: los votos quedan solo en este navegador.
const firebaseConfig = {

  apiKey: "AIzaSyBUpMnO8InYhzYl477EdZFtAxtFCzMFYvA",

  authDomain: "agendador-839ba.firebaseapp.com",

  projectId: "agendador-839ba",

  storageBucket: "agendador-839ba.firebasestorage.app",

  messagingSenderId: "167658853163",

  appId: "1:167658853163:web:0c3a1a12a30e23d43f6b6e"

};


  // Clave para crear/cerrar votaciones (secretaría y presidencia). No es seguridad real: está a la vista en el código.
  claveAdmin: 'aematec',

  // Nombres de la junta: se muestran como botones para votar con un toque y para ver quién falta.
  miembros: [],
};
