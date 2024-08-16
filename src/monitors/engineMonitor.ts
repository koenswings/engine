import { subscribe } from 'valtio'
import { log, deepPrint } from '../utils/utils.js'
import { getLocalEngine } from '../data/Store.js'
import { Engine } from '../data/Engine.js'

export const enableEngineGlobalMonitor = (engine: Engine):void => {
    // Monitor our local engine for any changes applied from within the engine
    subscribe(engine, (value) => {
        log(`ENGINE ${engine.hostName} GLOBAL MONITOR: Engine ${engine.hostName} is modified as follows: ${deepPrint(value)}`)
        //log(`LOCAL ENGINE ${localEngine.hostName} GLOBAL MONITOR: ${value.length} changes`)
        if (value.length > 10) {
            // exit the program
            log(`Too many changes detected, exiting...`)
            process.exit(1)
        }
    })
    log(`Added a global monitor for engine ${engine.hostName}`)
}