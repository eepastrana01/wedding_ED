import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { initDatabase } from './config/database.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Main API routes
app.use('/api', apiRouter);

// Global error handler
app.use(errorHandler);

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

startServer();
