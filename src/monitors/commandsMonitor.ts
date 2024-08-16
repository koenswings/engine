import { subscribe } from 'valtio'
import { log, deepPrint } from '../utils/utils.js'
import { handleCommand } from '../utils/commandHandler.js'
import { engineCommands } from '../utils/engineCommands.js'
import { getLocalEngine } from '../data/Store.js'
import { Engine } from '../data/Engine.js'

// Write with comments a summary of all commands that can be executed on the engine and the expected arguments
// Do it in the following format:
// create an instance of an app
// createInstance instanceName typeName version diskName
//
// start an instance of an app
// startInstance instanceName typeName
// 
// run an instance of an app
// runInstance instanceName typeName
//
// stop an instance of an app
// stopInstance instanceName typeName
//
// add a disk to the engine
// addDisk diskName diskType
//
// start an app
// startApp appName port
//
// add a network to the engine
// addNetwork networkName iface ip subnet
//
// add an engine to the network
// addEngine engineName
//
// attach a network to an interface
// attachNetwork iface networkName
//
// detach a network from an interface
// detachNetwork iface networkName
//
// create an internal disk
// createDisk diskName


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

export const enableEngineCommandsMonitor = (engine: Engine):void => {
    // Monitor our local engine for commands to be executed
    log(`Adding a commands monitor for engine ${engine.hostName}`)
    if (engine.commands) {
        subscribe(engine.commands, async (value) => {
            log(`ENGINE ${engine.hostName} COMMANDS MONITOR: Engine ${engine.hostName} commands is modified as follows: ${deepPrint(value)}`)
            // Extract the command from the value and execute it
            const command = value[0][2] as string
            log(`Executing command: ${command}`)
            await handleCommand(engineCommands, command)
        })
    } else {
        log(`No commands monitor installed because engine ${engine.hostName} does not have a commands array`)
    }
}

// export const enableEngineCommandsMonitor = (networkData:NetworkData, networkName:string) => {
//     // Monitor our local engine for commands to be executed
//     // Find the engine in the networkData.engines array and then subscribe to the commands array
//     const localEngine = getLocalEngine()
//     if (localEngine) {
//       subscribe(localEngine.commands, (value) => {
//         log(`NETWORKDATA ENGINE ${localEngine.hostName} COMMANDS MONITOR: Engine ${localEngine.hostName} commands is modified via network ${networkName}. Commands is now: ${deepPrint(value)}`)
//       })
//       log(`Added COMMANDS MONITOR for engine ${localEngine.hostName} to network ${networkName}`)
//     } else {
//       log(`Network ${networkName}: Could not find local engine in networkData.engines`)
//     }
// }

