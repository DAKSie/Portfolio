const _getEnv = (key) => {
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key];
  } catch (e) {}
  try {
    if (import.meta && import.meta.env && import.meta.env[key]) return import.meta.env[key];
  } catch (e) {}
  try {
    if (typeof window !== 'undefined' && window.__ENV__ && window.__ENV__[key]) return window.__ENV__[key];
  } catch (e) {}
  return undefined;
};

export const firebaseConfig = {
  apiKey: _getEnv('FIREBASE_API_KEY') || _getEnv('VITE_FIREBASE_API_KEY') || '<YOUR_FIREBASE_API_KEY>',
  authDomain: _getEnv('FIREBASE_AUTH_DOMAIN') || _getEnv('VITE_FIREBASE_AUTH_DOMAIN') || '<YOUR_FIREBASE_AUTH_DOMAIN>',
  databaseURL: _getEnv('FIREBASE_DATABASE_URL') || _getEnv('VITE_FIREBASE_DATABASE_URL') || '<YOUR_FIREBASE_DATABASE_URL>',
  projectId: _getEnv('FIREBASE_PROJECT_ID') || _getEnv('VITE_FIREBASE_PROJECT_ID') || '<YOUR_FIREBASE_PROJECT_ID>',
  storageBucket: _getEnv('FIREBASE_STORAGE_BUCKET') || _getEnv('VITE_FIREBASE_STORAGE_BUCKET') || '<YOUR_FIREBASE_STORAGE_BUCKET>',
  messagingSenderId: _getEnv('FIREBASE_MESSAGING_SENDER_ID') || _getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID') || '<YOUR_FIREBASE_MESSAGING_SENDER_ID>',
  appId: _getEnv('FIREBASE_APP_ID') || _getEnv('VITE_FIREBASE_APP_ID') || '<YOUR_FIREBASE_APP_ID>',
  measurementId: _getEnv('FIREBASE_MEASUREMENT_ID') || _getEnv('VITE_FIREBASE_MEASUREMENT_ID') || '<YOUR_FIREBASE_MEASUREMENT_ID>'
};