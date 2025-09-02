import { subscribe } from 'valtio'
import { log, deepPrint, getKeys } from '../utils/utils.js'
import { Store, getEngine } from '../data/Store.js'
import { Engine } from '../data/Engine.js'
import { Network } from '../data/Network.js'
import { EngineID } from '../data/CommonTypes.js'
import { handleCommand } from '../utils/commandHandler.js'
import { engineCommands } from '../utils/engineCommands.js'
import { DocHandle } from '@automerge/automerge-repo'




/**
 * Enables a monitor for the set of all engines in the store.
 * This monitor will log the additional or removal of engines in the store.
 * 
 * @param storeHandle The DocHandle for the store document.
 */
export const enableEngineSetMonitor = (storeHandle: DocHandle<Store>): void => {
    // Monitor for the addition or removal of engines in the store
    const store = storeHandle.doc()
    storeHandle.on('change', ({ doc, patches }) => {
        log(`enableEngineSetMonitor handles ${deepPrint(patches)}`)
        for (const patch of patches) {
            // The path for an additional Engine in the engineDB set is expected to be in the form:
            // ['engineDB', <index>]
            if (patch.action === 'put' &&  // Since we never change the object value, we know that 'put' means an addition 
                patch.path.length === 2 &&
                patch.path[0] === 'engineDB' &&
                typeof patch.path[1] === 'number') {
                const engineId = patch.path[1].toString() as EngineID
                log(`New engine added with ID: ${engineId}`)
            }
            // The path for a removed Engine in the engineDB set is expected to be in the form:
            // ['engineDB', <index>]
            else if (patch.action === 'del' &&
                patch.path.length === 2 &&
                patch.path[0] === 'engineDB' &&
                typeof patch.path[1] === 'number') {
                const engineId = patch.path[1].toString() as EngineID
                log(`Engine removed with ID: ${engineId}`)
            }
        }
    })
}

export const enableEngineCommandsMonitor = (storeHandle: DocHandle<Store>): void => {
    const store = storeHandle.doc()
    for (const engineId of getKeys(store.engineDB) as EngineID[]) {
        storeHandle.on('change', ({ doc, patches }) => {
            log(`enableEngineCommandsMonitor handles ${deepPrint(patches)}`)
            for (const patch of patches) {
                // The path for an additional command in the commands array is expected to be in the form:
                // ['engineDB', <engineId>, 'commands', <index>]
                if (patch.action === 'put' &&
                    patch.path.length === 4 &&
                    patch.path[0] === 'engineDB' &&
                    patch.path[1] === engineId &&
                    patch.path[2] === 'commands' &&
                    typeof patch.path[3] === 'number') {
                    const command = patch.value as string
                    log(`New command added for engine ${engineId}: ${command}`)
                    handleCommand(engineCommands, command)
                }
            }
        })
    }
}


export const enableEngineLastRunMonitor = (storeHandle: DocHandle<Store>): void => {
    const store = storeHandle.doc()
    for (const engineId of getKeys(store.engineDB) as EngineID[]) {
        storeHandle.on('change', ({ doc, patches }) => {
            log(`enableEngineLastRunMonitor handles ${deepPrint(patches)}`)
            for (const patch of patches) {
                // The path for the lastRun property of an engine is expected to be in the form:
                // ['engineDB', <engineId>, 'lastRun']
                if (patch.action === 'put' &&
                    patch.path.length === 3 &&
                    patch.path[0] === 'engineDB' &&
                    patch.path[1] === engineId &&
                    patch.path[2] === 'lastRun') {
                    const lastRun = patch.value as number
                    log(`Engine ${engineId} last run updated to: ${lastRun}`)
                }
            }
        })
    }
}


// export const enableEngineMonitor = (engine: Engine):void => {
//     // Monitor our local engine for any changes applied from within the engine
//     subscribe(engine, (value) => {
//         log(`ENGINE ${engine.hostname} MONITOR: Engine ${engine.hostname} is modified as follows: ${deepPrint(value)}`)
//         //log(`LOCAL ENGINE ${localEngine.hostName} GLOBAL MONITOR: ${value.length} changes`)
//         // if (value.length > 20) {
//         //     // exit the program
//         //     log(`Too many changes detected, exiting...`)
//         //     process.exit(1)
//         // }
//     })
//     log(`Added a monitor for engine ${engine.hostname} (${engine.id})`)
// }

//   export const enableEngineCommandsMonitor = (engine: Engine):void => {
//     // Monitor our local engine for commands to be executed
//     log(`Adding a commands monitor for engine ${engine.hostname} (${engine.id})`)
//     if (engine.commands) {
//         subscribe(engine.commands, async (value) => {
//             log(`ENGINE ${engine.hostname} COMMANDS MONITOR: Engine ${engine.hostname} commands is modified as follows: ${deepPrint(value)}`)
//             // Extract the command from the value and execute it
//             const command = value[0][2] as string
//             log(`Executing command: ${command}`)
//             await handleCommand(engineCommands, command)
//         })
//     } else {
//         log(`No commands monitor installed because engine ${engine.hostname} does not have a commands array`)
//     }
// }
