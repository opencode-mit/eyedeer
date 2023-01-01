import { User } from "../Common";

const users: Array<User> = [
    { id: '1', username: 'bob', password: 'secret', profile: { name: 'Bob Smith', email: 'bobsmit@gmail.com' }, apps: new Map([['abc123', new Set(['email', 'name'])], ['xyz123', new Set(['email'])]]) },
    { id: '2', username: 'joe', password: 'password', profile: { name: 'Joe Davis' }, apps: new Map([['abc123', new Set(['email'])]]) },
];

export const findById = (id: string): User | undefined => {
    for (let i = 0, len = users.length; i < len; i++) {
        if (users[i]!.id === id) return users[i];;
    }
    return undefined;
};

export const findByUsername = (username: string): User | undefined => {
    for (let i = 0, len = users.length; i < len; i++) {
        if (users[i]!.username === username) return users[i];
    }
    return undefined;
};

export const addAppWithScopes = (id: string, clientId: string, scopes: Set<string>) => {
    for (const user of users) {
        if (user.id === id) {
            const existingScopes = user.apps.get(clientId);
            if (existingScopes !== undefined) {
                for (const scope of scopes) {
                    existingScopes.add(scope);
                }
            } else {
                user.apps.set(clientId, new Set([...scopes]));
            }
            return;
        }
    }
    throw new Error("User not found.");
}

export const checkScopes = (id: string, clientId: string, scopes: Set<string>): boolean => {
    for (const user of users) {
        if (user.id === id) {
            const existingScopes = user.apps.get(clientId);
            if (existingScopes !== undefined) {
                for (const scope of scopes) {
                    if (!existingScopes.has(scope)) return false;
                }
                return true;
            }
            return false;
        }
    }
    return false;
}

export const getCurrentApprovedScopes = (id: string, clientId: string): Set<string> => {
    for (const user of users) {
        if (user.id === id) {
            const existingScopes = user.apps.get(clientId);
            if (existingScopes === undefined) return new Set();
            return new Set([...existingScopes]);
        }
    }
    return new Set();
}