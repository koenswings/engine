import { Engine, setRestrictedInterfaces } from './Engine.js'
import { ConnectionResult, Network, connectEngine, createNetwork } from './Network.js'
import os from 'os'
import { Interface } from './Engine.js'
import { Disk } from './Disk.js'
import { proxy } from 'valtio'
import { enableEngineSetMonitor } from '../monitors/engineSetMonitor.js'
import { deepPrint, log } from '../utils/utils.js'
import { readMeta, DiskMeta } from './Meta.js';
import { firstBoot } from '../y-websocket/yjsUtils.js'
import { config } from './Config.js'
import { enableWebSocketMonitor } from '../monitors/webSocketMonitor.js'
import { Server } from 'http'
import { App } from './App.js'
import { Instance } from './Instance.js'
import { AppID, AppnetName, DiskID, EngineID, IPAddress, InstanceID, InterfaceName, PortNumber } from './CommonTypes.js'
import { Appnet } from './Appnet.js'


// **********
// Typedefs
// **********

// Insert a JSDoc comment explaining Store
/**
 * The Store object is a centralised store for all data objects in the application
 * It contains the following properties:
 * - localEngine: The local engine object
 * - engineDB: A dictionary of all engines in the application
 * - diskDB: A dictionary of all disks in the application
 * - appDB: A dictionary of all apps in the application
 * - instanceDB: A dictionary of all instances in the application
 * - networks: An array of all networks in the application
 * - runningServers: An object that stores all running servers on the local engine
 * - listeners: An object that stores all listeners sorted per interface name
 * 
 * @typedef {Object} Store
 * @property {EngineID} localEngine - The local engine object
 * @property {Object.<EngineID, Engine>} engineDB - A dictionary of all engines in the application
 * @property {Object.<DiskID, Disk>} diskDB - A dictionary of all disks in the application
 * @property {Object.<AppID, App>} appDB - A dictionary of all apps in the application
 * @property {Object.<InstanceID, Instance>} instanceDB - A dictionary of all instances in the application
 * @property {Network[]} networks - An array of all networks in the application
 * @property {RunningServers} runningServers - An object that stores all running servers on the local engine
 * @property {Listeners} listeners - An object that stores all listeners sorted per interface name
 *  
 */
export interface Store {
    // The id of the local engine
    localEngine: EngineID,
    
    // The Valtio object database
    engineDB: { [key: EngineID]: Engine },
    diskDB: { [key: DiskID]: Disk },
    appDB: { [key: AppID]: App },
    instanceDB: { [key: InstanceID]: Instance },

    // The list of Networks the local engine is connected to
    networks: Network[],

    // The instances of servers that are running on the local engine
    runningServers: RunningServers,

    // The listeners that are listening for interface data on the local engine
    listeners: Listeners
}

/**
 * The callback that is called when an interface receives data
 */
export type Listener = (data: any) => void


// Create a type called Listeners that represents all listeners sorted per interface name
/**
 * Listeners stores all listeners sorted per interface name
 * It should have the interface name as a key and the listener function as the value
 * 
 */
export type Listeners = { [key: InterfaceName]: Listener }  // The key is the interface name 

// An object that stores all running servers on the local engine
// It should have the ip address as a key and the server object as the value
/**
 * An object that stores all running servers on the local engine
 * It should have the ip address as a key and the server object as the value
 * 
 * @typedef {Object} RunningServers
 * @property {IPAddress} ip - The ip address of the server
 * @property {Server} server - The server object
 *  
 */
export type RunningServers = {
    [ip: IPAddress]: Server
}

const getLocalEngineId = async ():Promise<EngineID> => {
    const meta: DiskMeta | undefined = await readMeta()
    if (!meta) {
        console.error(`No meta file found on root disk. Cannot create local engine. Exiting.`)
        process.exit(1)
    }
    return meta.id
}

export const initialiseStore = async ():Promise<Store> => {
    const store: Store = {
        localEngine: await getLocalEngineId(),
        engineDB: {},
        diskDB: {},
        appDB: {},
        instanceDB: {},
        networks: [],
        runningServers: {},
        listeners: {}
    }
    return store
}

export const store = await initialiseStore()

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

export const getLocalEngine = (store:Store):Engine => {
    return store.engineDB[store.localEngine]
}

export const getEngine = (store: Store, engineId: EngineID):Engine | undefined => {
    return store.engineDB[engineId]
}

export const getDisk = (store: Store, diskId: DiskID):Disk | undefined => {
    return store.diskDB[diskId]
}

export const getApp = (store: Store, appId: AppID):App | undefined => {
    return store.appDB[appId]
}

export const getInstance = (store: Store, instanceId: InstanceID):Instance | undefined => {
    return store.instanceDB[instanceId]
}

export const findNetworkByName = (store:Store, networkName: AppnetName): Network | undefined => {
    return store.networks.find(network => network.name === networkName)
}

// export const filterNetworksByInterface = (ifaceName: string) => {
//     // Find all networks with that have connections for the specified interface
//     return store.networks.filter(network => {
//         // Check if networks.connections[iface] is not an empty object
//         return network.connections[ifaceName] && Object.keys(network.connections[ifaceName]).length > 0
//     })
// }

export const getNetworks = (store:Store):Network[] => {
    return store.networks
}

export const getNetworkNames = (store:Store):AppnetName[] => {
    return store.networks.map(network => network.name)
}

export const addNetwork = async (store:Store, networkName: AppnetName): Promise<ConnectionResult> => {
    // Create and initialise a Network object
    const network = await createNetwork(store, networkName)

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
    // enableEngineSetMonitor(network)

    // Add it to the networks array
    store.networks.push(network)
    log(`Network ${network.name} added to the store`)

    // Connect it to the local websockets server
    return connectEngine(network, "127.0.0.1" as IPAddress)
}

export const createRunningServer = (store:Store, ip: IPAddress):void => {
    const httpServer = enableWebSocketMonitor(ip, 1234 as PortNumber)
    store.runningServers[ip] = httpServer
}

export const closeRunningServer = (store:Store, ip: IPAddress):void => {
    store.runningServers[ip].close()
    delete store.runningServers[ip]
}


export const addListener = (store:Store, iface: InterfaceName, listener: (data: any) => void):void => {
    store.listeners[iface] = listener
}

export const removeListener = (store:Store, iface: InterfaceName):void => {
    delete store.listeners[iface]
}

export const getListeners = (store:Store):Listener[] => {
    // Return an array of all listeners
    return Object.values(store.listeners)
}

export const getListenerByIface = (store:Store, iface: InterfaceName):Listener | undefined => {
    if (store.listeners.hasOwnProperty(iface)) {
        return store.listeners[iface]
    } else {
        return undefined
    }
}
