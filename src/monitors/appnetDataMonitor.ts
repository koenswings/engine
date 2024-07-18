import { Network } from '../data/Network.js'
import { subscribe } from 'valtio'
import { log, deepPrint } from '../utils/utils.js'
import { getLocalEngine } from '../data/Store.js'


export const enableAppnetDataGlobalMonitor = (network:Network) => {
  const networkName = network.name
    // TEMPORARY for testing: Monitor networkData for changes propagate by Yjs 
    subscribe(network.engines, (value) => {
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


