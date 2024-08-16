import { Network } from '../data/Network.js'
import { subscribe } from 'valtio'
import { log, deepPrint } from '../utils/utils.js'
import { Store, getEngine, getLocalEngine } from '../data/Store.js'
import { enableEngineGlobalMonitor } from './engineMonitor.js'
import { Engine } from '../data/Engine.js'
import { EngineID } from '../data/CommonTypes.js'


export const enableEngineSetMonitor = (store:Store, network:Network):void => {
  const networkName = network.name
    // TEMPORARY for testing: Monitor networkData for changes propagate by Yjs 
    subscribe(network.appnet.engines, (value) => {
        log(`ENGINESET MONITOR: The engineSet of network ${networkName} was modified as follows: ${deepPrint(value)}`)
        value.forEach((op) => {
          log(`   Operation: ${op[0]}`)
          log(`   Engine: ${String(op[1][0])}`)
          log(`   Value: ${String(op[2])}`)
          const remoteEngineId = String(op[1][0]) as EngineID
          const engine = getEngine(store, remoteEngineId)
          if (engine) {
            enableEngineGlobalMonitor(engine)
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


