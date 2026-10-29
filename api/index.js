import app from '../server/src/app.js';
import { initDatabase } from '../server/src/config/database.js';

let dbInitPromise = null;

function ensureDbInitialized() {
  if (!dbInitPromise) {
    dbInitPromise = initDatabase().catch((err) => {
      dbInitPromise = null;
      console.error('Error inicializando base de datos en Vercel:', err);
    });
  }
  return dbInitPromise;
}

export default async function handler(req, res) {
  // Inicialización perezosa deduplicada (evita ejecuciones concurrentes en cold-start)
  await ensureDbInitialized();

  // Delegar la petición a Express
  return app(req, res);
}
