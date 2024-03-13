#!/usr/bin/env zx
import { $, question, chalk, cd } from 'zx';
import * as readline from 'readline';
import {  } from '../src/data/store.js';
import { Command } from '../src/data/dataTypes.js';
import { handleCommand } from '../src/utils/commandHandler.js';


interface VirtualEngine {
    name: string;
    port: number;
    status: string;
}

const engines: VirtualEngine[] = [
    // {
    //     name: "engine1",
    //     port: 3001,
    //     status: "running"
    // },
    // {
    //     name: "engine2",
    //     port: 3002,
    //     status: "running"
    // },
    // {
    //     name: "engine3",
    //     port: 3003,
    //     status: "stopped"
    // }
  ]
  
  


// Example function implementations
function addDisk(engine: string, disk: string): void {
    console.log(`Adding disk '${disk}' to engine '${engine}'.`);
    // We must send a remote command to engine1 to add the disk
    // A remote command is added by looking up the engine on the engines property of the network and pushing a coomand to the commands property

}

function startApp(app: string, priority: number): void {
    console.log(`Starting application '${app}' with priority ${priority}.`);
}

function addNetwork(engine: string, face: string, ip: string, netmask: string): void {
    console.log(`Adding network interface '${face}' with IP '${ip}' and netmask '${netmask}' to engine '${engine}'.`);
}

// Create additional engines for testing
export const addEngine = async (engine: string, port:number) => {
    console.log(`Adding engine '${engine}'.`)
    // Compose up the engine
    try {
        cd('..')
        // Build the engine
        await $`docker build --target base -t ${engine} .`
        // Run the engine
        await $`docker run -p ${port}:1234 -d --name ${engine} ${engine}`
        // Add the engine to the list
        engines.push({
            name: engine,
            port: port,
            status: "running"
        })
    } catch (e) {
        console.log(chalk.red('Error adding engine'));
        console.error(e);
    } 
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
        name: "addEngine",
        execute: addEngine,
        args: [{ type: "string" }],
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
        handleCommand(commands, trimmedLine); // Process the command
    }

    rl.prompt();
}).on('close', () => {
    console.log('Exiting command interpreter.');
    process.exit(0);
});


// OLD CODE
// Enhanced command interpreter function
// async function commandInterpreter(): Promise<void> {
//     if (!process.argv.includes("-i")) {
//         console.log("This script should be run in interactive mode using the '-i' option.");
//         process.exit(1);
//     }

//     while (true) {
//         try {
//             let commandLine = await question("Enter command: ");
//             commandLine = commandLine.trim().replace(/\s+/g, ' ');
    
//             if (commandLine === "exit") {
//                 console.log("Exiting command interpreter.");
//                 break;
//             }
    
//             const [commandName, ...stringArgs] = commandLine.split(" ");
//             const command = commands.find(cmd => cmd.name === commandName);
    
//             if (!command) {
//                 console.log(`Unknown command: ${commandName}`);
//                 continue;
//             }
    
//             // Correctly passing the entire argument descriptor for conversion
//             const args = stringArgs.map((arg, index) => {
//                 if (index >= command.args.length) throw new Error("Too many arguments");
//                 return convertToType(arg, command.args[index]); // Fixed here
//             });
    
//             if (args.length < command.args.length) throw new Error("Insufficient arguments");
    
//             command.execute(...args);
//         } catch (error) {
//             console.error(`Error: ${error.message}`);
//             console.log("Please try again.");
//         }
//     }    
// }

//commandInterpreter();
