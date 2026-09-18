import app from './app.js';
import { initDatabase } from './config/database.js';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`✨ Servidor de BodaED ejecutándose en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error fatal al arrancar el servidor:', error);
    process.exit(1);
  }
}

// Start standalone server if run directly (local development)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  startServer();
}

export default app;
