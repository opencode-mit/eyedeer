import { Client } from "../Common";
import e from "../../dbschema/edgeql-js";
import { DBClient } from "./Connect";

export async function findByClientId (clientId: string): Promise<Client | undefined> {
    const client = await e.select(e.Application, ()=>({
        ...e.Application['*'],
        filter_single: {client_id: clientId}
    })).run(DBClient);
    if (client === null) return undefined;
    const image = client.image;
    if (image === null) {
        return {
            id: client.id,
            name: client.name,
            redirect_uri: client.redirect_uri,
            client_id: client.client_id,
            client_secret: client.client_secret
        }
    }
    return {
        id: client.id,
        name: client.name,
        image,
        redirect_uri: client.redirect_uri,
        client_id: client.client_id,
        client_secret: client.client_secret
    } 
};
