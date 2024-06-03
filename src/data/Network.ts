import { Doc } from 'yjs'
import { WebsocketProvider } from '../y-websocket/y-websocket.js'
import { Engine, getEngineApps, getEngineInstances } from './Engine.js'
import { log } from '../utils/utils.js';
import { proxy } from 'valtio';
import { bind } from '../valtio-yjs/index.js';
import { pEvent } from 'p-event';
import { getLocalEngine } from './Store.js';

// **********
// Typedefs
// **********

// export type ConnectionStatus = 'connected' | 'disconnected';

export type ConnectionResult = { status: any; }


// The root level Network object which is NOT proxied  
export interface Network {
  name: string;    // The unique identifier of the Network
  doc: Doc;
  data: NetworkData;       // The Valtio-yjs proxy object through which we capture Yjs changes
  yData: any;              // The correspond YMap object
  unbind: () => void;      // The unbind function to disconnect the Valtio-yjs proxy from the Yjs object

  // All connected engines sorted per interface
  connections: Connections;
  listeners: Listeners;

}

// export interface NetworkData {
//     engines: Engine[] 
// }

export type NetworkData = Engine[]

// HACK - 
// export interface NetworkData {
//   [key: string]: any;
// }

// Create a type called Connections that represents all connections that a Network has
// The connections are sorted per interface and per ip address of the Engin that the Network is connected to
// (a Network can be connected to multiple Engines on one Interface)
export type Connection = WebsocketProvider
// export type Connections = {[key: string]: {[key: string]: Connection}}   // The first key is the interface and the second key is the ip address
export type Connections = { [key: string]: Connection }   // key is the ip address

// Create a type called IfaceListeners that represents all listeners that a Network has 
// The listeners are sorted per interface name
export type Listener = (data: any) => void
export type Listeners = { [key: string]: Listener }  // The key is the interface name 


// **********
// Functions
// **********

export const createNetwork = (networkName: string): Network => {
  // Create a Yjs document for the network
  const networkDoc = new Doc()
  log(`Created a Yjs document for network ${networkName} with id ${networkDoc.clientID}`)

  // Create the YMap for the network data
  const yNetworkData = networkDoc.getArray('data')
  // onst yEngines = networkDoc.getArray('engines')
  // Set data.engines to yEngines
  // yNetworkData.set('engines', yEngines)



  // Now add the proxied engine object to the networkData
  // Valtio supports nesting of proxied objects 
  // const networkData = proxy<NetworkData>({engines:[]}) 
  const networkData = proxy<NetworkData>([])
  // const networkData = proxy<NetworkData>({engines:undefined}) 

  // Bind the Valtio proxy to the Yjs object
  const unbind = bind(networkData as Record<string, any>, yNetworkData);
  //log(`Interface ${ifaceName}: Created a Valtio-yjs proxy for networkData`)

  // Create a Network object
  const network = {
    name: networkName,
    doc: networkDoc,
    data: networkData,
    yData: yNetworkData,
    unbind: unbind,
    connections: {},
    listeners: {}
  }

  log(`Network ${network.name} initialised`)

  return network
}

export const connectNetwork = (network: Network, address: string, ifaceName: string, isLocal: boolean): Promise<ConnectionResult> => {
  log(`Connecting network ${network.name} to local or remote engine ${address} via interface ${ifaceName}.`)

  const networkDoc = network.doc

  // UPDATE001: Decomment the following code in case we want to only open sockets on the interfaces that we monitor
  // Enable the Yjs WebSocket service for this interface if it is not already enabled
  // if (!runningServers.hasOwnProperty(ip4)) {
  //   enableWebSocketMonitor(ip4, '1234')
  //   runningServers[ip4] = true
  // } else {
  //   log(`WebSocket server already running on ${ip4}`)
  // }

  if (isLocal) {
    // Replace address with 127.0.0.1
    address = '127.0.0.1'
  }

  if (!network.connections.hasOwnProperty(address)) {
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
        log(`${event.status} to ${address}:1234-on-${ifaceName}`)
      } else if (event.status === 'disconnected') {
        log(`${event.status} from ${address}:1234-on-${ifaceName}`)
      } else if (event.status === 'reconnection-failure-3') {
        log(`Reconnection to ${address}:1234-on-${ifaceName} failed 3 times.`)
        // network.connections[ifaceName][`${ip4}:1234`].destroy()
        // delete network.connections[ifaceName][`${ip4}:1234`]
        // Lets keep trying till we reboot...

      } else if (event.status === 'synced') {
        log(`${event.status} with ${address}:1234-on-${ifaceName}`)
        const localEngineHostName = getLocalEngine().hostName
        // OBSOLETE - The sync event apparently does not represent a full sync of the networkData
        // Check if we can find an engine in the networkData with the same localEngineHostName
        // const localEngine = network.data.find(engine => engine.hostName === localEngineHostName)
        // if (! localEngine) {
        //   // Add the local engine to the networkData
        //   network.data.push(getLocalEngine())
        //   log(`First-time boot. Added local engine ${localEngineHostName} to networkData`)
        // } else {
        //   log(`Local engine ${localEngineHostName} already in networkData`)
        // }
      } else {
        log(`Unhandled status ${event.status} for ${ifaceName}`)
      }
    })
    log(`Interface ${ifaceName}: Created an Yjs websocket client connection on adddress ws://${address}:1234 with room name ${network.name}`)
    return pEvent(wsProvider, 'status', (event: ConnectionResult) => event.status === 'connected')
  } else {
    // Return a resolved promise of ConnectionResult
    return Promise.resolve({ status: 'connected' })
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


export const isEngineConnected = (network: Network, ifaceName: string, ip: string) => {
  // Checks if the engine specified by interface and ip address, is connected
  // return network.connections[ifaceName] && network.connections[ifaceName].hasOwnProperty(ip) && network.connections[ifaceName][ip].wsconnected 
  return network.connections.hasOwnProperty(ip) && network.connections[ip].wsconnected
}

export const getNetworkApps = (network: Network) => {
  return network.data.reduce(
    (acc, engine) => {
      return acc.concat(getEngineApps(engine))
    },
    [])
}

export const getNetworkInstances = (network: Network) => {
  return network.data.reduce(
    (acc, engine) => {
      return acc.concat(getEngineInstances(engine))
    },
    [])
}

export const getNetworkDisks = (network: Network) => {
  // Collect all disks from all networkData.engines
  // Loop over all networkData.engines and collect all disks in one array called disks
  return network.data.reduce(
    (acc, engine) => {
      return acc.concat(engine.disks)
    },
    []
  )
}


export const addListener = (network: Network, iface: string, listener: (data: any) => void) => {
  network.listeners[iface] = listener
}

export const removeListener = (network: Network, iface: string) => {
  delete network.listeners[iface]
}

export const getListeners = (network: Network) => {
  // Return an array of all listeners
  return Object.values(network.listeners)
}

export const getListenerByIface = (network: Network, iface: string) => {
  if (network.listeners.hasOwnProperty(iface)) {
    return network.listeners[iface]
  } else {
    return null
  }
}
