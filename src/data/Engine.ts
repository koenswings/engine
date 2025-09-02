import { $, chalk, os, sleep } from 'zx';
import { deepPrint, log } from '../utils/utils.js';
import { readMetaUpdateId, DiskMeta } from './Meta.js';
import { Version, Command, Hostname, Timestamp, DiskID, EngineID } from './CommonTypes.js';
import { Store, getAppsOfEngine, getDisksOfEngine, getInstancesOfEngine } from './Store.js';
import { DocHandle } from '@automerge/automerge-repo';

export interface Engine {
    id: EngineID,
    hostname: Hostname;
    version: Version;
    hostOS: string;
    // dockerMetrics?: DockerMetrics;
    // dockerLogs?: DockerLogs;
    // dockerEvents?: DockerEvents;
    created: Timestamp;
    lastBooted: Timestamp; // The last time this engine was started. We must use a timestamp number as Date objects are not supported in YJS
    lastRun: Timestamp; // The last time this engine was alive. Set by a heartbeat. 
    lastHalted: Timestamp | null; // The last time that some other engine discovered that this Engine is down. null if it has never been down so far
    //disks?: Disk[];
    // disks: {[key:DiskID]:boolean};
    //networkInterfaces: NetworkInterface[];
    // restrictedInterfaces?: InterfaceName[]    
    // connectedInterfaces?: {[key: InterfaceName]: Interface} // The key is the interface name and the value is the Interface object
    commands: Command[];
    //commands?: YArrayRef;
}

// We give an engine an Interface once it has an IP address on that interface
// export interface Interface {
//     name: InterfaceName,
//     ip4: IPAddress,
//     netmask: NetMask,
//     cidr: CIDR
// }

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

const getLocalEngineId = async (): Promise<EngineID> => {
    log(`Getting local engine id`)
    const meta: DiskMeta | undefined = await readMetaUpdateId()
    if (!meta) {
        console.error(`No meta file found on root disk. Cannot create local engine. Exiting.`)
        process.exit(1)
    }
    return createEngineIdFromDiskId(meta.diskId)
    // return "ENGINE_"+meta.diskId as EngineID
    //return meta.diskId as EngineID
}

export const createEngineIdFromDiskId = (diskId: DiskID): EngineID => {
    return "ENGINE_" + diskId as EngineID
}

export const initialiseLocalEngine = async (): Promise<Engine> => {
    const meta: DiskMeta | undefined = await readMetaUpdateId()
    if (!meta) {
        console.error(`No meta file found on root disk. Cannot create local engine. Exiting.`)
        process.exit(1)
    }
    // @ts-ignore
    const localEngine: Engine = {
        id: createEngineIdFromDiskId(meta.diskId),
        hostname: os.hostname() as Hostname,
        version: meta.version ? meta.version : "0.0.1" as Version,
        hostOS: os.type(),
        // dockerMetrics: {
        //     memory: os.totalmem().toString(),
        //     cpu: os.loadavg().toString(),
        //     network: "",
        //     disk: ""
        // },
        // dockerLogs: { logs: [] },
        // dockerEvents: { events: [] },
        created: meta.created,
        lastBooted: (new Date()).getTime() as Timestamp,
        lastRun: (new Date()).getTime() as Timestamp,
        lastHalted: null,
        commands: []
    }
    return localEngine
}

export const createOrUpdateEngine = async (storeHandle: DocHandle<Store>, engineId: EngineID): Promise<Engine | undefined> => {
    const store: Store = storeHandle.doc()
    const storedEngine: Engine | undefined = store.engineDB[engineId]
    try {
        if (!storedEngine) {
            // Create a new instance object
            log(`Creating new engine object for local engine ${engineId}`)
            const engine: Engine = await initialiseLocalEngine()
            storeHandle.change(doc => {
                log(`Creating new engine object in store for local engine ${engineId}`)
                doc.engineDB[engineId] = engine
            })
            return engine
        } else {
            // Update the existing instance object
            log(`Granularly updating existing engine object ${engineId}`)
            storeHandle.change(doc => {
                const engine = doc.engineDB[engineId]
                engine.hostname = os.hostname() as Hostname
                engine.lastBooted = (new Date()).getTime() as Timestamp
                engine.lastRun = (new Date()).getTime() as Timestamp
            })
            return storedEngine
        }
    } catch (e) {
        log(chalk.red(`Error initializing engine ${engineId}`))
        console.error(e)
        return undefined
    }
}

export const localEngineId = await getLocalEngineId()
// export const localEngine = await initialiseLocalEngine()

// export const bindEngine = ($engine:Engine, networks:Network[]):void => {
//     log(`Binding engine ${$engine.id} to all networks`)
//     log(`$engine: ${deepPrint($engine)}`)
//     networks.forEach((network) => {
//         const dummy = {}
//         dummy[dummyKey] = true

//         // Bind the $engine proxy to the network
//         const yEngine = network.doc.getMap($engine.id)
//         network.unbind = bind($engine as Record<string, any>, yEngine)
//         log(`Bound engine ${$engine.id} to network ${network.appnet.name}`)

//         // Create a proxy for the disks array
//         $engine.disks = proxy<{[key:DiskID]:boolean}>(dummy) 

//         // Bind the proxy for the disk Ids array to a corresponding Yjs Map
//         bind($engine.disks, network.doc.getMap(`${$engine.id}_disks`))
//     })
// }


// export const getDisks = (store:Store, engine: Engine):Disk[] => {
//     const diskIds = getKeys(engine.disks) as DiskID[]
//     return diskIds.map(diskId => getDisk(store, diskId))
// }


export const addCommand = (engine: Engine, command: Command): void => {
    log(`Adding command ${command} to engine ${engine.hostname}`)
    if (engine.commands) engine.commands.push(command)
}


// export const findDisk = (store:Store, engine: Engine, diskId: DiskID): Disk | undefined => {
//     const hasDisk = engine.disks[diskId]
//     return hasDisk ? store.diskDB[diskId] : undefined
// }

// export const findDiskByName = (store:Store, engine: Engine, diskName: Hostname): Disk | undefined => {
//     const diskIds = getKeys(engine.disks) as DiskID[]
//     const diskId = diskIds.find(diskId => {
//         const disk = getDisk(store, diskId)
//         return disk && disk.name === diskName
//     })
//     return diskId ? store.diskDB[diskId] : undefined
// }

// export const findDiskByName = (store:Store, engine: Engine, diskName: DiskName): Disk | undefined => {
//     return getDisks(store, engine).find(disk => disk.name === diskName)
// }

// export const findDiskById = (store:Store, engine: Engine, diskId: DiskID): Disk | undefined => {
//     return getDisks(store, engine).find(disk => disk.id === diskId)
// }

// export const findDiskByDevice = (store:Store, engine: Engine, device: string):Disk | undefined => {
//     const diskIds = getKeys(engine.disks) as DiskID[]
//     const diskId = diskIds.find(diskId => {
//         const disk = getDisk(store, diskId)
//         return disk && disk.device === device
//     })
//     return diskId ? store.diskDB[diskId] : undefined
// }

// export const findDiskByDevice = (store:Store, engine: Engine, device: DeviceName):Disk | undefined => {
//     return getDisks(store, engine).find(disk => disk.device === device)
// }


// export const getDiskNames = (store:Store, engine:Engine) => {
//     const diskIds = getKeys(engine.disks) as DiskID[]
//     return diskIds.flatMap(diskId => {
//         const disk = getDisk(store, diskId)
//         return disk ? disk.name : []
//     })
// }
// export const getDiskNames = (store:Store, engine:Engine):DiskName[] => {
//     return getDisks(store, engine).map(disk => disk.name)
// }


// export const addDisk = (store:Store, engine: Engine, disk: Disk):void => {
//     log(`Updating disk ${disk.name} of engine ${engine.hostName}:`)

//     // Check if engine already has the disk
//     const diskIds = getKeys(engine.disks) as DiskID[]
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

// export const undockDisk = async (store:Store, engine: Engine, disk: Disk):Promise<void> => {
//     // const index = engine.disks.indexOf(disk)
//     // if (index > -1) {
//     //   engine.disks.splice(index, 1)
//     // }
//     log(`Removing disk ${disk.id} from engine ${engine.id} and all its instances form the networks`)
//     // Remove all instances from the appnet if the disk still has the engine as its parent (it might have been inserted elsewhere)
//     // TODO - This is sensitive to race conditions: suppose the disk is being inserted into another engine at the same time
//     if (disk.engineId === engine.id) {
//         const instances = getKeys(disk.instances) as InstanceID[]
//         for (const instanceID of instances) {
//         // instances.forEach(async instanceID => {
//             const instance = getInstance(store, instanceID)
//             await stopInstance(store, instance, disk)
//             log(`Instance ${instance.id} stopped`)

//             store.networks.forEach(network => {
//                 removeInstanceFromAppnet(network.appnet, instanceID)
//             })
//         }
//         log(`Stopped all instances of disk ${disk.id} on engine ${engine.hostname}`)

//         // HACK - wait for the containers to be removed before unmounting the disks
//         // log(`Waiting for 5 seconds before unmounting the disk`)
//         // await sleep(5000)
//     }
//     // 
//     delete engine.disks[disk.id]

// }

// export const removeDiskByName = (store:Store, engine: Engine, diskName: DiskName):void => {
//     const disk = findDiskByName(store, engine, diskName)
//     if (disk) delete engine.disks[disk.id]
// }

// export const addConnectedInterface = (engine: Engine, ifaceName: InterfaceName, ip4: IPAddress, netmask: NetMask, cidr: CIDR):void => {
//     const iface:Interface = {
//         name: ifaceName,
//         ip4: ip4,
//         netmask: netmask,
//         cidr: cidr
//     }

//     // We shouldn't be doing this - 
//     if (!engine.connectedInterfaces) {
//         engine.connectedInterfaces = {}
//     }

//     // And add it to the local engine
//     engine.connectedInterfaces[ifaceName] = iface
// }

// export const isConnected = (engine: Engine, ifaceName: InterfaceName):boolean => {
//     const isConn = engine && (engine.connectedInterfaces) && engine.connectedInterfaces[ifaceName] && engine.connectedInterfaces[ifaceName].hasOwnProperty('ip4')
//     // if isConn is undefined, return false
//     return isConn ? true : false
// }


// export const setRestrictedInterfaces = (engine: Engine, ifaceNames: InterfaceName[]):void => {
//     engine.restrictedInterfaces = ifaceNames
// }

// export const removeConnectedInterface = (engine: Engine, iface: Interface):void => {
//     if (engine.connectedInterfaces) {
//         delete engine.connectedInterfaces[iface.name]
//     }
// }   

// export const removeConnectedInterfaceByName = (engine: Engine, ifaceName: InterfaceName):void => {
//     if (engine.connectedInterfaces && engine.connectedInterfaces[ifaceName]) {
//         delete engine.connectedInterfaces[ifaceName]
//     }
// }

// export const findConnectedInterface = (engine: Engine, ifaceName: InterfaceName):Interface | undefined => {
//     return engine.connectedInterfaces ? engine.connectedInterfaces[ifaceName] : undefined
// }

// export const getConnectedInterfaces = (engine: Engine):InterfaceName[] => {
//     return engine.connectedInterfaces ? getKeys(engine.connectedInterfaces) as InterfaceName[] : []
// }

// export const getInterfacesToRemoteEngine = (engine: Engine, remoteIp: IPAddress):Interface[] => {
//         if (engine.connectedInterfaces) {
//             // Iterate over all values of engine.connectedInterfaces
//             return Object.values(engine.connectedInterfaces).filter((iface) => {
//                 const netmask = iface.netmask
//                 const ip4 = iface.ip4
//                 const onNet = sameNet(remoteIp, ip4, netmask)
//                 return onNet
//          })
//     } else {
//         return []
//     }
// }






// export const getEngineApps = (store:Store, engine: Engine) => {
//     const diskIds = getKeys(engine.disks) as DiskID[]
//     return diskIds.reduce(
//       (acc, diskId) => {
//         const disk = getDisk(store, diskId)
//         return disk ? acc.concat(disk.apps) : []
//       },
//       [])
// }

// export const getEngineApps = (store:Store, engine: Engine):App[] => {
//     const apps = getDisks(store, engine).reduce(
//         (acc, disk) => {
//             return acc.concat(getApps(store, disk))
//         },
//         [] as App[])
//     // Remove all duplicates (apps with the same id)
//     return apps.filter((app, index, self) =>
//         index === self.findIndex((t) => (
//             t.id === app.id
//         ))
//     )
// }

// export const getEngineInstances = (store:Store, engine: Engine):Instance[] => {
//     return getDisks(store, engine).reduce(
//       (acc, disk) => {
//         return acc.concat((getInstances(store, disk)))
//       },
//       [] as Instance[])
// }

export const rebootEngine = (engine: Engine) => {
    log(`Rebooting engine ${engine.hostname}`)
    $`sudo reboot now`
}

export const inspectEngine = (store: Store, engine: Engine) => {
    log(chalk.bgGray(`Engine: ${deepPrint(engine)}`))
    const disks = getDisksOfEngine(store, engine)
    log(chalk.bgGray(`Disks: ${deepPrint(disks)}`))
    const apps = getAppsOfEngine(store, engine)
    log(chalk.bgGray(`Apps: ${deepPrint(apps)}`))
    const instances = getInstancesOfEngine(store, engine)
    log(chalk.bgGray(`Instances: ${deepPrint(instances)}`))
}