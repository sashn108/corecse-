// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBYt5edIyXZMABojoXo60Esm-qHl3PvloI",
  authDomain: "corecse-gate.firebaseapp.com",
  projectId: "corecse-gate",
  storageBucket: "corecse-gate.firebasestorage.app",
  messagingSenderId: "59644077295",
  appId: "1:59644077295:web:65ad221dbef0a28c19e71a",
  measurementId: "G-4DX2598WNJ"
};

// Firebase Auth Module
export async function login(email, password) {
  return { success: true, user: { email } };
}

export async function signup(email, password, name) {
  return { success: true, user: { email, name } };
}

export function getCurrentUser() {
  return null;
}

export function onAuthChange(callback) {
  callback(null);
}
