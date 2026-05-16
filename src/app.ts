import express from 'express';
import cors from 'cors';
import routes from './routes/index';
import { isDatabaseConnected } from './config/prisma';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use((req, _res, next) => {
    console.log(`[${req.method}] ${req.originalUrl}`);
    next();
  });

  app.get('/health', (_req, res) => {
    res.status(200).json({
      api: 'ok',
      database: isDatabaseConnected ? 'connected' : 'disconnected',
    });
  });

  app.use('/api', routes);

  return app;
}

export default createApp;