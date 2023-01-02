import { User } from "../Common";
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
