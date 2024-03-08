#!/usr/bin/env zx

import { $, argv, question } from 'zx';

// Dummy functions as placeholders for the real implementations
function addDisk(engine: string, disk: string): void {
    console.log(`Adding disk '${disk}' to engine '${engine}'.`);
}

function startApp(app: string): void {
    console.log(`Starting application '${app}'.`);
}

function addNetwork(engine: string, face: string, ip: string, netmask: string): void {
    console.log(`Adding network interface '${face}' with IP '${ip}' and netmask '${netmask}' to engine '${engine}'.`);
}

// Command interpreter function
async function commandInterpreter(): Promise<void> {
    // Check if "-i" option is present
    if (!(argv.i || argv.interactive)) {
        console.log("This script should be run in interactive mode using the '-i' option.");
        process.exit(1);
    }

    // Interactive command reading loop
    while (true) {
        const commandLine = await question("Enter command: ");

        if (commandLine === "exit") {
            console.log("Exiting command interpreter.");
            break;
        }

        const [command, ...args] = commandLine.split(" ");

        switch (command) {
            case "addDisk":
                if (args.length >= 2) {
                    addDisk(args[0], args[1]);
                } else {
                    console.log("Insufficient arguments for addDisk. Usage: addDisk <engine> <disk>");
                }
                break;
            case "startApp":
                if (args.length >= 1) {
                    startApp(args[0]);
                } else {
                    console.log("Insufficient arguments for startApp. Usage: startApp <app>");
                }
                break;
            case "addNetwork":
                if (args.length >= 4) {
                    addNetwork(args[0], args[1], args[2], args[3]);
                } else {
                    console.log("Insufficient arguments for addNetwork. Usage: addNetwork <engine> <face> <ip> <netmask>");
                }
                break;
            default:
                console.log(`Unknown command: ${command}`);
        }
    }
}

// Execute the command interpreter
commandInterpreter();
