import { $, chalk, os } from 'zx';
import { deepPrint, log, sameNet } from '../utils/utils.js';
import { readMeta, DiskMeta } from './Meta.js';
import { Version, DockerMetrics, DockerLogs, DockerEvents, Command, Hostname, Timestamp, InterfaceName, DiskID, IPAddress, NetMask, CIDR, EngineID, DeviceName, InstanceID} from './CommonTypes.js';
import { Disk, getApps, getInstances } from './Disk.js';
import { proxy } from 'valtio';
import { config } from './Config.js';
import { Store, getDisk } from './Store.js';
import { addEngineToAppnet, removeInstanceFromAppnet } from './Appnet.js';
import { bind } from '../valtio-yjs/index.js';
import { App } from './App.js';
import { Instance } from './Instance.js';
import { Network } from './Network.js';
import { get } from 'http';

export interface Engine {
    id: EngineID,
    hostname?: Hostname;
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

    // @ts-ignore
    const $localEngine = proxy<Engine>({
        //id: "ENGINE_"+meta.id as EngineID,
        id: meta.engineId as EngineID,
        commands: []
        //disks: proxy<{[key:DiskID]:boolean}>({}) 
     })

    // Bind it to all networks
    bindEngine($localEngine, store.networks)

    // Update the local engine object
    $localEngine.hostname = os.hostname() as Hostname
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
    // $localEngine.commands = []
    //log(`Proxied engine object: ${deepPrint($localEngine, 2)}`)


    // Store the engine
    store.engineDB[$localEngine.id] = $localEngine

    // Add it to the list of engines
    // Since we have DIFFERENT AppNet objects for each Network, we need to add the engine to each AppNet
    store.networks.forEach((network) => {
        // Add the localEngine to the engines set of the network
        addEngineToAppnet(network.appnet, $localEngine.id)        
    })

    return $localEngine
}

export const bindEngine = ($engine:Engine, networks:Network[]):void => {
    networks.forEach((network) => {
        // Bind the $engine proxy to the network
        const yEngine = network.doc.getMap($engine.id)
        network.unbind = bind($engine as Record<string, any>, yEngine)
        log(`Bound engine ${$engine.id} to network ${network.appnet.name}`)

        // Create a proxy for the disks array
        $engine.disks = proxy<{[key:DiskID]:boolean}>({}) 

        // Bind the proxy for the disk Ids array to a corresponding Yjs Map
        bind($engine.disks, network.doc.getMap(`${$engine.id}_disks`))
    })
}


export const getDisks = (store:Store, engine: Engine):Disk[] => {
    const diskIds = Object.keys(engine.disks) as DiskID[]
    return diskIds.map(diskId => getDisk(store, diskId))
}


export const addCommand = (engine: Engine, command: Command):void => {
    log(`Adding command ${command} to engine ${engine.hostname}`)
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

export const removeDisk = (store:Store, engine: Engine, disk: Disk):void => {
    // const index = engine.disks.indexOf(disk)
    // if (index > -1) {
    //   engine.disks.splice(index, 1)
    // }
    log(`Removing disk ${disk.id} from engine ${engine.hostname} and all its instances form the networks`)
    delete engine.disks[disk.id]
    // Remove all instances from the appnet if the disk still has the engine as its parent (it might have been inserted elsewhere)
    // TODO - This is sensitive to race conditions: suppose the disk is being inserted into another engine at the same time
    if (disk.engineId === engine.id) {
        const instances = Object.keys(disk.instances) as InstanceID[]
        instances.forEach(instanceID => {
            store.networks.forEach(network => {
                removeInstanceFromAppnet(network.appnet, instanceID)
            })
        })
    }
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
    const apps = getDisks(store, engine).reduce(
        (acc, disk) => {
            return acc.concat(getApps(store, disk))
        },
        [] as App[])
    // Remove all duplicates (apps with the same id)
    return apps.filter((app, index, self) =>
        index === self.findIndex((t) => (
            t.id === app.id
        ))
    )
}

export const getEngineInstances = (store:Store, engine: Engine):Instance[] => {
    return getDisks(store, engine).reduce(
      (acc, disk) => {
        return acc.concat((getInstances(store, disk)))
      },
      [] as Instance[])
}

export const rebootEngine = (engine: Engine) => {
    log(`Rebooting engine ${engine.hostname}`)
    $`sudo reboot now`
}

export const inspectEngine = (store:Store, engine: Engine) => {
    log(chalk.bgBlackBright(`Appnets: ${deepPrint(store.networks.map(network => network.appnet))}`))
    log(chalk.bgBlackBright(`Engine: ${deepPrint(engine)}`))
    const disks = getDisks(store, engine)
    log(chalk.bgBlackBright(`Disks: ${deepPrint(disks)}`))
    const apps = getEngineApps(store, engine)
    log(chalk.bgBlackBright(`Apps: ${deepPrint(apps)}`))
    const instances = getEngineInstances(store, engine)
    log(chalk.bgBlackBright(`Instances: ${deepPrint(instances)}`))
}