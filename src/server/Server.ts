import assert from "assert";
import dotenv from 'dotenv';
import { configure } from "../config/Mailer";
import { connect } from "../db/Connect";
import { WebServer } from './WebServer';

async function main(): Promise<void> {
    dotenv.config();
    await connect();
    await configure();
    const server: WebServer = new WebServer(8080);
    await server.start();
    assert(server.server !== undefined);
}

if (require.main === module) {
    void main();
}
