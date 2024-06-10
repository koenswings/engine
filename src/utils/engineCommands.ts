import { createInstanceFromFile, startInstance, runInstance, stopInstance  } from '../data/Instance.js'
import { subscribe } from 'valtio'
import { log, deepPrint } from '../utils/utils.js'
import { $, YAML, chalk } from 'zx';
import { read, write } from 'fs';
import { readConfig, writeConfig } from '../data/Config.js';
import { CommandDefinition } from '../data/CommandDefinition.js';
import { getLocalEngine } from '../data/Store.js';
import { rebootEngine } from '../data/Engine.js';

// const storeAndEnableAppnetMonitor = async (networkName: string, ifaceName: string) => {
//     // Read the config.yaml file, add this command to the startupCOmmands array, and write the file back
//     // Make sure that the same command is only stored once
//     try {
//         const { settings, defaults, testSetup } = await readConfig('config.yaml')
//         const appnet = appnetSetup.find((appnet) => appnet.name === networkName)
//         if (!appnet) {
//             appnetSetup.push({name: networkName, interfaces: [ifaceName]})
//             writeConfig({settings, defaults, testSetup}, 'config.yaml')
//         } else if (!appnet.interfaces.includes(ifaceName)) {
//             appnet.interfaces.push(ifaceName)
//             writeConfig({settings, defaults, testSetup}, 'config.yaml')
//         }
//         // if (!startup.commands) {
//         //     log(chalk.red(`No startup commands found in config file.`))
//         //     startup.commands = [`enableAppnetMonitor ${networkName}  ${ifaceName}`]
//         // }
//         // else if (!startup.commands.includes(`enableAppnetMonitor ${networkName} ${ifaceName}`)) {
//         //     log(chalk.green(`Storing command in config file.`))
//         //     startup.commands.push(`enableAppnetMonitor ${networkName} ${ifaceName}`)
//         // } else {
//         //     log(chalk.red(`Command already stored in config file.`))
//         // }
        
//         await $`echo ${YAML.stringify({appnetSetup, defaults, testSetup})} > config.yaml`
//     } catch (e) {
//         log(chalk.red(`Error reading config file. This command will not be persisted.`))
//         console.error(e)
//     }
    
//     // Now call the enableInterfaceMonitor function
//     enableAppnetMonitor(networkName, ifaceName)
// }

// const storeAndDisableAppnetMonitor = async (networkName: string, ifaceName: string) => {
//     const { settings, defaults, testSetup } = await readConfig('config.yaml')
//     const appnet = settings.appnets.find((appnet) => appnet.name === networkName)
//     if (appnet) {
//         appnet.interfaces = appnet.interfaces.filter((iface) => iface !== ifaceName)
//         writeConfig({settings, defaults, testSetup}, 'config.yaml')
//     }
//     // try {
//     //     const configFile = await $`cat config.yaml`
//     //     const config = YAML.parse(configFile.stdout)
//     //     config.startupCommands = config.startupCommands.filter((command) => command !== `enableInterfaceMonitor ${ifaceName} ${networkName}`)
//     //     await $`echo ${YAML.stringify(config)} > config.yaml`    
//     // } catch (e) {
//     //     log(chalk.red(`Error reading config file. This command will not be persisted.`))
//     //     console.error(e)
//     // }
    
//     // Now call the enableInterfaceMonitor function
//     // disableAppnetMonitor(networkName, ifaceName)

//     // Now reboot the engine
//     rebootEngine(getLocalEngine())
// }

// Command registry with an example of the new object command
export const engineCommands: CommandDefinition[] = [
    // {
    //     name: "enableAppnetMonitor",
    //     execute: storeAndEnableAppnetMonitor,
    //     args: [{ type: "string" }, { type: "string" }],
    // },
    // {
    //     name: "disableAppnetMonitor",
    //     execute: storeAndDisableAppnetMonitor,
    //     args: [{ type: "string" }, { type: "string" }],
    // },
    // {
    //     name: "createDisk",
    //     execute: createDisk,
    //     args: [{ type: "string" }],
    // },
    {
        name: "createInstance",
        execute: createInstanceFromFile,
        args: [{ type: "string" }, { type: "string" }, { type: "string" }],
    },
    {
        name: "startInstance",
        execute: startInstance,
        args: [{ type: "string" }, { type: "string" }],
    },
    {
        name: "runInstance",
        execute: runInstance,
        args: [{ type: "string" }, { type: "string" }],
    },
    {
        name: "stopInstance",
        execute: stopInstance,
        args: [{ type: "string" }, { type: "string" }],
    },
    // {
    //     name: "addDisk",
    //     execute: addDisk,
    //     args: [{ type: "string" }, { type: "string" }],
    // },
    // {
    //     name: "startApp",
    //     execute: startApp,
    //     args: [{ type: "string" }, { type: "number" }],
    // },
    // {
    //     name: "addNetwork",
    //     execute: addNetwork,
    //     args: [{ type: "string" }, { type: "string" }, { type: "string" }, { type: "string" }],
    // },
    // {
    //     name: "addEngine",
    //     execute: addEngine,
    //     args: [{ type: "string" }],
    // },
];