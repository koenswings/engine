import { getEngine } from '../data/store.js'
import { subscribe } from 'valtio'
import { log, deepPrint } from '../utils/utils.js'

export const enableLocalEngineGlobalMonitor = () => {
    // Monitor our local engine for any changes applied from within the engine
    const localEngine = getEngine()
    subscribe(localEngine, (value) => {
        log(`LOCAL ENGINE ${localEngine.hostName} GLOBAL MONITOR: Engine ${localEngine.hostName} is modified as follows: ${deepPrint(value)}`)
        //log(`LOCAL ENGINE ${localEngine.hostName} GLOBAL MONITOR: ${value.length} changes`)
        if (value.length > 10) {
            // exit the program
            log(`Too many changes detected, exiting...`)
            process.exit(1)
        }
    })
    log(`Added COMMANDS MONITOR for engine ${localEngine.hostName}`)
}