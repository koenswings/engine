import { getEngine } from '../data/store.js'
import { subscribe } from 'valtio'
import { log, deepPrint } from '../utils/utils.js'
import { handleCommand } from '../utils/commandHandler.js'
import { Command } from '../data/dataTypes.js'
import { monitorNetwork, unmonitorNetwork } from './networkMonitor.js'

const attachNetwork = (iface: string, networkName: string) => {
    monitorNetwork(iface, networkName)
}

const detachNetwork = (iface: string, networkName: string) => {
    unmonitorNetwork(iface, networkName)
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
    subscribe(localEngine.commands, (value) => {
        log(`LOCAL ENGINE ${localEngine.hostName} COMMANDS MONITOR: Engine ${localEngine.hostName} commands is modified as follows: ${deepPrint(value)}`)
        // Extract the command from the value and execute it
        const command = value[0][2] as string
        log(`Executing command: ${command}`)
        handleCommand(commands, command)
    })
    log(`Added COMMANDS MONITOR for engine ${localEngine.hostName}`)
}

export const enableEngineGlobalMonitor = () => {
    // Monitor our local engine for any changes
    const localEngine = getEngine()
    subscribe(localEngine, (value) => {
        log(`LOCAL ENGINE ${localEngine.hostName} GLOBAL MONITOR: Engine ${localEngine.hostName} is modified as follows: ${deepPrint(value)}`)
    })
    log(`Added COMMANDS MONITOR for engine ${localEngine.hostName}`)
}