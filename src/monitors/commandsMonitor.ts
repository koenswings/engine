import { getEngine } from '../data/store.js'
import { subscribe } from 'valtio'
import { log, deepPrint } from '../utils/utils.js'
import { handleCommand } from '../utils/commandHandler.js'
import { Command } from '../data/dataTypes.js'
import { monitorNetwork, unmonitorNetwork } from './networkMonitor.js'
import { $, question, chalk, cd } from 'zx';


const attachNetwork = (iface: string, networkName: string) => {
    monitorNetwork(iface, networkName)
}

const detachNetwork = (iface: string, networkName: string) => {
    unmonitorNetwork(iface, networkName)
}

const createDisk = async (disk: string) => {
    // Create a directory with the name of the disk under /disks/fixed
    log(`Creating directory /disks/fixed/${disk}`)
    // Use zx - As this is a remote command, we do not have to await the result
    // Embed in a try clause and catch any errors (see example updateSystem function)
    try {
        await $`mkdir -p /disks/internal/${disk}`
    } catch (e) {
        console.log(chalk.red('Error creating disk'))
        console.error(e)
    }
    console.log(chalk.green(`Disk ${disk} created`))
}


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
    {
        name: "createDisk",
        execute: createDisk,
        args: [{ type: "string" }],
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

