const codes = new Map<string, { clientId: string, redirectUri: string, userId: string, scope: string }>();

export const find = (key: string): { clientId: string, redirectUri: string, userId: string, scope: string } | undefined => {
    if (codes.get(key)) return codes.get(key);
    return undefined;
};

export const save = (code: string, clientId: string, redirectUri: string, userId: string, scope: string) => {
    codes.set(code, { clientId, redirectUri, userId, scope });
};
