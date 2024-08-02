import { Engine, setRestrictedInterfaces } from './Engine.js'
import { ConnectionResult, Network, connectEngine, createNetwork } from './Network.js'
import os from 'os'
import { Interface } from './Engine.js'
import { Disk } from './Disk.js'
import { proxy } from 'valtio'
import { enableEngineSetMonitor } from '../monitors/engineSetMonitor.js'
import { DiskMeta, deepPrint, log, readMeta } from '../utils/utils.js'
import { firstBoot } from '../y-websocket/yjsUtils.js'
import { config } from './Config.js'
import { enableWebSocketMonitor } from '../monitors/webSocketMonitor.js'
import { Server } from 'http'


// **********
// Typedefs
// **********

export interface Store {
    localEngine: Engine,
    networks: Network[],
    runningServers: RunningServers,
    listeners: Listeners
}

// Create a type called Listeners that represents all listeners sorted per interface name
export type Listener = (data: any) => void
export type Listeners = { [key: string]: Listener }  // The key is the interface name 

// An object that stores all running servers on the local engine
// It should have the ip address as a key and the server object as the value
export type RunningServers = {
    [ip: string]: Server
}

const initialiseLocalEngine = async () => {

    const meta: DiskMeta = await readMeta()
    if (!meta) {
        console.error(`No meta file found on root disk. Cannot create local engine. Exiting.`)
        process.exit(1)
    }

    const localEngine = proxy<Engine>({
        id: meta.id,
        hostName: os.hostname(),
        version: meta.version,
        hostOS: os.type(),
        dockerMetrics: {
            memory: os.totalmem().toString(),
            cpu: os.loadavg().toString(),
            network: "",
            disk: ""
        },
        created: meta.created,
        lastBooted: (new Date()).getTime(),
        restrictedInterfaces: config.settings.interfaces ? config.settings.interfaces : []
    })

    // This engine object is proxied with Valtio
    const $localEngine = proxy<Engine>(localEngine)
    //log(`Proxied engine object: ${deepPrint($localEngine, 2)}`)

    return $localEngine
}


const store: Store = {
    localEngine: await initialiseLocalEngine(),
    networks: [],
    runningServers: {},
    listeners: {}
}

// export const getLocalEngine = () => {
//     const oldLocalEngineName = config.settings.localEngineName
//     const currentLocalEngineName = os.hostname()

//     // First check if the hostname has changed
//     if (store.localEngineName !== localEngineName) {
//         store.localEngineName = localEngineName
//     }

//     if (oldLocalEngineName === undefined || oldLocalEngineName === null || oldLocalEngineName === "") {
//         // If the engine name has not yet been set in the config (on first time boot), set it to the current local engine name
//         config.settings.localEngineName = currentLocalEngineName
//         log(`First time boot. Setting local engine name to ${currentLocalEngineName}`)
//         writeConfig(config, 'config.yaml')
//         const engine = store.networks[0].doc.getArray('currentLocalEngineName')
//     } else {
//         if (oldLocalEngineName !== currentLocalEngineName) {
//             // The engine host name has changed
//             const engine = store.networks[0].doc.getArray('oldLocalEngineName')
//             // TODO - Update the key of the engine object in the YDoc !!!
//             // Update the config file
//             config.settings.localEngineName = currentLocalEngineName
//             // Loop over all networks and all engines on those networks, find the engine with the old hostname and update it
//             log(`Local engine name has changed from ${oldLocalEngineName} to ${localEngineName}`)
//             store.networks.forEach(network => {
//                 Object.keys(network.data).forEach(engine => {
//                     if (network.data[engine].hostName === oldLocalEngineName) {
//                         log(`Updating engine ${oldLocalEngineName} to ${localEngineName}`)
//                         network.data[engine].hostName = localEngineName
//                     }
//                 })
//             })
//             writeConfig(config, 'config.yaml')
//         }
//     }
//     const engine = Object.keys(store.networks[0].data).find(engine => Object.keys(store.networks[0].data)[engine].hostName === store.localEngineName)
//     if (engine === undefined) {
//         log(`deepPrint(store): ${deepPrint(store, 4)}`)
//         throw new Error(`Local engine ${store.localEngineName} not found`)
//     }
//     return Object.keys(store.networks[0].data)[engine]
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

export const addNetwork = async (networkName: string): Promise<ConnectionResult> => {
    // Create and initialise a Network object
    const network = createNetwork(networkName)

    // Store its client id if this is the first time boot
    // NOTE: 
    //   This is a left-over from a previous solution in which we recreated each Network object with the saqme id
    //   But this is no longer necessary
    //   So strictly, we only need to store whether we have booted before or not, not the client id
    //   We still keep it for now, if we ever want to solve issues by persisting the ids of Network objects
    // const id = getAppnetId(config, networkName)
    // if ((id === undefined || id === null)) {
    // log(`Adding a new local engine object to network ${networkName}`)    
    // const engine = getLocalEngine()
    // const restrictedInterfaces = config.settings.interfaces ? config.settings.interfaces : []
    // const hostName = os.hostname()
    // engine.hostName = hostName
    // engine.version = "1.0"
    // engine.hostOS = os.type()
    // engine.dockerMetrics = {
    //     memory: os.totalmem().toString(),
    //     cpu: os.loadavg().toString(),
    //     network: "",
    //     disk: ""
    // }
    // engine.dockerLogs = { logs: [] }
    // engine.dockerEvents = { events: [] }
    // engine.lastBooted = (new Date()).getTime()
    // engine.restrictedInterfaces = restrictedInterfaces
    // engine.connectedInterfaces = {} as { [key: string]: Interface }
    // engine.disks = [] as Disk[]
    // engine.commands = [] as string[]
    //const localEngine = createLocalEngine(restrictedInterfaces)
    // network.data.push(localEngine)
    // setAppnetId(config, networkName, network.doc.clientID)
    // Write the updated config file
    // await writeConfig(config, 'config.yaml')

    // Add subscriptions  
    enableEngineSetMonitor(network)

    // Add it to the networks array
    store.networks.push(network)
    log(`Network ${network.name} added to the store`)

    // Connect it to the local websockets server
    return connectEngine(network, "127.0.0.1")
}

export const createRunningServer = (ip: string) => {
    const httpServer = enableWebSocketMonitor(ip, '1234')
    store.runningServers[ip] = httpServer
}

export const closeRunningServer = (ip: string) => {
    store.runningServers[ip].close()
    delete store.runningServers[ip]
}


export const addListener = (iface: string, listener: (data: any) => void) => {
    store.listeners[iface] = listener
}

export const removeListener = (iface: string) => {
    delete store.listeners[iface]
}

export const getListeners = () => {
    // Return an array of all listeners
    return Object.values(store.listeners)
}

export const getListenerByIface = (iface: string) => {
    if (store.listeners.hasOwnProperty(iface)) {
        return store.listeners[iface]
    } else {
        return null
    }
}
