import { createInstance, startInstance, runInstance, stopInstance, getEngine,  } from '../data/store.js'
import { subscribe } from 'valtio'
import { log, deepPrint } from '../utils/utils.js'
import { handleCommand } from '../utils/commandHandler.js'
import { App, Instance, Command, Status } from '../data/dataTypes.js'
import { monitorNetwork, unmonitorNetwork } from './networkMonitor.js'


const attachNetwork = (iface: string, networkName: string) => {
    monitorNetwork(iface, networkName)
}

const detachNetwork = (iface: string, networkName: string) => {
    unmonitorNetwork(iface, networkName)
}

// const createDisk = async (disk: string) => {
//     log(`Creating an internal disk ${disk} on engine ${getEngine().hostName}`)

//     // Check if the supplied disk name does not start with sd
//     if (disk.startsWith('sd')) {
//         console.log(chalk.red('Disk name cannot start with "sd"'))
//         return
//     }

//     try {
//         await $`mkdir -p /disks/${disk}`
//         console.log(chalk.green(`Internal disk ${disk} of engine ${getEngine().hostName} created`))
//     } catch (e) {
//         console.log(chalk.red('Error creating internal disk'))
//         console.error(e)
//     }
// }




// Command registry with an example of the new object command
const commands: Command[] = [
    {
        name: "attachNetwork",
        execute: attachNetwork,
        args: [{ type: "string" }, { type: "string" }],
    },
    {
        name: "detachNetwork",
        execute: detachNetwork,
        args: [{ type: "string" }, { type: "string" }],
    },
    // {
    //     name: "createDisk",
    //     execute: createDisk,
    //     args: [{ type: "string" }],
    // },
    {
        name: "createInstance",
        execute: createInstance,
        args: [{ type: "string" }, { type: "string" }, { type: "string" }, { type: "string" }],
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

export const enableEngineCommandsMonitor = () => {
    // Monitor our local engine for commands to be executed
    const localEngine = getEngine()
    subscribe(localEngine.commands, async (value) => {
        log(`LOCAL ENGINE ${localEngine.hostName} COMMANDS MONITOR: Engine ${localEngine.hostName} commands is modified as follows: ${deepPrint(value)}`)
        // Extract the command from the value and execute it
        const command = value[0][2] as string
        log(`Executing command: ${command}`)
        await handleCommand(commands, command)
    })
    log(`Added COMMANDS MONITOR for engine ${localEngine.hostName}`)
}

