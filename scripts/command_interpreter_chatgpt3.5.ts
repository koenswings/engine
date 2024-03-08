#!/usr/bin/env zx
import * as readline from 'readline';
import { $ } from 'zx';

// Define types for commands and their arguments
type Command = "addDisk" | "startApp" | "addNetwork";

type CommandArguments = {
    addDisk: [engine: string, disk: string],
    startApp: [app: string],
    addNetwork: [engine: string, face: string, ip: string, netmask: string]
};

// Placeholder:  You'll need to provide the actual implementations 
function addDisk(engine: string, disk: string) { 
    console.log('addDisk implementation (not yet provided)', engine, disk);
  }
  
  function startApp(app: string) { 
    console.log('startApp implementation (not yet provided)', app);
  }
  
  function addNetwork(engine: string, face: string, ip: string, netmask:string) { 
    console.log('addNetwork implementation (not yet provided)', engine, face, ip, netmask);
  }


// Command interpreter function
const interpretCommand = (command: string) => {
    const args = command.trim().split(/\s+/);
    const [action, ...params] = args as [Command, ...string[]];

    switch (action) {
        case 'addDisk':
            if (params.length !== 2) {
                console.error('Usage: addDisk <engine> <disk>');
                break;
            }
            addDisk(...params as CommandArguments['addDisk']);
            break;

        case 'startApp':
            if (params.length !== 1) {
                console.error('Usage: startApp <app>');
                break;
            }
            startApp(...params as CommandArguments['startApp']);
            break;

        case 'addNetwork':
            if (params.length !== 4) {
                console.error('Usage: addNetwork <engine> <face> <ip> <netmask>');
                break;
            }
            addNetwork(...params as CommandArguments['addNetwork']);
            break;

        default:
            console.error(`Unknown command: ${action}`);
    }
};

// Main function
const main = async () => {
    if (process.argv.includes('-i')) {
        console.log('Interactive mode. Enter commands or type "exit" to quit.');
        while (true) {
            const command = await $`read -p "> " cmd && echo $cmd`;
            const input = command.stdout.trim();
            if (input === 'exit') {
                console.log('Exiting...');
                break;
            }
            interpretCommand(input);
        }
    } else {
        console.error('Usage: ./script.ts -i');
        process.exit(1);
    }
};

main().catch((err) => {
    console.error('An error occurred:', err);
    process.exit(1);
});
