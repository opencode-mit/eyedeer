import crypto from 'crypto';

export const getUid = (length: number): string => {
    return crypto.randomBytes(length / 2).toString('hex');
};

const mapping = new Map<string, string>([
    ['email', 'personal'],
    ['name', 'personal']
]);

export const formatScopes = (scopeString: string) => {
    const scopes = scopeString.split(" ");
    const result = new Map<string, Array<string>>();
    for (const scope of scopes) {
        const arr = result.get(mapping.get(scope)!);
        if (arr === undefined) {
            result.set(mapping.get(scope)!, [scope]);
        } else {
            arr.push(scope);
        }
    }
    return Object.fromEntries(result);
}