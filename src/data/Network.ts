import { Doc, Map } from 'yjs'
import { WebsocketProvider } from '../y-websocket/y-websocket.js'
import { Engine, getDisks, getEngineApps, getEngineInstances } from './Engine.js'
import { deepPrint, log } from '../utils/utils.js';
import { proxy } from 'valtio';
import { bind } from '../valtio-yjs/index.js';
import { pEvent } from 'p-event';
import { Store, getEngine, getLocalEngine } from './Store.js';
import { AppnetName, EngineID, Hostname, IPAddress, InterfaceName } from './CommonTypes.js';
import { LeveldbPersistence } from 'y-leveldb'
import { $ } from 'zx';
import { firstBoot } from '../y-websocket/yjsUtils.js';
import { Disk } from './Disk.js';
import { App } from './App.js';
import { Instance } from './Instance.js';
import { Appnet, addEngineToAppnet, initialiseAppnetData, removeEngineFromAppnet } from './Appnet.js';
import { add } from 'lib0/math.js';
// import { IndexeddbPersistence } from 'y-indexeddb'



// **********
// Typedefs
// **********


/**
 * The possible results returned from the Yjs websocket provider
 */
export type ConnectionResult = { status: ConnectionStatus } 
export type ConnectionStatus = 'connected' | 'disconnected' | 'synced' | 'reconnection-failure-3'


// The root level Network object which is NOT proxied  
/**
 * The part of the Store that manages the network of connected Engines
 */
export interface Network {
  // The unique identifier of the Network
  name: AppnetName;    

  // The Yjs document that holds the network data
  doc: Doc;

  // The Valtio root object of the data in the network
  appnet: Appnet,

  // The unbind function to disconnect the Valtio-yjs proxy from the Yjs object
  unbind?: () => void;      

  // All connected engines sorted per interface
  connections: Connections;

  // The root Store object that contains the database of objects
  store: Store;

}

// Create a type called Connections that represents all connections that a Network has
// The connections are organised per ip address of the Engine that the Network is connected to
/**
 * The connections that a Network has to other Engines
 */
export type Connections = { [key: IPAddress]: Connection }   // key is the ip address
export type Connection = WebsocketProvider



// **********
// Functions
// **********

export const createNetwork = async (store:Store, networkName: AppnetName): Promise<Network> => {
  // Create a Yjs document for the network
  const networkDoc = new Doc()
  
  // OLD - Can not work in Nodejs as there is no Indexeddb on Nodejs
  // Add the persistence layer
  // const dbProvider = new IndexeddbPersistence(networkName, networkDoc)
  // dbProvider.on('synced', () => {
  //   log('Content from the database is loaded')
  // })

  // OLD
  // Create and connect the database
  // Create the folder for the database at first boot
  // if (firstBoot) {
  //   await $`mkdir -p ./yjs-db/${networkName}`
  // }
  // const persistence = new LeveldbPersistence('./yjs-db/' + networkName)
  // const networkDoc = await persistence.getYDoc(networkName)

  log(`Created a Yjs document for network ${networkName} with id ${networkDoc.clientID}`)

  // OLD
  // Create the YMap for the network data
  // const yNetworkData = networkDoc.getArray('data')
  // onst yEngines = networkDoc.getArray('engines')
  // Set data.engines to yEngines
  // yNetworkData.set('engines', yEngines)
  //
  // Now add the proxied engine object to the networkData
  // Valtio supports nesting of proxied objects 
  // const networkData = proxy<NetworkData>({engines:[]}) 
  // const networkData = proxy<NetworkData>({})
  // const networkData = proxy<NetworkData>({engines:undefined}) 
  //
  // Bind the Valtio proxy to the Yjs object
  // const unbind = bind(networkData as Record<string, any>, yNetworkData);
  //log(`Interface ${ifaceName}: Created a Valtio-yjs proxy for networkData`)
  // 
  
  // Create a Network object
  const network = {
    name: networkName,
    doc: networkDoc,
    appnet: await initialiseAppnetData(networkName, networkDoc),
    connections: {},
    store: store
  }

  log(`Network ${network.name} initialised`)

  return network
}

// export const bindEngine = (network: Network, engine: Engine, ) => {
//   // Bind the local engine object to the YMap object with the same id
//   const yEngine = network.doc.getMap(engine.id)
//   const unbindEngine = bind(engine as Record<string, any>, yEngine)
//   log(`Bound engine ${engine.id} to networkData`)

//   // Create and bind a proxy for the engine Ids array
//   const engineSet = proxy({})
//   bind(engineSet, networkDoc.getMap('engineSet'))

//   // Make sure that the id of the local engine is in the engineIds set
//   engineSet[localEngine.id] = true

//   // Create the Valtio engines cache
//   // const engineCache = proxy({})

//   // Set the bind property of network
// }

export const connectEngine = (network: Network, engineId:EngineID, address: IPAddress, timeout?:boolean): Promise<ConnectionResult> => {
  const networkDoc = network.doc

  // UPDATE001: Decomment the following code in case we want to only open sockets on the interfaces that we monitor
  // Enable the Yjs WebSocket service for this interface if it is not already enabled
  // if (!runningServers.hasOwnProperty(ip4)) {
  //   enableWebSocketMonitor(ip4, '1234')
  //   runningServers[ip4] = true
  // } else {
  //   log(`WebSocket server already running on ${ip4}`)
  // }

  log(`Checking connection of ${network.name} with ${address}`)
  if (!network.connections.hasOwnProperty(`${address}:1234`)) {
    log(`Creating a new connection to ${address}:1234`)
    const wsProvider = new WebsocketProvider(`ws://${address}:1234`, network.name, networkDoc)
    // Add the wsProvider to the wsProviders object of the network
    // network.wsProviders[`${ip4}:1234-on-${ifaceName}`] = wsProvider
    // if (!network.connections[ifaceName]) {
    //   network.connections[ifaceName] = {}
    // }
    // network.connections[ifaceName][`${address}:1234`] = wsProvider
    network.connections[`${address}:1234`] = wsProvider
    wsProvider.on('status', (event: ConnectionResult) => {
      if (event.status === 'connected') {
        log(`${event.status} to ${address}:1234`)
        // Add the engine to the network
        addEngineToAppnet(network.appnet, engineId)
      } else if (event.status === 'disconnected') {
        log(`${event.status} from ${address}:1234`)
        // Remove the engine from the network
        removeEngineFromAppnet(network.appnet, engineId)
      } else if (event.status === 'reconnection-failure-3') {
        log(`Reconnection to ${address}:1234-on failed 3 times.`)
        if (timeout) {
          log(`Timeout reached. Rebooting the system`)
          network.connections[`${address}:1234`].destroy()
          delete network.connections[`${address}:1234`]
        }
      } else if (event.status === 'synced') {
        log(`${event.status} with ${address}:1234`)
        // OBSOLETE - The sync event apparently does not represent a full sync of the networkData
        // Check if we can find an engine in the networkData with the same localEngineHostName
        // const localEngineHostName = getLocalEngine().hostName
        // const localEngine = network.data.find(engine => engine.hostName === localEngineHostName)
        // if (! localEngine) {
        //   // Add the local engine to the networkData
        //   network.data.push(getLocalEngine())
        //   log(`First-time boot. Added local engine ${localEngineHostName} to networkData`)
        // } else {
        //   log(`Local engine ${localEngineHostName} already in networkData`)
        // }
      } else {
        log(`Unhandled status ${event.status} for connection to ${address}:1234`)
      }
    })
    log(`Created an Yjs websocket client connection on adddress ws://${address}:1234 with room name ${network.name}`)
    return pEvent(wsProvider, 'status', (event: ConnectionResult) => (event.status === 'synced' || event.status === 'disconnected'  || event.status === 'reconnection-failure-3'))
  } else {
    // Return a resolved promise of ConnectionResult
    log(`Connection to ${address}:1234 already exists`)
    return Promise.resolve({ status: 'synced' })
  }
}

// export const disconnectNetwork = (network:Network, ifaceName:string) => {
//   log(`Disconnecting network ${network.name} from all engines on interface ${ifaceName}`)

//   // Destroy all connections made over this interface
//   const ips = network.connections[`${ifaceName}`]
//   // Iterate over all keys of ips and destroy the resulting wsProvider
//   if (ips) {
//     Object.keys(ips).forEach(ip => {
//       network.connections[`${ifaceName}`][ip].destroy()
//       delete network.connections[`${ifaceName}`][ip]
//     })
//   }
// }


export const isEngineConnected = (network: Network, ip: IPAddress):boolean => {
  // Checks if the engine specified by ip address, is connected
  // return network.connections[ifaceName] && network.connections[ifaceName].hasOwnProperty(ip) && network.connections[ifaceName][ip].wsconnected 
  return network.connections.hasOwnProperty(ip) && network.connections[ip].wsconnected
}

export const getEngines = (network: Network):Engine[] => {
  //return network.doc.getArray('engineIds').toArray() as string[]
  const appnet = network.appnet
  const engineIds = Object.keys(appnet.engines) as EngineID[]
  return engineIds.flatMap(engineId => {
    const engine = getEngine(network.store, engineId)
    if (engine) {
      return [engine]
    } else {
      return []
    }
  })
}



// export const getEngine = (network: Network, engineId: string) => {
//   if (network.engineCache.hasOwnProperty(engineId)) {
//     return network.engineCache[engineId]
//   } else {
//     const engineMap = network.doc.getMap(engineId) as Map<Engine>
//     const engine = proxy({}) as Engine
//     bind(engine as Record<string, any>, engineMap)
//     network.engineCache[engineId] = engine
//     return engine
//   }
// }



export const findEngineByHostname = (network: Network, engineName: Hostname):Engine | undefined => {
  return getEngines(network).find(engine => engine.hostname === engineName)
}

// export const getNetworkApps = (network: Network) => {
//   const engineIds = network.engineIds
//   return engineIds.reduce(
//     (acc, engineId) => {
//       return acc.concat(getEngineApps(getEngine(network, engineId)))
//     },
//     [])
// }

export const getNetworkApps = (network: Network):App[] => {
  return getEngines(network).reduce(
    (acc, engine) => {
      return acc.concat(getEngineApps(network.store, engine))
    },
    [] as App[])
}


// export const getNetworkInstances = (network: Network) => {
//   const engineIds = network.engineIds
//   return engineIds.reduce(
//     (acc, engineId) => {
//       return acc.concat(getEngineInstances(getEngine(network, engineId)))
//     },
//     [])
// }

export const getNetworkInstances = (network: Network):Instance[] => {
  return getEngines(network).reduce(
    (acc, engine) => {
      return acc.concat(getEngineInstances(network.store, engine))
    },
    [] as Instance[])
}

export const getNetworkDisks = (network: Network): Disk[] => {
  // Collect all disks from all networkData.engines
  // Loop over all networkData.engines and collect all disks in one array called disks
  return getEngines(network).reduce(
    (acc, engine) => {
      return acc.concat(getDisks(network.store, engine))
    },
    [] as Disk[]
  )
}


