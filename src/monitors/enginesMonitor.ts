import { subscribe } from 'valtio'
import { log, deepPrint, getKeys } from '../utils/utils.js'
import { Store, getEngine } from '../data/Store.js'
import { Engine } from '../data/Engine.js'
import { Network } from '../data/Network.js'
import { EngineID } from '../data/CommonTypes.js'
import { handleCommand } from '../utils/commandHandler.js'
import { engineCommands } from '../utils/engineCommands.js'


export const enableEngineSetMonitor = (store:Store, network:Network):void => {
    const networkName = network.name
    // Enable engine monitors for all existing engines in engineSet
    const engineIds = getKeys(network.appnet.engines) as EngineID[]
    engineIds.forEach((engineId) => {
        const engine = getEngine(store, engineId)
        if (engine) {
            enableEngineMonitor(engine)
        }
    })

    // Monitor the engineSet for changes
    subscribe(network.appnet.engines, (value) => {
        log(`ENGINESET MONITOR: The engineSet of network ${networkName} was modified as follows: ${deepPrint(value)}`)
        value.forEach((op) => {
        log(`   Operation: ${op[0]}`)
        log(`   Engine: ${String(op[1][0])}`)
        log(`   Value: ${String(op[2])}`)
        const remoteEngineId = String(op[1][0]) as EngineID
        const engine = getEngine(store, remoteEngineId)
        if (engine) {
            enableEngineMonitor(engine)
        }
        })
        //log(`NETWORKDATA GLOBAL MONITOR for Network ${networkName}: ${value.length} changes`)
        if (value.length > 10) {
            // exit the program
            log(`Too many changes detected, exiting...`)
            process.exit(1)
        }
    })
    log(`Added ENGINESET MONITOR to network ${networkName}`)
  }

  export const enableEngineMonitor = (engine: Engine):void => {
    // Monitor our local engine for any changes applied from within the engine
    subscribe(engine, (value) => {
        log(`ENGINE ${engine.hostname} MONITOR: Engine ${engine.hostname} is modified as follows: ${deepPrint(value)}`)
        //log(`LOCAL ENGINE ${localEngine.hostName} GLOBAL MONITOR: ${value.length} changes`)
        // if (value.length > 20) {
        //     // exit the program
        //     log(`Too many changes detected, exiting...`)
        //     process.exit(1)
        // }
    })
    log(`Added a monitor for engine ${engine.hostname}`)
}

  export const enableEngineCommandsMonitor = (engine: Engine):void => {
    // Monitor our local engine for commands to be executed
    log(`Adding a commands monitor for engine ${engine.hostname}`)
    if (engine.commands) {
        subscribe(engine.commands, async (value) => {
            log(`ENGINE ${engine.hostname} COMMANDS MONITOR: Engine ${engine.hostname} commands is modified as follows: ${deepPrint(value)}`)
            // Extract the command from the value and execute it
            const command = value[0][2] as string
            log(`Executing command: ${command}`)
            await handleCommand(engineCommands, command)
        })
    } else {
        log(`No commands monitor installed because engine ${engine.hostname} does not have a commands array`)
    }
}
