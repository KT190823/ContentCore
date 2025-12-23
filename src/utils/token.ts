import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-me';

export const tokenHelper = {
    generateToken: (user: any) => {
        const payload = {
            ...user,
            generatedAt: Date.now()
        };
        // Generate token with 7 days expiration
        return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    },

    verifyToken: (token: string) => {
        try {
            return jwt.verify(token, JWT_SECRET);
        } catch (error) {
            return null;
        }
    }
};
