import { Engine } from './Engine.js'
import { Network } from './Network.js'
import os from 'os'
import { Interface } from './Engine.js'
import { Disk } from './Disk.js'
import { proxy } from 'valtio'
import { enableNetworkDataGlobalMonitor } from '../monitors/appnetDataMonitor.js'
import { log } from '../utils/utils.js'

export interface Store {
    localEngine: Engine;
    networks: Network[];
    // UPDATE001: Uncomment the following code in case we want to only open sockets on the interfaces that we monitor
    //runningServers: RunningServers;
}

const localEngine = {
    hostName: os.hostname(),
    version: "1.0",
    hostOS: os.type(),
    dockerMetrics: {
        memory: os.totalmem().toString(),
        cpu: os.loadavg().toString(),
        network: "",
        disk: ""
    },
    dockerLogs: { logs: [] },
    dockerEvents: { events: [] },
    lastBooted: new Date().getTime(),
    interfaces: {} as { [key: string]: Interface },
    disks: [] as Disk[],
    commands: [] as string[]
}

// This engine object is proxied with Valtio
const $localEngine = proxy<Engine>(localEngine)
//log(`Proxied engine object: ${deepPrint($localEngine, 2)}`)

const store: Store = {
    localEngine: $localEngine,
    networks: [],
    // UPDATE001: Uncomment the following code in case we want to only open sockets on the interfaces that we monitor
    //runningServers: {}
}

// An object that stores all running servers on the local engine
// It should have the ip address as a key and a truth value to indicate if the server is running
// Add a type definition for this object
// UPDATE001: Uncomment the following code in case we want to only open sockets on the interfaces that we monitor
// export type RunningServers = {
//   [ip: string]: boolean
// }

export const getLocalEngine = () => {
    return store.localEngine
}


export const findNetworkByName = (networkName: string): Network | undefined => {
    return store.networks.find(network => network.name === networkName)
}

// export const filterNetworksByInterface = (ifaceName: string) => {
//     // Find all networks with that have connections for the specified interface
//     return store.networks.filter(network => {
//         // Check if networks.connections[iface] is not an empty object
//         return network.connections[ifaceName] && Object.keys(network.connections[ifaceName]).length > 0
//     })
// }

export const getNetworks = () => {
    return store.networks
}

export const getNetworkNames = () => {
    return store.networks.map(network => network.name)
}

export const addNetwork = (network: Network) => {
    store.networks.push(network)

    // Add subscriptions  
    enableNetworkDataGlobalMonitor(network)

    //enableNetworkDataCommandsMonitor(networkData, networkName)
    log(`Network ${network.name} added to the store`)
}
