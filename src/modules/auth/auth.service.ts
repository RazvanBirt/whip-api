import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { PrismaClient } from '../../generated/prisma/client';

import { prisma } from '../../config/prisma';
const SECRET = process.env.JWT_SECRET ?? '';

export const registerUser = async (UserName: string, Email: string, Password: string) => {
    const existingUser = await prisma.user.findUnique({ where: { email: Email } });
    if (existingUser) {
        return { success: false, error: 'Email already registered' };
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(Password, salt);

    const user = await prisma.user.create({
        data: {
            email: Email,
            passwordHash: hashedPassword,
            // createdat: 'system',
            // modifiedBy: 'system',
        },
    });

    const token = jwt.sign({ id: user.id, email: user.email }, SECRET, { expiresIn: '1h' });

    return { success: true, token };
};

export const loginUser = async (Email: string, Password: string) => {
    const user = await prisma.user.findUnique({ where: { email: Email } });
    if (!user) {
        return { success: false, error: 'Invalid credentials' };
    }

    const match = await bcrypt.compare(Password, user.passwordHash);
    if (!match) {
        return { success: false, error: 'Invalid credentials' };
    }
    const token = jwt.sign({ id: user.id, email: user.email }, SECRET, { expiresIn: '1h' });

    return { success: true, token };
};
