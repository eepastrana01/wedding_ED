import app from '../server/src/app.js';
import { initDatabase } from '../server/src/config/database.js';

let isDbInitialized = false;

export default async function handler(req, res) {
  // Inicialización perezosa de base de datos / migraciones en ambiente serverless
  if (!isDbInitialized) {
    try {
      await initDatabase();
      isDbInitialized = true;
    } catch (err) {
      console.error('Error inicializando base de datos en Vercel:', err);
    }
  }

  // Delegar la petición a Express
  return app(req, res);
}
