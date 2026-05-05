import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import http from 'http';
import cors from 'cors';
import routes from './routes/index';
import { setupSocketIO } from './socket';
import { checkDatabaseConnection, isDatabaseConnected } from './config/prisma';

const app = express();
const server = http.createServer(app);

const io = setupSocketIO(server);
app.set('io', io);

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.originalUrl}`);
  next();
});

app.use('/api', routes);

const PORT = process.env.PORT || 4000;

app.get('/health', (_req, res) => {
  res.status(200).json({
    api: 'ok',
    database: isDatabaseConnected ? 'connected' : 'disconnected',
  });
});

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, async () => {
    console.log(`Server running at http://localhost:${PORT}`);

    const dbConnected = await checkDatabaseConnection();

    if (!dbConnected) {
      console.warn(
        '[STARTUP WARNING] API started without a database connection.'
      );
    }
  });
}
