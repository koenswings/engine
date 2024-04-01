//import { Doc } from 'yjs'
import { Network, NetworkInterface, NetworkData, Disk, App, Engine, Status, Command, RunningServers, Listener, Instance } from "./dataTypes.js"
// import { appMasters } from "./data.js"
import { proxy, subscribe, ref, snapshot } from 'valtio'
import { subscribeKey, watch } from 'valtio/utils'
import { bind } from '../valtio-yjs/index.js'
import { deepPrint, log } from "../utils/utils.js"
import { Doc, Array, Map } from "yjs"
import { WebsocketProvider } from '../y-websocket/y-websocket.js'
import { $, question, chalk, cd, YAML, fs, os } from 'zx';

import lodash from 'lodash'

import { Console } from "console"
import { enableWebSocketMonitor } from "../monitors/webSocketMonitor.js"
import { enableNetworkDataCommandsMonitor, enableNetworkDataGlobalMonitor } from "../monitors/networkDataMonitor.js"
import { changeTest, enableTimeMonitor } from "../monitors/timeMonitor.js"
import { run } from "lib0/testing.js"
const { cloneDeep } = lodash
//const { bind } = await import('valtio-yjs')

// ***********
// Definitions
// ***********

// The root level list of all Networks
const networks: Network[] = []

// The local Engine object running on port 1234
const localEngine = {
  hostName: os.hostname(),
  version: "1.0",
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
const $localEngine = proxy<Engine>(localEngine)
//log(`Proxied engine object: ${deepPrint($localEngine, 2)}`)


const runningServers: RunningServers = {}

const listeners: Listener[] = []


// **********
// API
// **********



export const addNetwork = (ifaceName, networkName, ip4, netmask) => {
  log(`Connecting engine to network ${networkName} over interface ${ifaceName} with IP4 address ${ip4} and netmask ${netmask}`)

  // Check if we already have a network with the same name; this means the engine was already connected to the network but over a different interface
  let network: Network = networks.find(network => network.name === networkName)
  let networkDoc: Doc, networkData: NetworkData

  if (network) {

    log(`Engine was already connected to network ${networkName} over a different interface. No new network created`)
    networkDoc = network.doc
    networkData = network.data

  } else {

    log(`Initialising network ${networkName}`)

    // Create a Yjs document for the network
    networkDoc = new Doc()
    log(`Created a Yjs document for network ${networkName} with id ${networkDoc.clientID}`)

    // Create the YMap for the network data
    const yNetworkData = networkDoc.getMap('data')

    // Now add the proxied engine object to the networkData
    // Valtio supports nesting of proxied objects 
    networkData = proxy<NetworkData>({});
    networkData.engines = [getEngine()]

    // Bind the Valtio proxy to the Yjs object
    const unbind = bind(networkData, yNetworkData);
    //log(`Interface ${ifaceName}: Created a Valtio-yjs proxy for networkData`)

    // Create a Network object
    network = {
      name: networkName,
      doc: networkDoc,
      data: networkData,
      yData: yNetworkData,
      unbind: unbind,
      wsProviders: {},
    }

    // And add it to the networks array
    networks.push(network)


    // Add subscriptions

    enableNetworkDataGlobalMonitor(networkData, networkName)

    //enableNetworkDataCommandsMonitor(networkData, networkName)

    log(`Network ${network.name} initialised and added to the store`)
  }

  // Enable the Yjs WebSocket service for this interface if it is not already enabled
  if (!runningServers.hasOwnProperty(ip4)) {
    enableWebSocketMonitor(ip4, '1234')
    runningServers[ip4] = true
  } else {
    log(`WebSocket server already running on ${ip4}`)
  }
  const wsProvider = new WebsocketProvider(`ws://${ip4}:1234`, networkName, networkDoc)
  // Add the wsProvider to the wsProviders object of the network
  network.wsProviders[ifaceName] = wsProvider
  wsProvider.on('status', (event: { status: any; }) => {
    if (event.status === 'connected') {
      log(`${event.status} on ws://${ip4}:1234`) // logs "connected" or "disconnected"
    } else if (event.status === 'disconnected') {
      log(`${event.status} from ws://${ip4}:1234`) // logs "connected" or "disconnected"
    } else {
      log(`Unknown status ${event.status} from ws://${ip4}:1234`)
    }
  })
  log(`Interface ${ifaceName}: Created an Yjs websocket client connection on adddress ws://${ip4}:1234 with room name ${networkName}`)

  // Create a NetworkInterface
  const networkInterface = {
    network: networkName,
    iface: ifaceName,
    ip4: ip4,
    netmask: netmask,
    //wsProvider: wsProvider
  }
  // And add it to the local engine
  getEngine().networkInterfaces.push(networkInterface)
  log(`Network Interface ${networkName} via ${ifaceName} added to local engine`)
  //log(`Engine: ${deepPrint(getEngine(), 2)}`)



  // Enable random array population for the apps array
  // enableRandomArrayPopulation(apps)


}

export const removeNetwork = (network: Network) => {
  log(`Removing network ${network.name} from the store`)
  log(`Unbinding network ${network.name}`)
  network.unbind()
  log(`Destroying network ${network.name}`)
  network.doc.destroy()
  log(`Destroying wsProviders for network ${network.name}`)
  Object.keys(network.wsProviders).forEach(iface => network.wsProviders[iface].destroy())
  log(`Removing network ${network.name} from the networks array`)
  const index = networks.indexOf(network)
  if (index > -1) {
    networks.splice(index, 1)
  }
}

export const getNetworksForInterface = (iface: string) => {
  // Filter all network interfaces for the specified interface
  const networkInterfaces = getEngine().networkInterfaces.filter(networkInterface => networkInterface.iface === iface)

  // Now find the networks for these interfaces
  return networks.filter(network => {
    return networkInterfaces.find(networkInterface => networkInterface.network === network.name)
  })
}

export const getNetworks = () => {
  return networks
}

export const getNetwork = (name: string) => {
  return networks.find(network => network.name === name)
}

export const getNetworkNames = () => {
  return networks.map(network => network.name)
}

// Create similar operations for the disks
export const addAppDisk = async (device, diskName, created) => {
  log(`Adding app disk ${diskName} on device ${device}`)
  const disk: Disk = {
    name: diskName,
    device: device,
    type: 'Apps',
    created: created,
    lastDocked: new Date().getTime(),
    removable: false,
    upgradable: false,
    apps: [],
    instances: []
  }
  // Add the disk to the local engine
  getEngine().disks.push(disk)
  log(`Disk ${diskName} pushed to local engine`)

  // Call addApp for each folder found in /disks/diskName/apps
  const apps = (await $`ls /disks/${device}/apps`).stdout.split('\n')
  log(`Apps found on disk ${diskName}: ${apps}`)
  apps.forEach(async appFolder => {
    if (!(appFolder === "")) {
      try {
        // Read the compose.yaml file in the app folder
        const appComposeFile = await $`cat /disks/${device}/apps/${appFolder}/compose.yaml`
        const appCompose = YAML.parse(appComposeFile.stdout)
        const app = {
          name: appCompose['x-app'].name,
          version: appCompose['x-app'].version,
          title: appCompose['x-app'].title,
          description: appCompose['x-app'].description,
          url: appCompose['x-app'].url,
          category: appCompose['x-app'].category,
          icon: appCompose['x-app'].icon,
          author: appCompose['x-app'].author
        }
        addApp(disk, app)
      }

      catch (e) {
        console.log(chalk.red(`Error adding app ${appFolder.slice(0, -1)} on disk ${diskName}`))
        console.error(e)
      }
    }
  })

  // Call startInstance for each folder found in /instances
  const instances = (await $`ls /disks/${device}/instances`).stdout.split('\n')
  log(`Instances found on disk ${diskName}: ${instances}`)
  instances.forEach(async instanceFolder => {
    if (!(instanceFolder === "")) {
      startInstance(instanceFolder, diskName)
    }

  })

  // Temporary code simulating an analysis of the apps found on the disk

  // Now generate between 1 to 3 apps for the disk
  // Each generated app is an instance of one of the appMasters from the imported appMasters array random appMaster
  // Each app has a name that is the same as its appMaster name but with a random number between 1 and 5 appended to it
  // Also generate theAppMaster objects from which the instances are created
  // const appCount = Math.floor(Math.random() * 3) + 1
  // for (let i = 0; i < appCount; i++) {
  //   const appMaster = appMasters[Math.floor(Math.random() * appMasters.length)]
  //   const app = {
  //     instanceOf: appMaster,
  //     name: `${appMaster.name}${Math.floor(Math.random() * 5)}`,
  //     status: 'Running' as Status,
  //     port: Math.floor(Math.random() * 1000) + 3000,
  //     dockerMetrics: {
  //       memory: os.totalmem().toString(),
  //       cpu: os.loadavg().toString(),
  //       network: "",
  //       disk: ""
  //     },
  //     dockerLogs: { logs: [] },
  //     dockerEvents: { events: [] },
  //     created: new Date().getTime(),
  //     lastBackedUp: new Date().getTime(),
  //     lastStarted: new Date().getTime(),
  //     upgradable: false,
  //     backUpEnabled: false
  //   }
  //   // Add the app to the disk
  //   addApp(disk, app)
  //}
  return disk
}

export const createInstance = async (instanceName: string, typeName: string, version: string, diskName: string) => {
  console.log(`Creating instance '${instanceName}' from version ${version} of app '${typeName}' on disk '${diskName}' of engine '${getEngine().hostName}'.`)

  // CODING STYLE: only use absolute pathnames !
  // CODING STYLE: use try/catch for error handling

  const disk = getDisk(diskName)
  let device
  if (disk) {
    device = disk.device
  } else {
    console.log(chalk.red(`Disk ${diskName} not found on engine ${getEngine().hostName}`))
    return
  }

  try {

    // Create the app infrastructure if it does not exist
    // TODO: This should be done when creating the disk
    // TODO: Here we should only be checking if it is an apps disk! 
    await $`mkdir -p /disks/${device}/apps /disks/${device}/services /disks/${device}/instances`


    // **************************
    // STEP 1 - App Type creation
    // **************************

    // Clone the app from the repository
    // Remove /tmp/apps/${typeName} if it exists
    await $`rm -rf /tmp/apps/${typeName}`
    let appVersion = ""
    if (version === "latest_dev") {
      await $`git clone https://github.com/koenswings/app-${typeName} /tmp/apps/${typeName}`
      // Set appVersion to the latest commit hash
      const gitLog = await $`cd /tmp/apps/${typeName} && git log -n 1 --pretty=format:%H`
      appVersion = gitLog.stdout.trim()
      log(`App version: ${appVersion}`)

    } else {
      await $`git clone -b ${version} https://github.com/koenswings/app-${typeName} /tmp/apps/${typeName}`
      appVersion = version
    }


    // Create the app type
    // Overwrite if it exists
    // We want to copy the content of a directory and rename the directory at the same time: 
    //   See https://unix.stackexchange.com/questions/412259/how-can-i-copy-a-directory-and-rename-it-in-the-same-command
    await $`cp -fr /tmp/apps/${typeName}/. /disks/${device}/apps/${typeName}-${appVersion}/`


    // **************************
    // STEP 2 - App Instance creation
    // **************************

    // Create the app instance
    // If there is already a instance with the name instanceName, try instanceName-1, instanceName-2, etc.
    let instanceNumber = 1
    let baseInstanceName = instanceName
    while (true) {
      try {
        await $`mkdir /disks/${device}/instances/${instanceName}`
        break
      } catch (e) {
        instanceNumber++
        instanceName = `${baseInstanceName}-${instanceNumber}`
      }
    }
    // Again use /. to specify the content of the dir, not the dir itself 
    await $`cp -fr /tmp/apps/${typeName}/. /disks/${device}/instances/${instanceName}/`

    // If the app has an init_data.tar.gz file, unpack it in the app folder
    if (fs.existsSync(`/disks/${device}/instances/${instanceName}/init_data.tar.gz`)) {
      await $`tar -xzf /disks/${device}/instances/${instanceName}/init_data.tar.gz -C /disks/${device}/instances/${instanceName}`
      // Rename the folder init_data to data
      await $`mv /disks/${device}/instances/${instanceName}/init_data /disks/${device}/instances/${instanceName}/data`
      // Remove the init_data.tar.gz file
      await $`rm /disks/${device}/instances/${instanceName}/init_data.tar.gz`
    }

    // Open the compose.yaml file of the app instance and add the version info to the compose file
    const composeFile = await $`cat /disks/${device}/instances/${instanceName}/compose.yaml`
    const compose = YAML.parse(composeFile.stdout)
    compose['x-app'].version = appVersion
    const composeYAML = YAML.stringify(compose)
    await $`echo ${composeYAML} > /disks/${device}/instances/${instanceName}/compose.yaml`

    // Remove the temporary app folder
    await $`rm -rf /tmp/apps/${typeName}`

    // **************************
    // STEP 3 - Persist the services
    // **************************

    // Extract the service images of the services from the compose file, and then pull them and save them in /services
    const services = compose.services
    for (const serviceName in services) {
      const serviceImage = services[serviceName].image
      // Pull the sercice image
      await $`docker image pull ${serviceImage}`
      // Save the sercice image
      await $`docker save ${serviceImage} > /disks/${device}/services/${serviceImage.replace(/\//g, '_')}.tar`
    }


    console.log(chalk.green(`App ${instanceName} created`))
  } catch (e) {
    console.log(chalk.red('Error creating app instance'))
    console.error(e)
  }
}

export const startInstance = async (instanceName: string, diskName: string) => {
  console.log(`Starting instance '${instanceName}' on disk ${diskName} of engine '${getEngine().hostName}'.`)

  // Check if disk exists
  const disk = getDisk(diskName)
  if (!disk) {
    console.log(chalk.red(`Disk ${diskName} not found on engine ${getEngine().hostName}`))
    return
  }
  const device = disk.device

  // Check if there is a folder called instanceName on /disks/diskName
  // If not, log an error and return
  const instanceExists = fs.existsSync(`/disks/${device}/instances/${instanceName}`)
  if (!instanceExists) {
    console.log(chalk.red(`Instance ${instanceName} not found on disk ${diskName}`))
    return
  }

  try {

    // **************************
    // STEP 1 - Port generation
    // **************************

    // Generate a port  number for the app  and assign it to the variable port
    // Start from port number 3000 and check if the port is already in use by another app
    // The port is in use by another app if an app can be found in networkdata with the same port
    let port = 3000
    const instances = engineInstances(getEngine())
    while (true) {
      const instance = instances.find(instance => instance.port == port)
      if (instance) {
        port++
      } else {
        break
      }
    }
    console.log(`Port: ${port}`)

    // ALternative is to check the system for an occipied port
    // await $`netstat -tuln | grep ${port}`
    // But this prevents us from finding apps that are stopped by the user
    // let port = 3000
    // let portInUse = true
    // while (portInUse) {
    //     try {
    //         await $`nc -z localhost ${port}`
    //         port++
    //     } catch (e) {
    //         portInUse = false
    //     }
    // }

    // Write a .env file in which you define the port variable
    // Do it
    await $`echo "port=${port}" > /disks/${device}/instances/${instanceName}/.env`


    // **************************
    // STEP 2 - Preloading of services
    // **************************

    // Extract the service images of the services from the compose file, and pull them
    // Open the compose.yaml file of the app instance
    const composeFile = await $`cat /disks/${device}/instances/${instanceName}/compose.yaml`
    const compose = YAML.parse(composeFile.stdout)
    const services = compose.services
    for (const serviceName in services) {
      const serviceImage = services[serviceName].image
      // Load the service image from the saved tar file
      await $`docker image load < /disks/${device}/services/${serviceImage.replace(/\//g, '_')}.tar`
    }

    // **************************
    // STEP 3 - Container creation
    // **************************

    await $`docker compose -f /disks/${device}/instances/${instanceName}/compose.yaml create`

    // **************************
    // STEP 4 - Update network data
    // **************************

    const app: App = {
      name: compose['x-app'].name,
      version: compose['x-app'].version,
      title: compose['x-app'].title,
      description: compose['x-app'].description,
      url: compose['x-app'].url,
      category: compose['x-app'].category,
      icon: compose['x-app'].icon,
      author: compose['x-app'].author
    }

    // Add the app to the local engine
    const instance: Instance = {
      instanceOf: app.name,
      name: instanceName,
      status: 'Stopped' as Status,
      port: port,
      dockerMetrics: {
        memory: os.totalmem().toString(),
        cpu: os.loadavg().toString(),
        network: "",
        disk: ""
      },
      dockerLogs: { logs: [] },
      dockerEvents: { events: [] },
      created: new Date().getTime(),
      lastBackedUp: 0,
      lastStarted: 0,
      upgradable: false,
      backUpEnabled: false
    }

    addApp(disk, app)
    addInstance(disk, instance)

    // **************************
    // STEP 5 - run the Instance
    // **************************

    await runInstance(instanceName, diskName)

    console.log(chalk.green(`App ${instanceName} started`))
  }

  catch (e) {
    console.log(chalk.red('Error starting app instance'))
    console.error(e)
  }
}

export const runInstance = async (instanceName: string, diskName: string) => {
  console.log(`Running instance '${instanceName}' on disk ${diskName} of engine '${getEngine().hostName}'.`)

  // CODING STYLE: only use absolute pathnames !
  // CODING STYLE: use try/catch for error handling

  // Find out on which disk this app is running by finding the disk object that has this app instance in its instances array
  // const disk = getEngine().disks.find(disk => disk.instances.find(instance => instance.name === instanceName))

  // Check if disk exists
  const disk = getDisk(diskName)
  if (!disk) {
    console.log(chalk.red(`Disk ${diskName} not found on engine ${getEngine().hostName}`))
    return
  }
  const device = disk.device

  // Check if the instance exists
  const instance = disk.instances.find(instance => instance.name === instanceName)
  if (!instance) {
    const instanceExists = fs.existsSync(`/disks/${device}/instances/${instanceName}`)
    if (!instanceExists) {  
      console.log(chalk.red(`Instance ${instanceName} not found on disk ${diskName}`))
      return
    } else {
      console.log(chalk.red(`Instance ${instanceName} on disk ${diskName} has not yet been started`))
      return
    }
  }

  try {

    // Compose up the app
    await $`docker compose -f /disks/${device}/instances/${instanceName}/compose.yaml up -d`

    // Modify the status of the instance
    instance.status = 'Running'
    // Modify the lastStarted time of the instance
    instance.lastStarted = new Date().getTime()
    // Modify the dockerMetrics of the instance
    instance.dockerMetrics = {
      memory: os.totalmem().toString(),
      cpu: os.loadavg().toString(),
      network: "",
      disk: ""
    }

    // Modify the dockerLogs of the instance
    // instance.dockerLogs = { logs: await $`docker logs ${instanceName}` }  // This is not correct, we need to use the right container name
    // Modify the dockerEvents of the instance
    // instance.dockerEvents = { events: await $`docker events ${instanceName}` }  // This is not correct, we need to use the right container name

    console.log(chalk.green(`App ${instanceName} running`))

  } catch (e) {
    
    console.log(chalk.red('Error running app instance'))
    console.error(e)
  
  }
}

export const stopInstance = async (instanceName: string, diskName: string) => {
  console.log(`Stopping app '${instanceName}' on disk '${diskName}' of engine '${getEngine().hostName}'.`)

  // CODING STYLE: only use absolute pathnames !
  // CODING STYLE: use try/catch for error handling

  // Find out on which disk this app is running by finding the disk object that has this app instance in its instances array
  // const disk = getEngine().disks.find(disk => disk.instances.find(instance => instance.name === instanceName))

  // Check if disk exists
  const disk = getDisk(diskName)
  if (!disk) {
    console.log(chalk.red(`Disk ${diskName} not found on engine ${getEngine().hostName}`))
    return
  }
  const device = disk.device

  // Check if the instance exists
  const instance = disk.instances.find(instance => instance.name === instanceName)
  if (!instance) {
    console.log(chalk.red(`Instance ${instanceName} not found on disk ${diskName}`))
    return
  }

  try {
    // Compose stop the app
    // Do it
    await $`docker compose -f /disks/${device}/instances/${instanceName}/compose.yaml stop`
    console.log(chalk.green(`App ${instanceName} stopped`))
  } catch (e) {
    console.log(chalk.red('Error stopping app instance'))
    console.error(e)
  }
}


// Function findApp that searches for an app with the specified name and version on the specified disk
export const findApp = (disk: Disk, appName: string, version: string) => {
  return disk.apps.find(app => app.name === appName && app.version === version)
}

export const findInstance = (disk: Disk, instanceName: string) => {
  return disk.instances.find(instance => instance.name === instanceName)
}


export const addInstance = (disk: Disk, instance: Instance) => {
  if (!findInstance(disk, instance.name)) {
    disk.instances.push(instance)
  }
}

export const addApp = (disk: Disk, app: App) => {
  if (!findApp(disk, app.name, app.version)) {
    disk.apps.push(app)
  }
}


export const removeDisk = (disk: Disk) => {
  const index = getEngine().disks.indexOf(disk)
  if (index > -1) {
    getEngine().disks.splice(index, 1)
  }
}

// Get the disk object for a given device on the local engine
export const getDiskOnDevice = (device: string) => {
  return getEngine().disks.find(disk => disk.device === device)
}

// Get the disk object for a given name on the local engine
export const getDisk = (name: string) => {
  return getEngine().disks.find(disk => disk.name === name)
}

export const getDisks = () => {
  return getEngine().disks
}

export const getDiskNames = () => {
  return getEngine().disks.map(disk => disk.name)
}

export const getEngine = () => {
  return $localEngine
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

export const engineInstances = (engine: Engine) => {
  return engine.disks.reduce(
    (acc, disk) => {
      return acc.concat(disk.instances)
    },
    [])
}

export const networkInstances = (network: NetworkData) => {
  return network.engines.reduce(
    (acc, engine) => {
      return acc.concat(engineInstances(engine))
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

export const addListener = (iface: string, networkName: string, listener: (data: any) => void) => {
  listeners[iface + networkName] = listener
}

export const removeListener = (iface: string, networkName: string) => {
  delete listeners[iface + networkName]
}

export const getListeners = () => {
  return listeners
}

export const getListener = (iface: string, networkName: string) => {
  if (listeners.hasOwnProperty(iface + networkName)) {
    return listeners[iface + networkName]
  } else {
    return null
  }
}

export const getNetworkInterface = (iface: string, networkName: string) => {
  return getEngine().networkInterfaces.find((netiface) => netiface.iface === iface && netiface.network === networkName)
}

export const removeNetworkInterface = (networkInterface: NetworkInterface) => {
  const iface = networkInterface.iface
  const networkName = networkInterface.network
  // Remove the network interface from the localEngine
  log(`Removing network interface ${iface}/${networkName} from localEngine`)
  getEngine().networkInterfaces = getEngine().networkInterfaces.filter((netiface) => !(netiface.iface == iface && netiface.network == networkName))

  // If the localEngine no longer has network interfaces connected to the Network, remove the network 
  if (getEngine().networkInterfaces.filter((netiface) => netiface.network === networkName).length === 0) {
    log(`Removing network ${networkName} from localEngine`)
    removeNetwork(getNetwork(networkName))
  }
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



