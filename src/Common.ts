export type Client = { id: string, name: string, client_id: string, client_secret: string, redirect_uri: string, image?: Uint8Array };
export type User = {
    id: string,
    email: string,
    hash: string,
    verified: boolean,
    emails: string[],
    names: string[],
    addresses: string[],
    grants: {
        client: {
            name: string,
            client_id: string,
            redirect_uri: string,
            image?: Uint8Array | null
        } | null,
        scopes: string[]
    }[],
    clients: {
        name: string,
        client_id: string,
        client_secret: string,
        redirect_uri: string,
        image: Uint8Array | null
    }[]
};

export const TOKEN_LENGTH = 256;
export const CODE_LENGTH = 16;
export const CLIENT_NAME_MAX = 40;
export const USERNAME_MAX = 40;
export const CLIENT_ID_LENGTH = 20;
export const CLIENT_SECRET_LENGTH = 40;
export const REDIRECT_URI_MAX = 60;
export const HASHED_PASSWORD_MAX = 60;

export const REMEMBER_ME_OPTIONS = { path: '/', httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 30 }; // 30 days

export enum InfoType {
    Email = "Email", Name = "Name", Address = "Address"
}