import crypto from 'crypto';

export const getUid = (length: number) => {
    return crypto.randomBytes(length / 2).toString('hex');
};