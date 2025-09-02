import { subscribe } from 'valtio'
import { log, deepPrint } from '../utils/utils.js'
import { Store, getEngine, getInstance, getLocalEngine } from '../data/Store.js'
import { Engine } from '../data/Engine.js'
import { Network } from '../data/Network.js'
import { AppnetName, EngineID, InstanceID, PortNumber } from '../data/CommonTypes.js'
import { handleCommand } from '../utils/commandHandler.js'
import { engineCommands } from '../utils/engineCommands.js'
import { fs } from 'zx'
import http from 'http'

// export const enableConnectionsMonitor = (store:Store, network:Network):void => {

//     // Monitor the engineSet for changes
//     subscribe(network.connections, (value) => {
//         log(`NETWORK CONNECTIONS MONITOR: The connections of network ${network.appnet.name} was modified as follows: ${deepPrint(value)}`)
//         value.forEach((op) => {
//             log(`   Operation: ${op[0]}`)
//             log(`   Connection: ${String(op[1][0])}`)
//             log(`   Value: ${String(op[2])}`)
//             const remoteEngineId = String(op[1][0]) as EngineID
        
//     })
//     log(`Added INSTANCESET MONITOR to network ${network.appnet.name}`)
//     })
// }
