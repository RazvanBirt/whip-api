import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET ?? '';

export function verifyToken(token: string) {
    return jwt.verify(token, SECRET);
}
