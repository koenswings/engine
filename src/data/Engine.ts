import { log } from '../utils/utils.js';
import { Version, DockerMetrics, DockerLogs, DockerEvents } from './CommonTypes.js';
import { Disk } from './Disk.js';


export interface Engine {
    hostName: string;
    version: Version;
    hostOS: string;
    dockerMetrics: DockerMetrics;
    dockerLogs: DockerLogs;
    dockerEvents: DockerEvents;
    lastBooted: number; // We must use a timestamp number as Date objects are not supported in YJS
    disks: Disk[];
    //networkInterfaces: NetworkInterface[];
    interfaces: {[key: string]: Interface} // The key is the interface name and the value is the Interface object
    commands: string[];
}

// We give an engine an Interface once it has an IP address on that interface
export interface Interface {
    name: string,
    ip4: string,
    netmask: string,
    cidr: string
}

export const addDisk = (engine: Engine, disk: Disk) => {
    engine.disks.push(disk)
    log(`Disk ${disk.name} pushed to engine ${engine.hostName}`)
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

export const addInterface = (engine: Engine, ifaceName: string, ip4: string, netmask: string, cidr: string) => {
    const iface = {
        name: ifaceName,
        ip4: ip4,
        netmask: netmask,
        cidr: cidr
    }
    // And add it to the local engine
    engine.interfaces[ifaceName] = iface}

export const removeInterface = (engine: Engine, iface: Interface) => {
    delete engine.interfaces[iface.name]
}

export const removeInterfaceByName = (engine: Engine, ifaceName: string) => {
    delete engine.interfaces[ifaceName]
}

export const findInterface = (engine: Engine, ifaceName: string) => {
    return engine.interfaces[ifaceName]
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






