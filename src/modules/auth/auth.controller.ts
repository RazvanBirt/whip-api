
import { NextFunction, Request, RequestHandler, Response } from 'express';
import { registerUser, loginUser } from './auth.service';

export const register: RequestHandler = async (req: any, res: any) => {
    const { UserName, Email, Password } = req.body;

    try {
        const result = await registerUser(UserName, Email, Password);

        if (!result.success) {
            res.status(400).json({ error: result.error });
            return;
        }

        res.status(200).json({ token: result.token });
        return;
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
};

export const login: RequestHandler = async (req: any, res: any) => {
    const { Email, Password } = req.body;

    try {
        const result = await loginUser(Email, Password);

        if (!result.success) {
            res.status(400).json({ error: result.error });
            return;
        }

        res.status(200).json({ token: result.token });
        return;
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
};
