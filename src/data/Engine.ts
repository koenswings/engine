import { $, os } from 'zx';
import { deepPrint, log, sameNet } from '../utils/utils.js';
import { readMeta, DiskMeta } from './Meta.js';
import { Version, DockerMetrics, DockerLogs, DockerEvents, Command, Hostname, Timestamp, InterfaceName, DiskID, IPAddress, NetMask, CIDR, EngineID, DeviceName} from './CommonTypes.js';
import { Disk, getApps, getInstances } from './Disk.js';
import { proxy } from 'valtio';
import { config } from './Config.js';
import { Store, getDisk } from './Store.js';
import { addEngineToAppnet } from './Appnet.js';
import { bind } from '../valtio-yjs/index.js';
import { App } from './App.js';
import { Instance } from './Instance.js';

export interface Engine {
    id: EngineID,
    hostName?: Hostname;
    version?: Version;
    hostOS?: string;
    dockerMetrics?: DockerMetrics;
    dockerLogs?: DockerLogs;
    dockerEvents?: DockerEvents;
    created?: Timestamp;
    lastBooted?: Timestamp; // We must use a timestamp number as Date objects are not supported in YJS
    lastRun?: Timestamp; 
    //disks?: Disk[];
    disks: {[key:DiskID]:boolean};
    //networkInterfaces: NetworkInterface[];
    restrictedInterfaces?: InterfaceName[]    
    connectedInterfaces?: {[key: InterfaceName]: Interface} // The key is the interface name and the value is the Interface object
    commands?: Command[];
    //commands?: YArrayRef;
}

// We give an engine an Interface once it has an IP address on that interface
export interface Interface {
    name: InterfaceName,
    ip4: IPAddress,
    netmask: NetMask,
    cidr: CIDR
}

// const initialiseLocalEngine = async ():Promise<Engine> => {

//     const meta: DiskMeta = await readMeta()
//     if (!meta) {
//         console.error(`No meta file found on root disk. Cannot create local engine. Exiting.`)
//         process.exit(1)
//     }

//     const $localEngine = proxy<Engine>({})
//     $localEngine.id = meta.id
//     $localEngine.hostName = os.hostname()
//     $localEngine.version = meta.version
//     $localEngine.hostOS = os.type()
//     $localEngine.dockerMetrics = {
//             memory: os.totalmem().toString(),
//             cpu: os.loadavg().toString(),
//             network: "",
//             disk: ""
//         }
//     $localEngine.dockerLogs = { logs: [] }
//     $localEngine.dockerEvents = { events: [] }
//     $localEngine.created = meta.created
//     $localEngine.lastBooted = (new Date()).getTime()
//     $localEngine.disks = []
//     $localEngine.restrictedInterfaces = config.settings.interfaces ? config.settings.interfaces : []
//     $localEngine.connectedInterfaces = {}
//     $localEngine.commands = []
//     //log(`Proxied engine object: ${deepPrint($localEngine, 2)}`)
//     return $localEngine
// }

// const updateLocalEngine = async ():Promise<Engine> => {
//     const meta: DiskMeta = await readMeta()
//     if (!meta) {
//         console.error(`No meta file found on root disk. Cannot create local engine. Exiting.`)
//         process.exit(1)
//     }
//     const $localEngine = proxy<Engine>({})
//     $localEngine.id = meta.id
//     $localEngine.hostName = os.hostname()
//     $localEngine.version = meta.version
//     $localEngine.hostOS = os.type()
//     $localEngine.dockerMetrics = {
//         memory: os.totalmem().toString(),
//         cpu: os.loadavg().toString(),
//         network: "",
//         disk: ""
//     }
//     $localEngine.created = meta.created
//     $localEngine.lastBooted = (new Date()).getTime()
//     $localEngine.restrictedInterfaces = config.settings.interfaces ? config.settings.interfaces : []
//     return $localEngine
// }

export const initialiseLocalEngine = async (store:Store):Promise<Engine> => {

    const meta: DiskMeta | undefined = await readMeta()
    if (!meta) {
        console.error(`No meta file found on root disk. Cannot create local engine. Exiting.`)
        process.exit(1)
    }

    const $localEngine = proxy<Engine>({
        id: meta.id as EngineID,
        disks: proxy<{[key:DiskID]:boolean}>({}) 
     })
    // $localEngine.id = meta.id as EngineID
    $localEngine.hostName = os.hostname() as Hostname
    $localEngine.version = meta.version
    $localEngine.hostOS = os.type()
    $localEngine.dockerMetrics = {
            memory: os.totalmem().toString(),
            cpu: os.loadavg().toString(),
            network: "",
            disk: ""
        }
    $localEngine.dockerLogs = { logs: [] }
    $localEngine.dockerEvents = { events: [] }
    $localEngine.created = meta.created
    $localEngine.lastBooted = (new Date()).getTime() as Timestamp
    $localEngine.lastRun = (new Date()).getTime() as Timestamp
    // $localEngine.disks = proxy<{[key:DiskID]:boolean}>({}) 
    $localEngine.restrictedInterfaces = config.settings.interfaces ? config.settings.interfaces : []
    $localEngine.connectedInterfaces = {}
    $localEngine.commands = []
    //log(`Proxied engine object: ${deepPrint($localEngine, 2)}`)

    // Store the engine
    store.engineDB[$localEngine.id] = $localEngine

    // Bind to networks and maintain the lists
    store.networks.forEach((network) => {
        // Bind the localEngine to the network
        const yLocalEngine = network.doc.getMap($localEngine.id)
        network.unbind = bind($localEngine as Record<string, any>, yLocalEngine)
        log(`Bound local engine ${$localEngine.id} to network ${network.appnet.name}`)

        // Add the localEngine to the engines set of the network
        // Since we have DIFFERENT AppNet objects for each Network, we need to add the engine to each AppNet
        addEngineToAppnet(network.appnet, $localEngine.id)        

        // Bind the proxy for the disk Ids array to a corresponding Yjs Map
        bind($localEngine.disks, network.doc.getMap(`${$localEngine.id}_disks`))
    })

    return $localEngine
}


export const getDisks = (store:Store, engine: Engine):Disk[] => {
    return Object.keys(engine.disks).map(diskId => store.diskDB[diskId])
}


export const addCommand = (engine: Engine, command: Command):void => {
    log(`Adding command ${command} to engine ${engine.hostName}`)
    if (engine.commands) engine.commands.push(command)
}


export const findDisk = (store:Store, engine: Engine, diskId: DiskID): Disk | undefined => {
    const hasDisk = engine.disks[diskId]
    return hasDisk ? store.diskDB[diskId] : undefined
}

// export const findDiskByName = (store:Store, engine: Engine, diskName: Hostname): Disk | undefined => {
//     const diskIds = Object.keys(engine.disks) as DiskID[]
//     const diskId = diskIds.find(diskId => {
//         const disk = getDisk(store, diskId)
//         return disk && disk.name === diskName
//     })
//     return diskId ? store.diskDB[diskId] : undefined
// }

export const findDiskByName = (store:Store, engine: Engine, diskName: Hostname): Disk | undefined => {
    return getDisks(store, engine).find(disk => disk.name === diskName)
}

// export const findDiskByDevice = (store:Store, engine: Engine, device: string):Disk | undefined => {
//     const diskIds = Object.keys(engine.disks) as DiskID[]
//     const diskId = diskIds.find(diskId => {
//         const disk = getDisk(store, diskId)
//         return disk && disk.device === device
//     })
//     return diskId ? store.diskDB[diskId] : undefined
// }

export const findDiskByDevice = (store:Store, engine: Engine, device: DeviceName):Disk | undefined => {
    return getDisks(store, engine).find(disk => disk.device === device)
}


// export const getDiskNames = (store:Store, engine:Engine) => {
//     const diskIds = Object.keys(engine.disks) as DiskID[]
//     return diskIds.flatMap(diskId => {
//         const disk = getDisk(store, diskId)
//         return disk ? disk.name : []
//     })
// }
export const getDiskNames = (store:Store, engine:Engine):Hostname[] => {
    return getDisks(store, engine).map(disk => disk.name)
}


// export const addDisk = (store:Store, engine: Engine, disk: Disk):void => {
//     log(`Updating disk ${disk.name} of engine ${engine.hostName}:`)

//     // Check if engine already has the disk
//     const diskIds = Object.keys(engine.disks) as DiskID[]
//     const existingDisk = findDisk(store, engine, disk.id)
//     if (existingDisk) {
//         log(`Engine ${engine.hostName} already has disk ${disk.name}. Merging the new disk with the existing disk.`)
//         Object.assign(existingDisk, disk)
//     } else {
//         //log(deepPrint(disk))
//         log(`Pushing a new disk ${disk.name} to engine ${engine.hostName}`)
//         engine.disks[disk.id] = true
//     }
// }

export const addDisk = (engine: Engine, disk: Disk):void => {
    engine.disks[disk.id] = true
}

export const removeDisk = (engine: Engine, diskId: DiskID):void => {
    // const index = engine.disks.indexOf(disk)
    // if (index > -1) {
    //   engine.disks.splice(index, 1)
    // }
    delete engine.disks[diskId]
}

export const removeDiskByName = (store:Store, engine: Engine, diskName: Hostname):void => {
    const disk = findDiskByName(store, engine, diskName)
    if (disk) delete engine.disks[disk.id]
}

export const addConnectedInterface = (engine: Engine, ifaceName: InterfaceName, ip4: IPAddress, netmask: NetMask, cidr: CIDR):void => {
    const iface:Interface = {
        name: ifaceName,
        ip4: ip4,
        netmask: netmask,
        cidr: cidr
    }

    // We shouldn't be doing this - 
    if (!engine.connectedInterfaces) {
        engine.connectedInterfaces = {}
    }

    // And add it to the local engine
    engine.connectedInterfaces[ifaceName] = iface
}

export const isConnected = (engine: Engine, ifaceName: InterfaceName):boolean => {
    const isConn = engine && (engine.connectedInterfaces) && engine.connectedInterfaces[ifaceName] && engine.connectedInterfaces[ifaceName].hasOwnProperty('ip4')
    // if isConn is undefined, return false
    return isConn ? true : false
}


export const setRestrictedInterfaces = (engine: Engine, ifaceNames: InterfaceName[]):void => {
    engine.restrictedInterfaces = ifaceNames
}

export const removeConnectedInterface = (engine: Engine, iface: Interface):void => {
    if (engine.connectedInterfaces) {
        delete engine.connectedInterfaces[iface.name]
    }
}   

export const removeConnectedInterfaceByName = (engine: Engine, ifaceName: InterfaceName):void => {
    if (engine.connectedInterfaces && engine.connectedInterfaces[ifaceName]) {
        delete engine.connectedInterfaces[ifaceName]
    }
}

export const findConnectedInterface = (engine: Engine, ifaceName: InterfaceName):Interface | undefined => {
    return engine.connectedInterfaces ? engine.connectedInterfaces[ifaceName] : undefined
}

export const getConnectedInterfaces = (engine: Engine):InterfaceName[] => {
    return engine.connectedInterfaces ? Object.keys(engine.connectedInterfaces) as InterfaceName[] : []
}

export const getInterfacesToRemoteEngine = (engine: Engine, remoteIp: IPAddress):Interface[] => {
        if (engine.connectedInterfaces) {
            // Iterate over all values of engine.connectedInterfaces
            return Object.values(engine.connectedInterfaces).filter((iface) => {
                const netmask = iface.netmask
                const ip4 = iface.ip4
                const onNet = sameNet(remoteIp, ip4, netmask)
                return onNet
         })
    } else {
        return []
    }
}




// export const getEngineApps = (store:Store, engine: Engine) => {
//     const diskIds = Object.keys(engine.disks) as DiskID[]
//     return diskIds.reduce(
//       (acc, diskId) => {
//         const disk = getDisk(store, diskId)
//         return disk ? acc.concat(disk.apps) : []
//       },
//       [])
// }

export const getEngineApps = (store:Store, engine: Engine):App[] => {
    return getDisks(store, engine).reduce(
        (acc, disk) => {
            return acc.concat(getApps(store, disk))
        },
        [] as App[])
}

export const getEngineInstances = (store:Store, engine: Engine):Instance[] => {
    return getDisks(store, engine).reduce(
      (acc, diskId) => {
        return acc.concat((getInstances(store, diskId)))
      },
      [] as Instance[])
}

export const rebootEngine = (engine: Engine) => {
    log(`Rebooting engine ${engine.hostName}`)
    $`sudo reboot now`
}

