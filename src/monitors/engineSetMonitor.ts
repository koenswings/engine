import { Network } from '../data/Network.js'
import { subscribe } from 'valtio'
import { log, deepPrint } from '../utils/utils.js'
import { getLocalEngine } from '../data/Store.js'


export const enableEngineSetMonitor = (network:Network) => {
  const networkName = network.name
    // TEMPORARY for testing: Monitor networkData for changes propagate by Yjs 
    subscribe(network.engineSet, (value) => {
        log(`ENGINESET MONITOR: The engineSet of network ${networkName} was modified as follows: ${deepPrint(value)}`)
        //log(`NETWORKDATA GLOBAL MONITOR for Network ${networkName}: ${value.length} changes`)
        if (value.length > 10) {
            // exit the program
            log(`Too many changes detected, exiting...`)
            process.exit(1)
        }
        })
        log(`Added ENGINESET MONITOR to network ${networkName}`)
}


