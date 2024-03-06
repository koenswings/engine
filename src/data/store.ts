//import { Doc } from 'yjs'
import { Network, NetworkInterface, Disk, Engine } from "./dataTypes.js"
import { os } from "zx"
import { proxy, subscribe } from 'valtio'
import { subscribeKey, watch } from 'valtio/utils'
import { deepPrint } from "../utils/utils.js"
import { Array, Map } from "yjs"
import { Status, Version, DockerEvents, DockerLogs, DockerMetrics } from "./dataTypes.js"

// **********
// Definition
// **********

// The root level list of all Networks
const networks: Network[] = []

// The local Engine object which is proxied
const engine = proxy<Engine>({
  hostName: os.hostname(),
  version: {
    major: 1,
    minor: 0
  },
  hostOS: os.type(),
  status: 'Running',
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
)

// **********
// API
// **********

export function addNetwork(network: Network) {
  networks.push(network)
}

export function removeNetwork(network: Network) {
  network.doc.destroy()
  const index = networks.indexOf(network)
  if (index > -1) {
    networks.splice(index, 1)
  }
}

// getNetwork(iface: string). Complicated.  We must first find the interface in the local engine object, get the network id, then find the network in the networks array
export function getNetwork(iface: string) {
  return networks.find(network => {
    const networkId = engine.networkInterfaces.find(networkInterface => networkInterface.iface === iface)?.network
    return networkId && networkId === network.id
  })
}

// export function getNetwork(iface: string) {
//   return networks.find(network => network.networkData.iface === iface)
// }

export function getNetworks() {
  return networks
}

export function getNetworkIds() {
  return networks.map(network => network.id)
}

// Create similar operations for the disks

export function addDisk(disk: Disk) {
  engine.disks.push(disk)
}

export function removeDisk(disk: Disk) {
  const index = engine.disks.indexOf(disk)
  if (index > -1) {
    engine.disks.splice(index, 1)
  }
}

export function getDisk(name: string) {
  return engine.disks.find(disk => disk.name === name)
}

export function getDisks() {
  return engine.disks
}

export function getDiskNames() {
  return engine.disks.map(disk => disk.name)
}

export function getEngine() {
  return engine
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
subscribe(engine, () => {
  networks.forEach(network => {
    network.doc.transact(() => {
      // Find this engine in the engines array of that network
      const remoteEngine = network.data.engines.find(remoteEngine => remoteEngine.hostName === engine.hostName)
      if (remoteEngine) {
        // Update the remote copy with the properties of the local engine
        network.doc.transact(() => {
          remoteEngine.version = engine.version
          remoteEngine.status = engine.status
          remoteEngine.dockerMetrics = engine.dockerMetrics
          remoteEngine.dockerLogs = engine.dockerLogs
          remoteEngine.dockerEvents = engine.dockerEvents
          remoteEngine.lastBooted = engine.lastBooted
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
watch((get) => {
  get(engine)
  networks.forEach(network => {
    networks.forEach(network => {
      network.doc.transact(() => {
        // Find this engine in the engines array of that network
        const remoteEngine = network.data.engines.find(remoteEngine => remoteEngine.hostName === engine.hostName)
        if (remoteEngine) {
          // Update the remote copy with the properties of the local engine
          network.doc.transact(() => {
            remoteEngine.version = engine.version
            remoteEngine.status = engine.status
            remoteEngine.dockerMetrics = engine.dockerMetrics
            remoteEngine.dockerLogs = engine.dockerLogs
            remoteEngine.dockerEvents = engine.dockerEvents
            remoteEngine.lastBooted = engine.lastBooted
          })
        }
      })
    })
  })
})





// *************
// Tests
// *************

const testStore = () => {
  setInterval(() => {
    ++engine.lastBooted
    ++engine.version.minor
  }, 5000)
}

// Subscribe to all store changes
subscribe(engine, () => {
  console.log(`Local engine has changed`)
})

// Subscribe to engine changes
subscribe(engine, () => {
  console.log(`Engine has changed to ${deepPrint(engine)}`)

})

// Subscribe to engine.lastBooted changes
subscribeKey(engine, 'lastBooted', (lastBooted) => {
  console.log(`store.engine.lastBooted has changed to ${lastBooted}`)
})

// Subscribe to engine.version.minor changes
subscribeKey(engine.version, 'minor', (minor) => {
  console.log(`store.engine.version.minor has changed to ${minor}`)
})

testStore()



