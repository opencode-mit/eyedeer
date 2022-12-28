import assert from "assert";
import { WebServer } from './WebServer';

async function main(): Promise<void> {
    const server: WebServer = new WebServer(8080);
    await server.start();
    assert(server.server !== undefined);
}

if (require.main === module) {
    void main();
}
