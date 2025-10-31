import { PeerId, Repo } from "@automerge/automerge-repo";
import { WebSocketClientAdapter } from "@automerge/automerge-repo-network-websocket";
import fs from "fs";
import { chalk } from "zx";

// --- CONFIGURATION ---
const URL = "ws://192.168.0.165:4321";

const STORE_URL_PATH = "./store-identity/store-url.txt";
// -------------------

async function main() {
    const storeDocUrlStr = fs.readFileSync(STORE_URL_PATH, 'utf-8');
    const docId = storeDocUrlStr.trim();

    console.log(chalk.blue(`Attempting to connect to: ${URL}`));
    console.log(chalk.blue(`Requesting document ID: ${docId}`));

    const repo = new Repo({
        network: [new WebSocketClientAdapter(URL)],
        peerId: "debug-client-" + Math.random().toString(36).substring(2) as PeerId,
    });

    try {
        const handle = await repo.find(docId as any);
        
        console.log("Waiting for document handle to be ready...");
        await handle.whenReady();

        console.log(chalk.green("\nSuccess! Document is ready."));
        console.log("Document content:", await handle.doc());

    } catch (e) {
        console.error(chalk.red("\nConnection failed:"), e);
    }
}

main();
