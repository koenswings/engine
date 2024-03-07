//import { Doc } from 'yjs'
import { Network, NetworkInterface, NetworkData, Disk, Engine, Status } from "./dataTypes.js"
import { os } from "zx"
import { proxy, subscribe, ref } from 'valtio'
import { subscribeKey, watch } from 'valtio/utils'
import { bind } from 'valtio-yjs'
import { deepPrint, log } from "../utils/utils.js"
import { Doc, Array, Map } from "yjs"
import { WebsocketProvider } from '../yjs/y-websocket.js'
import { enableYjsWebSocketService } from '../services/yjsWebSocketService.js'

// **********
// Definition
// **********

// The root level list of all Networks
const networks: Network[] = []

// The local Engine object which is proxied
const engine = {
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
}

const $engine = proxy<Engine>(engine)

// **********
// API
// **********

export const addNetwork = (iface, ip4, net) => {
  log(`Initialising a new network for interface ${iface} with IP4 address ${ip4} and netmask ${net}`)
  const networkDoc = new Doc()

  // Create the YMap for the network data
  const yNetworkData = networkDoc.getMap('data')

  // Create a valtio state for the network data
  // First clone the result of getEngine() into a new object. Do NOT use JSON.parse(JSON.stringify(getEngine())) 
  const engine = { ...getEngine() }
  // Remove all networkInterfaces from the cloned engine object except the one that corresponds with the network we are currently adding
  // We do not want other engines to see what networks this engine is connected to
  engine.networkInterfaces = engine.networkInterfaces.filter(networkInterface => networkInterface.iface === iface)
  // Now add the cloned engine object to the networkData
  const networkData: NetworkData = proxy<NetworkData>({
    engines: [engine],
  });

  // Bind the Valtio proxy to the Yjs object
  const unbind = bind(networkData, yNetworkData);
  log(`Interface ${iface}: Created a Valtio-yjs proxy for networkData`)

  // Enable the Yjs WebSocket service for this network
  enableYjsWebSocketService(ip4, '1234')
  const wsProvider = new WebsocketProvider(`ws://${ip4}:1234`, 'appdocker', networkDoc)
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

  // Create a NetworkInterface
  const networkInterface = {
    network: network.id,
    iface: iface,
    ip4: ip4,
    netmask: net
  }
  // And add it to the local engine
  get$Engine().networkInterfaces.push(networkInterface)
  log(`Interface ${iface}: Network interface added to local engine`)

  // TEMPORARY: Monitor networkData for changes using a Valtio subscription
  subscribe(networkData.engines, (value) => {
    console.log(`Interface ${iface}: Engines was modified. Engines is now: ${deepPrint(value)}`)
  })
  log('Interface ${iface}: Subscribed to networkData.engines')
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
    const networkInterface = engine.networkInterfaces.find(networkInterface => networkInterface.iface === iface)
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
  engine.disks.push(disk)
  log(`Disk ${device} initialised`)
  return disk
}

export const removeDisk = (disk: Disk) => {
  const index = engine.disks.indexOf(disk)
  if (index > -1) {
    engine.disks.splice(index, 1)
  }
}

export const getDisk = (name: string) => {
  return engine.disks.find(disk => disk.name === name)
}

export const getDisks = () => {
  return engine.disks
}

export const getDiskNames  = () => {
  return engine.disks.map(disk => disk.name)
}

export const getEngine = () => {
  return engine
}

export const get$Engine = () => {
  return $engine
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
subscribe($engine, () => {
  //log(`Local engine has changed to ${deepPrint(engine)}`)
  log(`Replicating changes to all Engine objects in networks with id ${networks.map(network => network.id)}`)
  networks.forEach(network => {
    //log(`Replicating changes to network ${network.id}`)
    network.doc.transact(() => {
      // Find this engine in the engines array of that network
      //log(`network.data.engines: ${deepPrint(network.data.engines)}`)
      const remoteEngine = network.data.engines.find(remoteEngine => remoteEngine.hostName === $engine.hostName)
      if (remoteEngine) {
        //log(`Found remote engine ${remoteEngine.hostName}`)
        // Update the remote copy with the properties of the local engine
        network.doc.transact(() => {
          remoteEngine.version = $engine.version
          remoteEngine.status = $engine.status
          remoteEngine.dockerMetrics = $engine.dockerMetrics
          remoteEngine.dockerLogs = $engine.dockerLogs
          remoteEngine.dockerEvents = $engine.dockerEvents
          remoteEngine.lastBooted = $engine.lastBooted
        })
      }
    })
  })
})



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
    ++$engine.lastBooted
    ++$engine.version.minor
  }, 5000)
}

// Subscribe to the addition of network Interfaces
subscribe($engine.networkInterfaces, (val) => {
  console.log(`Local Engine has received a new network interface: ${deepPrint(val)}`)

})

// Subscribe to $engine.lastBooted changes
subscribeKey($engine, 'lastBooted', (lastBooted) => {
  console.log(`$engine.lastBooted has changed to ${lastBooted}`)
})

// Subscribe to $engine.version.minor changes
subscribeKey($engine.version, 'minor', (minor) => {
  console.log(`$engine.version.minor has changed to ${minor}`)
})

testStore()



