import { Client } from "../Common";
import e from "../../dbschema/edgeql-js";
import { DBClient } from "./Connect";

export async function getScopes(email: string, client_id: string): Promise<string[]> {
    const approval = await e.select(e.Approval, (approv) => ({
        scopes: true,
        user: user => ({
            filter: e.op(user.email, '=', email)
        }),
        client: client => ({
            filter: e.op(client.client_id, '=', client_id)
        })
    })).run(DBClient);
    if (approval.length == 0) return [];
    return approval[0]!.scopes;
}

export async function addApproval(email: string, client_id: string, scopes: string[]): Promise<boolean> {
    const existingApprovals = await e.select(e.Approval, (approv) => ({
        scopes: true,
        user: user => ({
            filter: e.op(user.email, '=', email)
        }),
        client: client => ({
            filter: e.op(client.client_id, '=', client_id)
        })
    })).run(DBClient);
    if (existingApprovals.length === 0) {
        const approval = await e.insert(e.Approval, {
            user: e.select(e.User, user => ({
                filter_single: {
                    email: email
                }
            })),
            client: e.select(e.Application, app => ({
                filter_single: {
                    client_id: client_id
                }
            })),
            scopes: scopes
        }).unlessConflict().run(DBClient);
        if (approval === null) return false;
        return true;
    }
    const approval = await e.update(e.Approval, (approv) => ({
        user: e.select(e.User, user => ({
            filter_single: {
                email: email
            }
        })),
        client: e.select(e.Application, app => ({
            filter_single: {
                client_id: client_id
            }
        })),
        set: {
            scopes: scopes
        }
    })).run(DBClient);
    if (approval === null) return false;
    return true;
}