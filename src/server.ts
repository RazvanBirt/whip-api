import 'dotenv/config';
import http from 'http';
import { createApp } from './app';
import { setupSocketIO } from './socket';
import { checkDatabaseConnection, prisma } from './config/prisma';

const PORT = process.env.PORT || 4000;

async function main() {
    const app = createApp();

    const server = http.createServer(app);

    const io = setupSocketIO(server);
    app.set('io', io);

    const dbConnected = await checkDatabaseConnection();

    if (!dbConnected) {
        throw new Error('Database connection failed. API will not start.');
    }

    server.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });

    function shutdown(signal: string) {
        console.log(`[SERVER] Received ${signal}. Shutting down...`);

        server.close(async () => {
            console.log('[SERVER] HTTP server closed.');

            if (prisma) {
                await prisma.$disconnect();
                console.log('[DATABASE] Prisma disconnected.');
            }

            process.exit(0);
        });
    }

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((error) => {
    console.error('[SERVER] Failed to start.');
    console.error(error);
    process.exit(1);
});