import { NetworkData } from '../data/dataTypes.js'
import { getEngine } from '../data/store.js'
import { subscribe } from 'valtio'
import { log, deepPrint } from '../utils/utils.js'

export const enableNetworkDataCommandsMonitor = (networkData:NetworkData, networkName:string) => {
    // Monitor our local engine for commands to be executed
    // Find the engine in the networkData.engines array and then subscribe to the commands array
    const localEngine = networkData.engines.find(engine => engine.hostName === getEngine().hostName)
    if (localEngine) {
      subscribe(localEngine.commands, (value) => {
        log(`NETWORKDATA ENGINE ${localEngine.hostName} COMMANDS MONITOR: Engine ${localEngine.hostName} commands is modified via network ${networkName}. Commands is now: ${deepPrint(value)}`)
      })
      log(`Added COMMANDS MONITOR for engine ${localEngine.hostName} to network ${networkName}`)
    } else {
      log(`Network ${networkName}: Could not find local engine in networkData.engines`)
    }
}




export const enableNetworkDataGlobalMonitor = (networkData:NetworkData, networkName:string) => {
    // TEMPORARY for testing: Monitor networkData for changes propagate by Yjs 
    subscribe(networkData, (value) => {
        log(`NETWORKDATA GLOBAL MONITOR: Network ${networkName}: Network data was modified as follows: ${deepPrint(value)}`)
        //log(`NETWORKDATA GLOBAL MONITOR for Network ${networkName}: ${value.length} changes`)
        if (value.length > 10) {
            // exit the program
            log(`Too many changes detected, exiting...`)
            process.exit(1)
        }
        })
        log(`Added GLOBAL MONITOR to network ${networkName}`)
}


