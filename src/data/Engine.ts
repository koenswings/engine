import { $, os } from 'zx';
import { DiskMeta, deepPrint, log, readMeta, sameNet } from '../utils/utils.js';
import { Version, DockerMetrics, DockerLogs, DockerEvents, UUID } from './CommonTypes.js';
import { Disk } from './Disk.js';
import { proxy } from 'valtio';


export interface Engine {
    id: UUID,
    hostName: string;
    version: Version;
    hostOS: string;
    dockerMetrics: DockerMetrics;
    dockerLogs: DockerLogs;
    dockerEvents: DockerEvents;
    created: number;
    lastBooted: number; // We must use a timestamp number as Date objects are not supported in YJS
    disks: Disk[];
    //networkInterfaces: NetworkInterface[];
    restrictedInterfaces: string[]    
    connectedInterfaces: {[key: string]: Interface} // The key is the interface name and the value is the Interface object
    commands: string[];
}

// We give an engine an Interface once it has an IP address on that interface
export interface Interface {
    name: string,
    ip4: string,
    netmask: string,
    cidr: string
}


export const createLocalEngine = async (restrictedInterfaces: string[]) => {
    const meta:DiskMeta = await readMeta()
    if (!meta) {
        console.error(`No meta file found on root disk. Cannot create local engine. Exiting.`)
        process.exit(1)
    }
    const localEngine = {
        id: meta.id, 
        hostName: os.hostname(),
        version: "1.0",
        hostOS: os.type(),
        dockerMetrics: {
            memory: os.totalmem().toString(),
            cpu: os.loadavg().toString(),
            network: "",
            disk: ""
        },
        dockerLogs: { logs: [] },
        dockerEvents: { events: [] },
        created: meta.created,
        lastBooted: (new Date()).getTime(),
        restrictedInterfaces: restrictedInterfaces,
        connectedInterfaces: {} as { [key: string]: Interface },
        disks: [] as Disk[],
        commands: [] as string[]
    }
    
    // This engine object is proxied with Valtio
    const $localEngine = proxy<Engine>(localEngine)
    //log(`Proxied engine object: ${deepPrint($localEngine, 2)}`)

    return $localEngine
}    

export const addDisk = (engine: Engine, disk: Disk) => {
    log(`Updating disk ${disk.name} of engine ${engine.hostName}:`)

    // Check if engine already has the disk
    const existingDisk = engine.disks.find(disk => disk.name === disk.name)
    if (existingDisk) {
        log(`Engine ${engine.hostName} already has disk ${disk.name}. Merging the new disk with the existing disk.`)
        Object.assign(existingDisk, disk)
    } else {
        //log(deepPrint(disk))
        log(`Pushing a new disk ${disk.name} to engine ${engine.hostName}`)
        engine.disks.push(disk)
    }
}

export const removeDisk = (engine: Engine, disk: Disk) => {
    const index = engine.disks.indexOf(disk)
    if (index > -1) {
      engine.disks.splice(index, 1)
    }
}

export const removeDiskByName = (engine: Engine, diskName: string) => {
    engine.disks = engine.disks.filter(disk => disk.name !== diskName)
}

export const addConnectedInterface = (engine: Engine, ifaceName: string, ip4: string, netmask: string, cidr: string) => {
    const iface = {
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

export const isConnected = (engine: Engine, ifaceName: string) => {
    return engine.connectedInterfaces && engine.connectedInterfaces[ifaceName] && engine.connectedInterfaces[ifaceName].hasOwnProperty('ip4')
}


export const setRestrictedInterfaces = (engine: Engine, ifaceNames: string[]) => {
    engine.restrictedInterfaces = ifaceNames
}

export const removeConnectedInterface = (engine: Engine, iface: Interface) => {
    delete engine.connectedInterfaces[iface.name]
}

export const removeConnectedInterfaceByName = (engine: Engine, ifaceName: string) => {
    if (engine.connectedInterfaces[ifaceName]) {
        delete engine.connectedInterfaces[ifaceName]
    }
}

export const findConnectedInterface = (engine: Engine, ifaceName: string) => {
    return engine.connectedInterfaces[ifaceName]
}

export const getConnectedInterfaces = (engine: Engine) => {
    return Object.keys(engine.connectedInterfaces)
}

export const getInterfacesToRemoteEngine = (engine: Engine, remoteIp: string) => {
    return Object.keys(engine.connectedInterfaces).filter((iface) => {
        const netmask = engine.connectedInterfaces[iface].netmask
        const ip4 = engine.connectedInterfaces[iface].ip4
        const onNet = sameNet(remoteIp, ip4, netmask)
        return onNet
    })
}

export const getDiskNames = (engine:Engine) => {
    return engine.disks.map(disk => disk.name)
  }

export const findDiskByName = (engine: Engine, diskName: string) => {
    return engine.disks.find(disk => disk.name === diskName)
}

export const findDiskByDevice = (engine: Engine, device: string) => {
    return engine.disks.find(disk => disk.device === device)
}

export const getEngineApps = (engine: Engine) => {
    return engine.disks.reduce(
      (acc, disk) => {
        return acc.concat(disk.apps)
      },
      [])
}

export const getEngineInstances = (engine: Engine) => {
    return engine.disks.reduce(
      (acc, disk) => {
        return acc.concat(disk.instances)
      },
      [])
}

export const rebootEngine = (engine: Engine) => {
    log(`Rebooting engine ${engine.hostName}`)
    $`sudo reboot now`
}

