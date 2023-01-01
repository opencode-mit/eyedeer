export type Client = { id: string, name: string, clientId: string, clientSecret: string, redirect_uri: string, image: string };
export type User = { id: string, username: string, password: string, profile: {name?: string, email?: string}, apps: Map<string, Set<string>> };

export const TOKEN_LENGTH = 256;
export const CODE_LENGTH = 16;
export const CLIENT_NAME_MAX = 40;
export const USERNAME_MAX = 40;
export const CLIENT_ID_LENGTH = 20;
export const CLIENT_SECRET_LENGTH = 20;
export const REDIRECT_URI_MAX = 60;
export const HASHED_PASSWORD_MAX = 60;