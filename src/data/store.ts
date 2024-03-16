//import { Doc } from 'yjs'
import { Network, NetworkInterface, NetworkData, Disk, Engine, Status, Command } from "./dataTypes.js"
import { appMasters } from "./data.js"
import { os } from "zx"
import { proxy, subscribe, ref, snapshot } from 'valtio'
import { subscribeKey, watch } from 'valtio/utils'
import { bind } from 'valtio-yjs'
import { deepPrint, log } from "../utils/utils.js"
import { Doc, Array, Map } from "yjs"
import { WebsocketProvider } from '../yjs/y-websocket.js'
import { enableYjsWebSocketService } from '../services/yjsWebSocketService.js'
import { $, chalk, cd } from 'zx'
import pkg from 'lodash'
const { cloneDeep } = pkg

// **********
// Definition
// **********

// The root level list of all Networks
const networks: Network[] = []

// The local Engine object running on port 1234
const localEngine = {
  hostName: os.hostname(),
  version: {
    major: 1,
    minor: 0
  },
  hostOS: os.type(),
  status: 'Running' as Status,
  dockerMetrics: {
    memory: os.totalmem().toString(),
    cpu: os.loadavg().toString(),
    network: "",
    disk: ""
  },
  dockerLogs: { logs: [] },
  dockerEvents: { events: [] },
  lastBooted: new Date().getTime(),
  networkInterfaces: [] as NetworkInterface[],
  disks: [] as Disk[],
  commands: [] as Command[]
}

// This engine object is proxied with Valtio
// const $engine = proxy<Engine>(engine)
// log(`Proxied engine object: ${deepPrint($engine, 2)}`)



// **********
// API
// **********



export const addNetwork = (networkName, iface, ip4, net) => {
  log(`Initialising network ${networkName} for interface ${iface} with IP4 address ${ip4} and netmask ${net}`)

  // Create a Yjs document for the network
  const networkDoc = new Doc()
  
  // Create a NetworkInterface
  const networkInterface = {
    network: networkDoc.guid,
    name: networkName,
    iface: iface,
    ip4: ip4,
    netmask: net
  }
  // And add it to the local engine
  getEngine().networkInterfaces.push(networkInterface)
  log(`Interface ${iface}: Network interface added to local engine`)
  //log(`Engine: ${deepPrint(getEngine(), 2)}`)


  // Problem - by adding it to $engine, it gets copied to all networks. 
  // We must find a way to add it to the local engine only since the network interface on a copied engine only refers to one and the sae=me networkl

  // Remove all networkInterfaces from the cloned engine object except the one that corresponds with the network we are currently adding
  // We do not want other engines to see what networks this engine is connected to
  // engine.networkInterfaces = engine.networkInterfaces.filter(networkInterface => networkInterface.iface === iface)
  
  // Create the YMap for the network data
  const yNetworkData = networkDoc.getMap('data')

  // Create a valtio state for the network data
  // First clone the result of getEngine() into a new object. Do NOT use JSON.parse(JSON.stringify(getEngine())) 
  // const engine = { ...getEngine() }
  // const engine = { ...snapshot(getEngine())}
  const engineClone = cloneDeep(getEngine())
  //log(`Cloned engine object: ${deepPrint(engineClone, 2)}`)
 
  // log(`Testing if engine is proxied`)
  // subscribe(engine, (update) => {
  //   console.log(`XXXXXXXX Non-proxied local engine has changed with ${deepPrint(update)}`)
  // })
  // NO  - it is not proxied (subscribe throws an error)




  // Now add the cloned engine object to the networkData
  const networkData: NetworkData = proxy<NetworkData>({
    engines: [engineClone],
  });

  // Bind the Valtio proxy to the Yjs object
  const unbind = bind(networkData, yNetworkData);
  log(`Interface ${iface}: Created a Valtio-yjs proxy for networkData`)

  // Enable the Yjs WebSocket service for this network
  enableYjsWebSocketService(ip4, '1234')
  const wsProvider = new WebsocketProvider(`ws://${ip4}:1234`, networkName, networkDoc)
  wsProvider.on('status', (event: { status: any; }) => {
    console.log(event.status) // logs "connected" or "disconnected"
  })
  log(`Interface ${iface}: Created an Yjs websocket service on adddress ws://${ip4}:1234 with room name appdocker`)

  // Enable random array population for the apps array
  // enableRandomArrayPopulation(apps)

  // Create a Network object
  const network: Network = {
    id: networkDoc.guid,
    doc: networkDoc,
    wsProvider: wsProvider,
    data: networkData,
    yData: yNetworkData,
    unbind: unbind
  }

  // And add it to the networks array
  networks.push(network)

  log(`Interface ${iface}: Network initialised with ID ${network.id} and added to store`)

 
  // TEMPORARY: Monitor networkData for changes propagate by Yjs 
  subscribe(networkData, (value) => {
    console.log(`NETWORKDATA GLOBAL MONITOR: Interface ${iface}: Network data was modified as follows: ${deepPrint(value)}`)
  })
  log(`Interface ${iface}: Subscribed to networkData`)



  // Monitor our local engine for commands to be executed
  // Now we have an issue: how do we monitor for changes in the commands array of the local engine that is somewhere in the networkData.engines array?
  // We must find the engine in the networkData.engines array and then subscribe to the commands array
  const localEngine = networkData.engines.find(engine => engine.hostName === getEngine().hostName)
  if (localEngine) {
    subscribe(localEngine.commands, (value) => {
      console.log(`NETWORKDATA ENGINE ${localEngine.hostName} COMMANDS MONITOR: Interface ${iface}: Engine ${localEngine.hostName} commands is modified. Commands is now: ${deepPrint(value)}`)
    })
    log(`Interface ${iface}: Subscribed to localEngine.commands`)
  } else {
    log(`Interface ${iface}: Could not find local engine in networkData.engines`)
  }


}

export const removeNetwork = (network: Network) => {
  network.unbind()
  network.doc.destroy()
  const index = networks.indexOf(network)
  if (index > -1) {
    networks.splice(index, 1)
  }
}

// getNetwork(iface: string). Complicated.  We must first find the interface in the local engine object, get the network id, then find the network in the networks array
export const getNetwork = (iface: string) => {
  return networks.find(network => {
    const networkInterface = getEngine().networkInterfaces.find(networkInterface => networkInterface.iface === iface)
    return networkInterface.network && networkInterface.network === network.id
  })
}

export const getNetworks = () => {
  return networks
}

export const getNetworkIds = () => {
  return networks.map(network => network.id)
}

// Create similar operations for the disks
export const addDisk = (device) => {
  log(`Initialising disk ${device}`)
  const disk: Disk = {
    name: device,
    type: 'Apps',
    created: new Date(),
    lastDocked: new Date(),
    removable: false,
    upgradable: false,
    apps: []
  }
  // Add the disk to the local engine
  getEngine().disks.push(disk)
  log(`Disk ${device} initialised`)

  

  // Now generate between 1 to 3 apps for the disk
  // Each generated app is an instance of one of the appMasters from the imported appMasters array random appMaster
  // Each app has a name that is the same as its appMaster name but with a random number between 1 and 5 appended to it
  // Also generate theAppMaster objects from which the instances are created
  const appCount = Math.floor(Math.random() * 3) + 1
  for (let i = 0; i < appCount; i++) {
    const appMaster = appMasters[Math.floor(Math.random() * appMasters.length)]
    const app = {
      instanceOf: appMaster,
      name: `${appMaster.name}${Math.floor(Math.random() * 5)}`,
      status: 'Running' as Status,
      dockerMetrics: {
        memory: os.totalmem().toString(),
        cpu: os.loadavg().toString(),
        network: "",
        disk: ""
      },
      dockerLogs: { logs: [] },
      dockerEvents: { events: [] },
      created: new Date(),
      lastBackedUp: new Date(),
      lastStarted: new Date(),
      upgradable: false,
      backUpEnabled: false
    }
    disk.apps.push(app)
  }
  return disk
}

export const removeDisk = (disk: Disk) => {
  const index = getEngine().disks.indexOf(disk)
  if (index > -1) {
    getEngine().disks.splice(index, 1)
  }
}

export const getDisk = (name: string) => {
  return getEngine().disks.find(disk => disk.name === name)
}

export const getDisks = () => {
  return getEngine().disks
}

export const getDiskNames  = () => {
  return getEngine().disks.map(disk => disk.name)
}

export const getEngine = () => {
  return localEngine
}

// export const get$Engine = () => {
//   return $engine
// }

export const engineApps = (engine: Engine) => {
  return engine.disks.reduce(
      (acc, disk) => {
          return acc.concat(disk.apps)
      }, 
      [])
}

export const networkApps = (network: NetworkData) => {
  return network.engines.reduce(
      (acc, engine) => {
          return acc.concat(engineApps(engine))
      }, 
      [])
}

export const networkDisks = (networkData: NetworkData) => {
  // Collect all disks from all networkData.engines
  // Loop over all networkData.engines and collect all disks in one array called disks
  return networkData.engines.reduce(
      (acc, engine) => {
          return acc.concat(engine.disks)
      }, 
      []
  )
}

// *************
// Subscriptions
// *************

// Watch engine changes and replicate them to all Engine objects in every network
// subscribe(engine, () => {
//   networks.forEach(network => {
//     network.doc.transact(() => {
//       // Find this engine in the engines array of that network
//       const engines = network.doc.getArray('engines') as Array<Map<string | number | Status | Version | DockerEvents | DockerLogs | DockerMetrics>>
//       const remoteCopy = engines.toArray().find(engine => engine.get('hostName') === engine.hostName)
//       if (remoteCopy) {
//         // Update the remote copy with the properties of the local engine
//         network.doc.transact(() => {
//           remoteCopy.set('version', engine.version)
//           remoteCopy.set('status', engine.status)
//           remoteCopy.set('dockerMetrics', engine.dockerMetrics)
//           remoteCopy.set('dockerLogs', engine.dockerLogs)
//           remoteCopy.set('dockerEvents', engine.dockerEvents)
//           remoteCopy.set('lastBooted', engine.lastBooted)
//         })
//       }
//     })
//   })
// })
// subscribe($engine, (update) => {
//   //log(`Local engine has changed to ${deepPrint(engine)}`)
//   log(`LOCAL ENGINE REPLICATION MONITOR: ${deepPrint(update)}`)
//   log(`Replicating changes to all Engine objects in networks with id ${networks.map(network => network.id)}`)
//   networks.forEach(network => {
//     //log(`Replicating changes to network ${network.id}`)
//     network.doc.transact(() => {
//       // Find this engine in the engines array of that network
//       //log(`network.data.engines: ${deepPrint(network.data.engines)}`)
//       const remoteEngine = network.data.engines.find(remoteEngine => remoteEngine.hostName === $engine.hostName)
//       if (remoteEngine) {
//         //log(`Found remote engine ${remoteEngine.hostName}`)
//         // Update the remote copy with the properties of the local engine
//         network.doc.transact(() => {
//           // Object.keys($engine).forEach((key) => {
//           //   remoteEngine[key] = $engine[key]
//           // })
//           // remoteEngine.version = $engine.version
//           // remoteEngine.status = $engine.status
//           // remoteEngine.dockerMetrics = $engine.dockerMetrics
//           // remoteEngine.dockerLogs = $engine.dockerLogs
//           // remoteEngine.dockerEvents = $engine.dockerEvents
//           // remoteEngine.lastBooted = $engine.lastBooted
//         })
//       }
//     })
//   })
// })



// Call keySubscribe for each key in Engine
// Do it
// Object.keys(engine).forEach(key => {
//   keySubscribe(key as keyof Engine)
// })

// const keySubscribe = (key: keyof Engine) => {
//   subscribeKey(engine, key, (value) => {
//     console.log(`store.engine.${key} has changed to ${value}`)
//     networks.forEach(network => {
//       network.doc.transact(() => {
//         // Find this engine in the engines array of that network
//         const remoteEngine = network.data.engines.find(remoteEngine => remoteEngine.hostName === engine.hostName)
//         if (remoteEngine) {
//           // Update the remote copy with the properties of the local engine
//           network.doc.transact(() => {
//             remoteEngine.version = engine.version
//             remoteEngine.status = engine.status
//             remoteEngine.dockerMetrics = engine.dockerMetrics
//             remoteEngine.dockerLogs = engine.dockerLogs
//             remoteEngine.dockerEvents = engine.dockerEvents
//             remoteEngine.lastBooted = engine.lastBooted
//           })
//         }
//       })
//     })
//   })
// }


// Watch engine changes and replicate them to all Engine objects in every network  Use the watch() function of Valtio
// watch((get) => {
//   get(engine)
//   networks.forEach(network => {
//     networks.forEach(network => {
//       network.doc.transact(() => {
//         // Find this engine in the engines array of that network
//         const remoteEngine = network.data.engines.find(remoteEngine => remoteEngine.hostName === engine.hostName)
//         if (remoteEngine) {
//           // Update the remote copy with the properties of the local engine
//           network.doc.transact(() => {
//             remoteEngine.version = engine.version
//             remoteEngine.status = engine.status
//             remoteEngine.dockerMetrics = engine.dockerMetrics
//             remoteEngine.dockerLogs = engine.dockerLogs
//             remoteEngine.dockerEvents = engine.dockerEvents
//             remoteEngine.lastBooted = engine.lastBooted
//           })
//         }
//       })
//     })
//   })
// })





// *************
// Tests
// *************

const testStore = () => {
  setInterval(() => {
    //++engine.lastBooted
    ++getEngine().version.minor
    deepPrint(getNetworks())
  }, 5000)
}

testStore()

// Subscribe to the addition of network Interfaces
// subscribe($engine.networkInterfaces, (update) => {
//   log(`engine.networkInterfaces update: ${deepPrint(update)}`)
//   if (update[0][0] == 'set') {
//     console.log(`LOCAL ENGINE MONITOR: has received a new network interface: ${deepPrint(update[0][2])}`)
//   }
// })

// Subscribe to $engine.lastBooted changes
// subscribeKey($engine, 'lastBooted', (lastBooted) => {
//   console.log(`$engine.lastBooted has changed to ${lastBooted}`)
// })

// // Subscribe to $engine.version.minor changes
// subscribeKey($engine.version, 'minor', (minor) => {
//   console.log(`$engine.version.minor has changed to ${minor}`)
// })

//testStore()



