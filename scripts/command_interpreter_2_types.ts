#!/usr/bin/env zx

import { $, question } from 'zx';

// Define a type for the argument types we want to support
type ArgumentType = 'string' | 'number' | 'object';

// Define a general interface for argument descriptors
interface ArgumentDescriptor {
    type: ArgumentType;
    // Optionally define further details for object types, like interface definitions
}

// Define a command interface that describes a command and its expected arguments
interface Command {
    name: string;
    execute: (...args: any[]) => void;
    args: ArgumentDescriptor[];
}

// Example function implementations
function addDisk(engine: string, disk: string): void {
    console.log(`Adding disk '${disk}' to engine '${engine}'.`);
}

function startApp(app: string, priority: number): void {
    console.log(`Starting application '${app}' with priority ${priority}.`);
}

function addNetwork(engine: string, face: string, ip: string, netmask: string): void {
    console.log(`Adding network interface '${face}' with IP '${ip}' and netmask '${netmask}' to engine '${engine}'.`);
}

// Command registry
const commands: Command[] = [
    {
        name: "addDisk",
        execute: addDisk,
        args: [{type: "string"}, {type: "string"}],
    },
    {
        name: "startApp",
        execute: startApp,
        args: [{type: "string"}, {type: "number"}],
    },
    {
        name: "addNetwork",
        execute: addNetwork,
        args: [{type: "string"}, {type: "string"}, {type: "string"}, {type: "string"}],
    },
];

// Utility function to convert string to a specific type
function convertToType(str: string, type: ArgumentType): any {
    switch (type) {
        case "number":
            const num = parseFloat(str);
            if (isNaN(num)) throw new Error("Cannot convert to number");
            return num;
        case "string":
            return str;
        case "object":
            // Placeholder for object conversion, implement based on specific needs
            try {
                return JSON.parse(str);
            } catch {
                throw new Error("Cannot convert to object");
            }
        default:
            throw new Error("Unsupported type");
    }
}

// Enhanced command interpreter function
async function commandInterpreter(): Promise<void> {
    if (!process.argv.includes("-i")) {
        console.log("This script should be run in interactive mode using the '-i' option.");
        process.exit(1);
    }

    while (true) {
        try {
            let commandLine = await question("Enter command: ");
            commandLine = commandLine.trim().replace(/\s+/g, ' ');

            if (commandLine === "exit") {
                console.log("Exiting command interpreter.");
                break;
            }

            const [commandName, ...stringArgs] = commandLine.split(" ");
            const command = commands.find(cmd => cmd.name === commandName);

            if (!command) {
                console.log(`Unknown command: ${commandName}`);
                continue;
            }

            const args = stringArgs.map((arg, index) => {
                if (index >= command.args.length) throw new Error("Too many arguments");
                return convertToType(arg, command.args[index].type);
            });

            if (args.length < command.args.length) throw new Error("Insufficient arguments");

            command.execute(...args);
        } catch (error) {
            console.error(`Error: ${error.message}`);
            console.log("Please try again.");
        }
    }
}

commandInterpreter();
