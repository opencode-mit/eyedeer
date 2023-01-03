import { Client, CLIENT_ID_LENGTH, CLIENT_SECRET_LENGTH, User } from "../Common";
import e from "../../dbschema/edgeql-js";
import { DBClient } from "./Connect";
import * as utils from '../util/Utils';

export async function findByClientId(clientId: string): Promise<Client | undefined> {
    const client = await e.select(e.Application, () => ({
        ...e.Application['*'],
        filter_single: { client_id: clientId }
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

export async function addNewClient(owner: User, name: string, redirect_uri: string): Promise<void> {
    const client_id = utils.getUid(CLIENT_ID_LENGTH);
    const client_secret = utils.getUid(CLIENT_SECRET_LENGTH);
    const image = await utils.getProfilePicture(client_id);
    const { id } = await e.insert(e.Application, {
        name,
        client_id,
        client_secret,
        redirect_uri,
        image,
        owner: e.select(e.User, user => ({
            filter_single: e.op(user.email, '=', owner.email)
        }))
    }).run(DBClient);
}

export async function updateClient(client_id: string, owner: User, name: string, redirect_uri: string): Promise<void> {
    await e.update(e.Application, app => ({
        filter_single: {client_id},
        filter: e.op(app.owner.email, '=', owner.email),
        set: {
            name: name,
            redirect_uri: redirect_uri
        }
    })).run(DBClient);
}