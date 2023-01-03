import { InfoType, User } from "../Common";
import e from "../../dbschema/edgeql-js";
import { DBClient } from "./Connect";

export const findByEmail = async (email: string): Promise<User | undefined> => {
    const user = await e.select(e.User, ()=>({
        ...e.User['*'],
        grants: {
            client: {
                name: true,
                client_id: true,
                redirect_uri: true,
                image: true,
            },
            scopes: true
        },
        clients: {
            name: true,
            client_id: true,
            client_secret: true,
            redirect_uri: true,
            image: true,
        },
        filter_single: {email: email}
    })).run(DBClient);
    if (user) return user;
    return undefined;
};

export const findById = async (id: string): Promise<User | undefined> => {
    const user = await e.select(e.User, ()=>({
        ...e.User['*'],
        grants: {
            client: {
                name: true,
                client_id: true,
                redirect_uri: true,
                image: true,
            },
            scopes: true
        },
        clients: {
            name: true,
            client_id: true,
            client_secret: true,
            redirect_uri: true,
            image: true,
        },
        filter_single: {id: id}
    })).run(DBClient);
    if (user) return user;
    return undefined;
};

export async function addInfo(email: string, info: InfoType, value: string): Promise<void> {
    await e.update(e.User, user => ({
        filter_single: {email: email},
        set: {
            ...(info === InfoType.Email) && {emails: {"+=": value}},
            ...(info === InfoType.Name) && {names: {"+=": value}},
            ...(info === InfoType.Address) && {addresses: {"+=": value}},
        }
    })).run(DBClient);
}

export async function updateInfo(email: string, info: InfoType, previous: string, value: string): Promise<void> {
    await e.update(e.User, user => ({
        filter_single: {email: email},
        set: {
            ...(info === InfoType.Email) && {emails: {"-=": previous}},
            ...(info === InfoType.Name) && {names: {"-=": previous}},
            ...(info === InfoType.Address) && {addresses: {"-=": previous}},
        }
    })).run(DBClient);
    await e.update(e.User, user => ({
        filter_single: {email: email},
        set: {
            ...(info === InfoType.Email) && {emails: {"+=": value}},
            ...(info === InfoType.Name) && {names: {"+=": value}},
            ...(info === InfoType.Address) && {addresses: {"+=": value}},
        }
    })).run(DBClient);
}

export async function deleteInfo(email: string, info: InfoType, previous: string): Promise<void> {
    await e.update(e.User, user => ({
        filter_single: {email: email},
        set: {
            ...(info === InfoType.Email) && {emails: {"-=": previous}},
            ...(info === InfoType.Name) && {names: {"-=": previous}},
            ...(info === InfoType.Address) && {addresses: {"-=": previous}},
        }
    })).run(DBClient);
}