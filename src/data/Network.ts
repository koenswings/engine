import { BrowserWebSocketClientAdapter, WebSocketClientAdapter } from "@automerge/automerge-repo-network-websocket";
import { Engine } from './Engine.js'
import { log } from '../utils/utils.js';
import { IPAddress, InterfaceName, PortNumber } from './CommonTypes.js';
import { DocumentId, Repo } from "@automerge/automerge-repo";
import { config } from './Config.js';

const settings = config.settings


// **********
// Typedefs
// **********


/**
 * The possible results returned from the Yjs websocket provider
 */
export type ConnectionResult = { status: ConnectionStatus } 
export type ConnectionStatus = 'connected' | 'disconnected' | 'synced' | 'reconnection-failure-3'


// The root level Network object 
/**
 * Manages the network of connected Engines
 */
export interface Network {
  // All connected engines sorted per interface
  connections: Connections;

}

// Create a type called Connections that represents all connections that a Network has
// The connections are organised per ip address of the Engine that the Network is connected to
/**
 * The connections that a Network has to other Engines
 */
export type Connections = { [key: IPAddress]: Connection }   // key is the ip address
export type Connection = {
    adapter: WebSocketClientAdapter;
    missedDiscoveryCount: number;
}

export const network: Network = {
  connections: {}
}

const MAX_MISSED_DISCOVERIES = 3;

// **********
// Functions
// **********

export const manageDiscoveredPeers = (repo: Repo, discoveredAddresses: Set<IPAddress>, storeDocId: DocumentId): void => {
  const port = settings.port as PortNumber || 1234 as PortNumber
    // Increment missed discovery count for all existing connections
    for (const connection of Object.values(network.connections)) {
        connection.missedDiscoveryCount++;
    }

    // Reset count for discovered peers and connect to new ones
    for (const address of discoveredAddresses) {
        const connectionKey = `${address}:${port}`;
        if (network.connections[connectionKey]) {
            network.connections[connectionKey].missedDiscoveryCount = 0;
        } else {
            connectEngine(repo, address, storeDocId);
        }
    }

    // Remove connections that have been missed too many times
    for (const [connectionKey, connection] of Object.entries(network.connections)) {
        if (connection.missedDiscoveryCount > MAX_MISSED_DISCOVERIES) {
            const [address, portStr] = connectionKey.split(':');
            const port = parseInt(portStr, 10) as PortNumber;
            disconnectEngine(repo, address as IPAddress, port);
        }
    }
};

export const disconnectEngine = (repo: Repo, address: IPAddress, port: PortNumber): void => {
  const connectionKey = `${address}:${port}`;
  const connection = network.connections[connectionKey];

  if (connection) {
    log(`Disconnecting from engine at ${connectionKey}`);
    try {
      repo.networkSubsystem.removeNetworkAdapter(connection.adapter);
    } catch (e: any) {
      if (e.message === 'WebSocket was closed before the connection was established') {
        log(`Ignoring expected error during disconnect: ${e.message}`);
      } else {
        throw e;
      }
    }
    delete network.connections[connectionKey];
  }
};




export const connectEngine = (repo:Repo, address: IPAddress, storeDocId: DocumentId): WebSocketClientAdapter | undefined => {

  const port = settings.port as PortNumber || 1234 as PortNumber

  log(`Connecting to engine at ${address}:${port}`)


  log(`Checking connection with ${address}`)
  if (!network.connections.hasOwnProperty(`${address}:${port}`) && address !== 'localhost' && address !== '127.0.0.1') {
    log(`Creating a new connection to ${address}:${port}`)

    const clientConnection = new WebSocketClientAdapter(`ws://${address}:${port}`)
    repo.networkSubsystem.addNetworkAdapter(clientConnection)
    repo.find(storeDocId) // Trigger the connection by finding the store document

      // The peer ID is the engine ID

    // const wsProvider = new WebsocketProvider(`ws://${address}:1234`, `engine-${engineId}`, new Doc(), {
    // Add the wsProvider to the wsProviders object of the network
    // network.wsProviders[`${ip4}:1234-on-${ifaceName}`] = wsProvider
    // if (!network.connections[ifaceName]) {
    //   network.connections[ifaceName] = {}
    // }
    // network.connections[ifaceName][`${address}:1234`] = wsProvider
    network.connections[`${address}:${port}`] = { adapter: clientConnection, missedDiscoveryCount: 0 };
    // clientConnection.on('status', (event: ConnectionResult) => {
    //   if (event.status === 'connected') {
    //     log(`${event.status} to ${address}:1234`)
    //     // Add the engine to the network
    //     // addEngineToAppnet(network.appnet, engineId)
    //   } else if (event.status === 'disconnected') {
    //     log(`${event.status} from ${address}:1234`)
    //     // Remove the engine from the network
    //     // removeEngineFromAppnet(network.appnet, engineId)
    //   } else if (event.status === 'reconnection-failure-3') {
    //     log(`Reconnection to ${address}:1234-on failed 3 times.`)
    //     if (timeout) {
    //       log(`Timeout reached. Rebooting the system`)
    //       network.connections[`${address}:1234`].destroy()
    //       delete network.connections[`${address}:1234`]
    //     }
    //   } else if (event.status === 'synced') {
    //     log(`${event.status} with ${address}:1234`)
    //     // OBSOLETE - The sync event apparently does not represent a full sync of the networkData
    //     // Check if we can find an engine in the networkData with the same localEngineHostName
    //     // const localEngineHostName = getLocalEngine().hostName
    //     // const localEngine = network.data.find(engine => engine.hostName === localEngineHostName)
    //     // if (! localEngine) {
    //     //   // Add the local engine to the networkData
    //     //   network.data.push(getLocalEngine())
    //     //   log(`First-time boot. Added local engine ${localEngineHostName} to networkData`)
    //     // } else {
    //     //   log(`Local engine ${localEngineHostName} already in networkData`)
    //     // }
    //   } else {
    //     // log(`Unhandled status ${event.status} for connection to ${address}:1234`)
    //   }
    // })
    log(`Created an websocket client connection on adddress ws://${address}:${port}`)
    return clientConnection
    //return pEvent(wsProvider, 'status', (event: ConnectionResult) => (event.status === 'synced' || event.status === 'disconnected'  || event.status === 'reconnection-failure-3'))
  } else {
    // Return a resolved promise of ConnectionResult
    log(`Connection to ${address}:${port} already exists or address is localhost or 127.0.0.1`)
    if (network.connections[`${address}:${port}`]) {
        network.connections[`${address}:${port}`].missedDiscoveryCount = 0;
    }
    return undefined
    // return Promise.resolve({ status: 'synced' })
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
  return network.connections.hasOwnProperty(ip) && network.connections[ip] !== undefined && network.connections[ip].adapter.isReady()
}

export const getIp = (engine: Engine, ifaceName: InterfaceName):IPAddress | undefined => {
    // return engine.connectedInterfaces ? engine.connectedInterfaces[ifaceName]?.ip4 : undefined
    return undefined
}

// export const getEngines = (network: Network):Engine[] => {
//   //return network.doc.getArray('engineIds').toArray() as string[]
//   const appnet = network.appnet
//   const engineIds = getKeys(appnet.engines) as EngineID[]
//   return engineIds.flatMap(engineId => {
//     const engine = getEngine(network.store, engineId)
//     if (engine) {
//       return [engine]
//     } else {
//       return []
//     }
//   })
// }



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



// export const findEngineByHostname = (network: Network, engineName: Hostname):Engine | undefined => {
//   return getEngines(network).find(engine => engine.hostname === engineName)
// }

// export const findEngineById = (network: Network, engineId: EngineID):Engine | undefined => {
//   return getEngines(network).find(engine => engine.id === engineId)
// }

// export const getNetworkApps = (network: Network) => {
//   const engineIds = network.engineIds
//   return engineIds.reduce(
//     (acc, engineId) => {
//       return acc.concat(getEngineApps(getEngine(network, engineId)))
//     },
//     [])
// }

// export const getNetworkApps = (network: Network):App[] => {
//   return getEngines(network).reduce(
//     (acc, engine) => {
//       return acc.concat(getEngineApps(network.store, engine))
//     },
//     [] as App[])
// }


// export const getNetworkInstances = (network: Network) => {
//   const engineIds = network.engineIds
//   return engineIds.reduce(
//     (acc, engineId) => {
//       return acc.concat(getEngineInstances(getEngine(network, engineId)))
//     },
//     [])
// }

// export const getNetworkInstances = (network: Network):Instance[] => {
//   return getEngines(network).reduce(
//     (acc, engine) => {
//       return acc.concat(getEngineInstances(network.store, engine))
//     },
//     [] as Instance[])
// }

// export const getNetworkDisks = (network: Network): Disk[] => {
//   // Collect all disks from all networkData.engines
//   // Loop over all networkData.engines and collect all disks in one array called disks
//   return getEngines(network).reduce(
//     (acc, engine) => {
//       return acc.concat(getDisks(network.store, engine))
//     },
//     [] as Disk[]
//   )
// }


