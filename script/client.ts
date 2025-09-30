#!/usr/bin/env zx
import { $, question, chalk, cd, argv, fs } from 'zx';
import * as readline from 'readline';
import { createClientStore, Store } from '../src/data/Store.js';
import { handleCommand } from '../src/utils/commandHandler.js';

import pack from '../package.json' with { type: "json" }
//import { readDefaults, Defaults } from '../src/utils/readDefaults.js'
import { config } from '../src/data/Config.js'

import { DocumentId, PeerId } from '@automerge/automerge-repo';
import { localEngineId } from '../src/data/Engine.js';

// **********************
// Command-line arguments
// **********************

// Check for the help flag and print usage if help is requested
if (argv.h || argv.help) {
    console.log(`Starts a client process with a text-based command interface`)
    console.log(`Usage: client [options]`);
    // We have help, version, engine, network and port options
    console.log(`Options:`)
    console.log(`  -h, --help              display help for command`)  
    console.log(`  -v, --version           output the version number`)
    // console.log(`  -n, --network <string>  the network we want to join (default: ${defaults.network})`)
    console.log(`  -e, --engine <string>   the engine (address) we want to connect to (default: ${"127.0.1:1234"})`)
    //console.log(`  -i, --id <string>   the engine (id) we want to connect to (default: ${defaults.engineId})`)
    console.log(``)
    process.exit(0)
}

// Check for the version flag and print the version if requested
if (argv.v || argv.version) {
    console.log(`Version: ${pack.version}`)
    process.exit(0)
}


// ************************
// Connection to an engine
// ************************

const defaults  = config.defaults
const engineAddress = argv.e || argv.engine || "127.0.0.1:1234"

const serverUrl = `ws://${engineAddress}`
const clientPeerId = `client-on-${localEngineId}` as PeerId // Unique identifier for the client
const STORE_URL_PATH = "./store/store-url.txt"
const storeDocUrlStr = fs.readFileSync(STORE_URL_PATH, 'utf-8');
const storeDocId = storeDocUrlStr.replace('automerge:', '') as DocumentId;
console.log(`Using document ID: ${storeDocId}`)
// const storeUrlPath = "./"+config.settings.storeIdentityFolder+"/store-url.txt"
const storeHandle = await createClientStore(serverUrl, clientPeerId, storeDocId);


const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'Enter command: '
});

let commandHistory: string[] = [];


readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) process.stdin.setRawMode(true);

rl.prompt();

rl.on('line', (line) => {
    const trimmedLine = line.trim();
    
    if (trimmedLine === 'exit') {
        rl.close();
        return;
    }

    if (trimmedLine) {
        commandHistory.push(trimmedLine); // Save the command to history
        handleCommand(storeHandle, 'engine', trimmedLine); // Process the command
    }

    rl.prompt();
}).on('close', () => {
    console.log('Exiting command interpreter.');
    process.exit(0);
});
