#!/usr/bin/env zx
import { $, question, chalk, cd, argv } from 'zx';
import * as readline from 'readline';
import { Network, connectEngine, createNetwork, getEngines, getNetworkApps, getNetworkDisks, getNetworkInstances } from '../src/data/Network.js';
import { handleCommand } from '../src/utils/commandHandler.js';
import { deepPrint } from '../src/utils/utils.js';

import pack from '../package.json' assert { type: "json" }
//import { readDefaults, Defaults } from '../src/utils/readDefaults.js'
import { config } from '../src/data/Config.js'

import { getEngine, getNetworks, store } from '../src/data/Store.js';
import { CommandDefinition } from '../src/data/CommandDefinition.js';
import { create } from 'domain';
import { AppName, AppnetName, Command, EngineID, Hostname, InstanceName, InterfaceName, Version } from '../src/data/CommonTypes.js';

const defaults  = config.defaults
const engineAddress = argv.e || argv.engine || defaults.engine
const networkName = argv.n || argv.network || defaults.network as AppnetName

// **********************
// Command-line arguments
// **********************

// Check for the help flag and print usage if help is requested
if (argv.h || argv.help) {
    // We have help, version, engine, network and port options
    console.log(`Options:`)
    console.log(`  -h, --help              display help for command`)  
    console.log(`  -v, --version           output the version number`)
    console.log(`  -n, --network <string>  the network we want to join (default: ${defaults.network})`)
    console.log(`  -e, --engine <string>   the engine (address) we want to connect to (default: ${defaults.engine})`)
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

const network: Network = await createNetwork(store, networkName)
await connectEngine(network, engineAddress)



// ************************
// Virtual Engines
// ************************

// interface VirtualEngine {
//     name: string;
//     port: number;
//     status: string;
// }

// const engines: VirtualEngine[] = [
//     // {
//     //     name: "engine1",
//     //     port: 3001,
//     //     status: "running"
//     // },
//     // {
//     //     name: "engine2",
//     //     port: 3002,
//     //     status: "running"
//     // },
//     // {
//     //     name: "engine3",
//     //     port: 3003,
//     //     status: "stopped"
//     // }
//   ]

// Create additional engines for testing
// export const addEngine = async (engine: string, port:number) => {
//     console.log(`Adding engine '${engine}'.`)
//     // Compose up the engine
//     try {
//         cd('..')
//         // Build the engine
//         await $`docker build --target base -t ${engine} .`
//         // Run the engine
//         await $`docker run -p ${port}:1234 -d --name ${engine} ${engine}`
//         // Add the engine to the list
//         engines.push({
//             name: engine,
//             port: port,
//             status: "running"
//         })
//     } catch (e) {
//         console.log(chalk.red('Error adding engine'));
//         console.error(e);
//     } 
//   }



// **********************
// Doc inspections
// **********************

const ls = ():void => {
    console.log('NetworkData on this engine:')
    console.log(deepPrint(getNetworks(store), 3))
}

const lsEngines = ():void => {
    console.log('Engines:')
}

const lsDisks = ():void => {
    console.log('Disks:')
    const disks = getNetworkDisks(network)
    console.log(deepPrint(disks, 2))
}

const lsApps = ():void => {
    console.log('Apps:')
    const disks = getNetworkApps(network)
    console.log(deepPrint(disks, 2))
}

const lsInstances = ():void => {
    console.log('Instances:')
    const disks = getNetworkInstances(network)
    console.log(deepPrint(disks, 2))
}


// **********************
// Remote Commands
// **********************

// Network Management

const enableAppnetMonitor = (engineName: Hostname, networkName: AppnetName, iface: InterfaceName):void => {
    console.log(`Instructing engine ${engineName} to monitor interface ${iface} for engines on network ${networkName}`)
    // Find the engine with the name engineName
    const engine = getEngines(network).find(e => e.hostName === engineName)
    if (engine && engine.id) {
        sendCommand(engine.id, `enableAppnetMonitor ${iface} ${networkName}` as Command)
    } else {
        console.log(`Engine ${engineName}: not found on network ${network.name} or has no id`)
    }
}


const disableAppnetMonitor = (engineName: Hostname, networkName: AppnetName, iface: InterfaceName):void => {
    console.log(`Instructing engine ${engineName} to unmonitor interface ${iface} for engines on network ${networkName}`)
    // Find the engine with the name engineName
    const engine = getEngines(network).find(e => e.hostName === engineName)
    if (engine && engine.id) {
        sendCommand(engine.id, `disableAppnetMonitor ${iface} ${networkName}` as Command)
    } else {
        console.log(`Engine ${engineName} not found on network ${network.name} or has no id`)
    }
}

// Disk Management

// function createDisk(engine: string, disk: string): void {
//     console.log(`Creating a fixed disk '${disk}' for engine '${engine}'.`);
//     sendCommand(engine, `createDisk ${disk}`)  
// }

// App Management

const createInstance =  (engineName: Hostname, instanceName: InstanceName, typeName:AppName, version:Version, diskName:Hostname):void => {
    console.log(`Creating instance '${instanceName}' of version ${version} of app ${typeName} on disk '${diskName}' of engine '${engineName}'.`)
    // Find the engine with the name engineName
    const engine = getEngines(network).find(e => e.hostName === engineName)
    if (engine && engine.id) {
        sendCommand(engine.id, `createInstance ${instanceName} ${typeName} ${version} ${diskName}` as Command)
    } else {
        console.log(`Engine ${engineName} not found on network ${network.name} or has no id`)
    }
}

const startInstance =  (engineName: Hostname, instanceName: InstanceName, diskName:Hostname):void => {
    console.log(`Starting instance '${instanceName}' on disk '${diskName}' of engine '${engineName}'.`)
    // Find the engine with the name engineName
    const engine = getEngines(network).find(e => e.hostName === engineName)
    if (engine && engine.id) {
        sendCommand(engine.id, `startInstance ${instanceName} ${diskName}` as Command)
    } else {
        console.log(`Engine ${engineName} not found on network ${network.name} or has no id`)
    }
}

const runInstance = (engineName: Hostname, instanceName: InstanceName, diskName: Hostname):void => {
    console.log(`Running application '${instanceName}' on disk ${diskName} of engine '${engineName}'.`)
    // Find the engine with the name engineName
    const engine = getEngines(network).find(e => e.hostName === engineName)
    if (engine && engine.id) {
        sendCommand(engine.id, `runInstance ${instanceName} ${diskName}` as Command)
    } else {
        console.log(`Engine ${engineName} not found on network ${network.name} or has no id`)
    }
}

const stopInstance = (engineName: Hostname, instanceName: InstanceName, diskName: Hostname):void => {
    console.log(`Stopping application '${instanceName}' on disk ${diskName} of engine '${engineName}'.`)
    // Find the engine with the name engineName
    const engine = getEngines(network).find(e => e.hostName === engineName)
    if (engine && engine.id) {
        sendCommand(engine.id, `stopInstance ${instanceName} ${diskName}` as Command)
    } else {
        console.log(`Engine ${engineName} not found on network ${network.name} or has no id`)
    }
}

// Demo commands


// function processCoordinates(coords: { x: number; y: number }): void {
//     console.log(`Processing coordinates: x=${coords.x}, y=${coords.y}`);
// }

// function processMixedData(data: { id: number; name: string }): void {
//     console.log(`Processing data: id=${data.id}, name=${data.name}`);
// }


// ************************
// Remote Command Execution
// ************************

const sendCommand = (engineId: EngineID, command: Command):void => {
    console.log(`Sending command '${command}' to engine ${engineId}`)

    const engine = getEngine(store, engineId)
    console.log(`Pushing commands to ${engineId}`)
    if (engine && engine.commands) engine.commands.push(command)
    // // A remote command is added by looking up the engine on the engines property of the network and pushing a coomand to the commands property
    // const engineId = Object.keys(networkData).find(e => networkData[e].hostName === engineName)
    // if (engineId) {
    //     const engine = networkData[engineId]
    //     if (engine) {
    //         console.log(`Pushing commands to ${engineName}`)
    //         engine.commands.push(command)
    //     }
    // }

}


// Command registry with an example of the new object command
const commands: CommandDefinition[] = [
    // {
    //     name: "addEngine",
    //     execute: addEngine,
    //     args: [{ type: "string" }],
    // },
    {
        name: "ls",
        execute: ls,
        args: []
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
        name: "instances",
        execute: lsInstances,
        args: []
    },
    {
        name: "enableInterfaceMonitor",
        execute: enableAppnetMonitor,
        args: [{ type: "string" }, { type: "string" }, { type: "string" }],
    },
    {
        name: "disableInterfaceMonitor",
        execute: disableAppnetMonitor,
        args: [{ type: "string" }, { type: "string" }, { type: "string" }],
    },
    // {
    //     name: "createDisk",
    //     execute: createDisk,
    //     args: [{ type: "string" }, { type: "string" }],
    // },
    {
        name: "createInstance",
        execute: createInstance,
        args: [{ type: "string" }, { type: "string" }, { type: "string" }, { type: "string" },  { type: "string" }],
    },
    {
        name: "startInstance",
        execute: startInstance,
        args: [{ type: "string" }, { type: "string" },  { type: "string" }],
    },
    {
        name: "runInstance",
        execute: runInstance,
        args: [{ type: "string" }, { type: "string" },  { type: "string" }],
    },
    {
        name: "stopInstance",
        execute: stopInstance,
        args: [{ type: "string" }, { type: "string" },  { type: "string" }],
    },

    // {
    //     name: "processCoordinates",
    //     execute: processCoordinates,
    //     args: [
    //         {
    //             type: "object",
    //             objectSpec: {
    //                 x: { type: 'number' },
    //                 y: { type: 'number' }
    //             }
    //         }
    //     ],
    // },
    // {
    //     name: "processMixedData",
    //     execute: processMixedData,
    //     args: [
    //         {
    //             type: "object",
    //             objectSpec: {
    //                 id: { type: 'number' },
    //                 name: { type: 'string' }
    //             }
    //         }
    //     ],
    // },
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
