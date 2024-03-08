#!/usr/bin/env zx
import { $, question } from 'zx';
import * as readline from 'readline';

// Generalized argument types
type ArgumentType = 'string' | 'number' | 'object';

// Updated FieldSpec to support multiple types
interface FieldSpec {
    type: 'number' | 'string'; // Extend this as needed
}

interface ObjectSpec {
    [key: string]: FieldSpec;
}

// Updated ArgumentDescriptor to include ObjectSpec
interface ArgumentDescriptor {
    type: ArgumentType;
    objectSpec?: ObjectSpec;
}

// Interface for commands
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

function processCoordinates(coords: { x: number; y: number }): void {
    console.log(`Processing coordinates: x=${coords.x}, y=${coords.y}`);
}

function processMixedData(data: { id: number; name: string }): void {
    console.log(`Processing data: id=${data.id}, name=${data.name}`);
}

// Command registry with an example of the new object command
const commands: Command[] = [
    {
        name: "addDisk",
        execute: addDisk,
        args: [{ type: "string" }, { type: "string" }],
    },
    {
        name: "startApp",
        execute: startApp,
        args: [{ type: "string" }, { type: "number" }],
    },
    {
        name: "addNetwork",
        execute: addNetwork,
        args: [{ type: "string" }, { type: "string" }, { type: "string" }, { type: "string" }],
    },
    {
        name: "processCoordinates",
        execute: processCoordinates,
        args: [
            {
                type: "object",
                objectSpec: {
                    x: { type: 'number' },
                    y: { type: 'number' }
                }
            }
        ],
    },
    {
        name: "processMixedData",
        execute: processMixedData,
        args: [
            {
                type: "object",
                objectSpec: {
                    id: { type: 'number' },
                    name: { type: 'string' }
                }
            }
        ],
    },
];

// convertToType function with support for object fields of different types
function convertToType(str: string, descriptor: ArgumentDescriptor): any {
    switch (descriptor.type) {
        case "number":
            const num = parseFloat(str);
            if (isNaN(num)) throw new Error("Cannot convert to number");
            return num;
        case "string":
            return str;
        case "object":
            if (!descriptor.objectSpec) throw new Error("Object specification is missing");
            try {
                const obj = JSON.parse(str);
                for (const [key, fieldSpec] of Object.entries(descriptor.objectSpec)) {
                    if (!(key in obj)) throw new Error(`Missing key '${key}' in object`);
                    switch (fieldSpec.type) {
                        case 'number':
                            const value = parseFloat(obj[key]);
                            if (isNaN(value)) throw new Error(`Key '${key}' is not a valid number`);
                            obj[key] = value;
                            break;
                        case 'string':
                            if (typeof obj[key] !== 'string') throw new Error(`Key '${key}' is not a valid string`);
                            break;
                    }
                }
                return obj;
            } catch {
                throw new Error("Cannot convert to object");
            }
        default:
            throw new Error("Unsupported type");
    }
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'Enter command: '
});

let commandHistory: string[] = [];

function handleCommand(input: string) {
    const [commandName, ...stringArgs] = input.split(" ").map(arg => arg.trim()).filter(arg => arg.length > 0);
    const command = commands.find(cmd => cmd.name === commandName);

    if (!command) {
        console.log(`Unknown command: ${commandName}`);
        return;
    }

    try {
        const args = stringArgs.map((arg, index) => {
            if (index >= command.args.length) throw new Error("Too many arguments");
            return convertToType(arg, command.args[index]);
        });

        if (args.length < command.args.length) throw new Error("Insufficient arguments");

        command.execute(...args);
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

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
        handleCommand(trimmedLine); // Process the command
    }

    rl.prompt();
}).on('close', () => {
    console.log('Exiting command interpreter.');
    process.exit(0);
});


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
    
            // Correctly passing the entire argument descriptor for conversion
            const args = stringArgs.map((arg, index) => {
                if (index >= command.args.length) throw new Error("Too many arguments");
                return convertToType(arg, command.args[index]); // Fixed here
            });
    
            if (args.length < command.args.length) throw new Error("Insufficient arguments");
    
            command.execute(...args);
        } catch (error) {
            console.error(`Error: ${error.message}`);
            console.log("Please try again.");
        }
    }    
}

//commandInterpreter();
