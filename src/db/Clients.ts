import { Client } from "../Types";

const clients: Array<Client> = [
    { id: '1', name: 'Samplr', clientId: 'abc123', clientSecret: 'ssh-secret' },
    { id: '2', name: 'Samplr2', clientId: 'xyz123', clientSecret: 'ssh-password' },
];
  
export function findById (id: string): Client | undefined {
    for (let i = 0, len = clients.length; i < len; i++) {
        if (clients[i]!.id === id) return clients[i];
    }
    return undefined;
};

export function findByClientId (clientId: string): Client | undefined {
    for (let i = 0, len = clients.length; i < len; i++) {
        if (clients[i]!.clientId === clientId) return clients[i];
    }
    return undefined;
};
