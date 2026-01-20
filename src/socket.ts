import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { Server as HTTPServer } from 'http';
import { verifyToken } from './utils/verifyToken';

export function setupSocketIO(server: HTTPServer) {
    const io = new Server(server, {
        cors: {
            origin: '*', // adjust this for production
        },
    });

    // Middleware to verify JWT
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;

        if (!token) {
            console.warn('Socket connection rejected: No token provided');
            return next(new Error('Unauthorized: No token'));
        }

        try {
            const decoded = verifyToken(token);
            socket.data.user = decoded;
            return next();
        } catch (err) {
            console.warn('Socket connection rejected: Invalid token');
            return next(new Error('Unauthorized: Invalid token'));
        }
    });

    // Event handlers
    io.on('connection', (socket) => {
        const user = socket.data.user;
        console.log(`Socket connected: ${socket.id} as ${user?.email}`);

        socket.on('poll:join', (pollId) => {
            socket.join(`poll-${pollId}`);
            console.log(`User ${user?.email} joined room poll-${pollId}`);
        });

        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });

    return io;
}
