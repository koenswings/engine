#!/usr/bin/env zx
import { $, question, chalk, cd } from 'zx';
import * as readline from 'readline';
import { networkApps, networkDisks } from '../src/data/store.js';
import { Command, Engine, NetworkData } from '../src/data/dataTypes.js';
import { handleCommand } from '../src/utils/commandHandler.js';
import { WebsocketProvider } from '../src/yjs/y-websocket.js';
import { Doc, Array, Map } from "yjs"
import { deepPrint } from '../src/utils/utils.js';
import { bind } from 'valtio-yjs';
import { proxy } from 'valtio';


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

let networkDoc: Doc
let networkData: NetworkData

const connect = (network, ip4, port) => {
    console.log(`Connecting to ${network} using the engine at ${ip4}:${port}`)
    networkDoc = new Doc()
    const wsProvider = new WebsocketProvider(`ws://${ip4}:1234`, network, networkDoc)
    wsProvider.on('status', (event: { status: any; }) => {
        console.log(event.status) // logs "connected" or "disconnected"
        let unbind: () => void
        if (event.status === 'connected') {
            console.log(`Connected to network ${network}`)
            const yNetworkData = networkDoc.getMap('data')
            //const engines = yNetworkData.get('engines') as Engine[]
            //console.log(deepPrint(engines, 1))
            networkData = proxy<NetworkData>({});
            // Bind the Valtio proxy to the Yjs object
            unbind = bind(networkData, yNetworkData);
        } 
        if (event.status === 'disconnected') {
            console.log('Disconnected from network')
            unbind()
        }
    })
}

connect('LAN', 'localhost', 1234)

const lsEngines = () => {
    console.log('Engines:')
    console.log(deepPrint(networkData.engines, 3))
}

const lsDisks = () => {
    console.log('Disks:')
    const disks = networkDisks(networkData)
    console.log(deepPrint(disks, 2))
}

const lsApps = () => {
    console.log('Apps:')
    const disks = networkApps(networkData)
    console.log(deepPrint(disks, 2))
}

// `monitorNetwork engine1 eth0 class2c`
const monitorNetwork = (engineName: string, iface: string, network: string) => {
    console.log(`Instructing engine ${engineName} to monitor network ${network} on interface ${iface}`)
    // We must send a remote command to engine1 to monitor the network
    // A remote command is added by looking up the engine on the engines property of the network and pushing a coomand to the commands property
    const engine = networkData.engines.find(e => e.hostName === engineName)
    if (engine) {
        console.log(`Pushing commands to ${engineName}`)
        engine.commands.push({
            name: 'monitorNetwork',
            args: [iface, network]
        })
    }
}




// Command registry with an example of the new object command
const commands: Command[] = [
    {
        name: "connect",
        execute: connect,
        args: [{ type: "string" }, { type: "string" }, { type: "number" }],
    },
    {
        name: "engines",
        execute: lsEngines,
        args: []
    },
    {
        name: "disks",
        execute: lsDisks,
        args: []
    },
    {
        name: "apps",
        execute: lsApps,
        args: []
    },
    {
        name: "monitorNetwork",
        execute: monitorNetwork,
        args: [{ type: "string" }, { type: "string" }, { type: "string" }],
    },
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
