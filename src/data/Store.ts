import { Engine, setRestrictedInterfaces } from './Engine.js'
import { ConnectionResult, Network, connectEngine, createNetwork } from './Network.js'
import os from 'os'
import { Interface } from './Engine.js'
import { Disk } from './Disk.js'
import { proxy } from 'valtio'
import { enableAppnetDataGlobalMonitor } from '../monitors/appnetDataMonitor.js'
import { deepPrint, log } from '../utils/utils.js'
import { getAppnetId, readConfig, setAppnetId, writeConfig } from './Config.js'
import { enableWebSocketMonitor } from '../monitors/webSocketMonitor.js'
import { Server } from 'http'
import { config } from './Config.js'


export interface Store {
    localEngineName: string,
    networks: Network[],
    runningServers: RunningServers,
    listeners: Listeners
}

// Create a type called Listeners that represents all listeners sorted per interface name
export type Listener = (data: any) => void
export type Listeners = { [key: string]: Listener }  // The key is the interface name 

const store: Store = {
    localEngineName: os.hostname(),
    networks: [],
    runningServers: {},
    listeners: {}
}

// An object that stores all running servers on the local engine
// It should have the ip address as a key and the server object as the value
export type RunningServers = {
  [ip: string]: Server
}

export const createLocalEngine = (restrictedInterfaces: string[]) => {
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
        restrictedInterfaces: restrictedInterfaces,
        connectedInterfaces: {} as { [key: string]: Interface },
        disks: [] as Disk[],
        commands: [] as string[]
    }
    
    // This engine object is proxied with Valtio
    const $localEngine = proxy<Engine>(localEngine)
    //log(`Proxied engine object: ${deepPrint($localEngine, 2)}`)

    return $localEngine
}    
  
export const getLocalEngine = () => {
    // First check if the hostname has changed
    const localEngineName = os.hostname()
    const oldLocalEngineName = config.settings.localEngineName
    // log(`Local engine name: ${localEngineName}`)
    // log(`Old local engine name: ${oldLocalEngineName}`)
    if (oldLocalEngineName === undefined || oldLocalEngineName === null || oldLocalEngineName === "") {
        // First time boot
        config.settings.localEngineName = localEngineName
        log(`First time boot. Setting local engine name to ${localEngineName}`)
        writeConfig(config, 'config.yaml')
    } else {
        if (oldLocalEngineName !== localEngineName) {
            config.settings.localEngineName = localEngineName
            // Loop over all networks and all engines on those networks, find the engine with the old hostname and update it
            log(`Local engine name has changed from ${oldLocalEngineName} to ${localEngineName}`)
            store.networks.forEach(network => {
                network.data.forEach(engine => {
                    if (engine.hostName === oldLocalEngineName) {
                        log(`Updating engine ${oldLocalEngineName} to ${localEngineName}`)
                        engine.hostName = localEngineName
                    }
                })
            })
        }
        writeConfig(config, 'config.yaml')
    }
    const engine = store.networks[0].data.find(engine => engine.hostName === store.localEngineName)
    if (engine === undefined) {
        log(`deepPrint(store): ${deepPrint(store, 4)}`)
        throw new Error(`Local engine ${store.localEngineName} not found`)
    }
    return engine
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

export const addNetwork = async (networkName: string):Promise<ConnectionResult> => {
    const config = await readConfig('config.yaml')
    // Create and initialise a Network object
    const network = createNetwork(networkName)

    // Store its client id if this is the first time boot
    const id = getAppnetId(config.settings.appnets, networkName)
    if ((id === undefined || id === null)) {
        log(`First time boot. Adding a new local engine object to network ${networkName} and storing the client id`)    
        const restrictedInterfaces = config.settings.interfaces ? config.settings.interfaces : []
        const localEngine = createLocalEngine(restrictedInterfaces)
        network.data.push(localEngine)
        setAppnetId(config.settings.appnets, networkName, network.doc.clientID)
        // Write the updated config file
        await writeConfig(config, 'config.yaml')
    }

    // Add subscriptions  
    enableAppnetDataGlobalMonitor(network)

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
  