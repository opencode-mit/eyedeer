const tokens = new Map<string, { userId: string, clientId: string, scope: string }>();

export const find = (key: string) => {
    return tokens.get(key);
};

export const findByUserIdAndClientId = (userId: string, clientId: string): string | undefined => {
    for (const token in tokens) {
        if (tokens.get(token)!.userId === userId && tokens.get(token)!.clientId === clientId) return token;
    }
    return undefined;
};

export const save = (token: string, userId: string, clientId: string, scope: string) => {
    tokens.set(token, { userId, clientId, scope });
};

export const removeByUserIdAndClientId = (userId: string, clientId: string): boolean => {
    for (const token in tokens) {
        if (tokens.get(token)!.userId === userId && tokens.get(token)!.clientId === clientId) {
            tokens.delete(token);
            return true;
        }
    }
    return false;
};