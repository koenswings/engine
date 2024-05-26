import { $, YAML, chalk, os } from 'zx';
import { log } from '../utils/utils.js';
import { App, createAppFromFile } from './App.js'
import { Instance, createInstanceFromFile, startInstance } from './Instance.js'



export interface Disk {
    name: string;
    device: string;
    type: DiskType;
    created: number; // We must use a timestamp number as Date objects are not supported in YJS
    lastDocked: number; // We must use a timestamp number as Date objects are not supported in YJS
    removable: boolean;
    upgradable: boolean;
    //engine: Engine;   
    apps: App[];
    instances: Instance[];
}

type DiskType = 'Apps' | 'Backup';

// Function findApp that searches for an app with the specified name and version on the specified disk
export const findAppByNameAndVersion = (disk: Disk, appName: string, version: string) => {
    return disk.apps.find(app => app.name === appName && app.version === version)
}

export const findInstanceByName = (disk: Disk, instanceName: string) => {
    return disk.instances.find(instance => instance.name === instanceName)
}

export const addInstance = (disk: Disk, instance: Instance) => {
    if (!findInstanceByName(disk, instance.name)) {
        disk.instances.push(instance)
    }
}

export const addApp = (disk: Disk, app: App) => {
    if (!findAppByNameAndVersion(disk, app.name, app.version)) {
        disk.apps.push(app)
    }
}

export const removeAppByNameAndVersion = (disk: Disk, name: string, version: string) => {
    disk.apps = disk.apps.filter(app => app.name !== name && app.version !== version)
}

export const removeInstanceByName = (disk: Disk, instanceName: string) => {
    disk.instances = disk.instances.filter(instance => instance.name !== instanceName)
}

// Create similar operations for the disks
export const createDiskFromFile = async (device:string, diskName:string, created:number, type:DiskType): Promise<Disk> => {
    log(`Adding app disk ${diskName} on device ${device}`)
    const disk: Disk = {
        name: diskName,
        device: device,
        type: type,
        created: created,
        lastDocked: new Date().getTime(),
        removable: false,
        upgradable: false,
        apps: [],
        instances: []
    }
    // Class variation
    // const disk: Disk = new Disk ()
    // disk.name = diskName
    // disk.device = device
    // disk.type = 'Apps'
    // disk.created = created
    // disk.lastDocked = new Date().getTime()
    // disk.removable = false
    // disk.upgradable = false
    // disk.apps = []
    // disk.instances = []
    // Add the disk to the local engine

    // Call addApp for each folder found in /disks/diskName/apps
    const apps = (await $`ls /disks/${device}/apps`).stdout.split('\n')
    log(`Apps found on disk ${diskName}: ${apps}`)
    apps.forEach(async appFolder => {
        if (!(appFolder === "")) {
            const app: App = await createAppFromFile(appFolder, diskName, device)
            if (app) {
                addApp(disk, app)
            }
        }
    })

    // Call startInstance for each folder found in /instances
    const instances = (await $`ls /disks/${device}/instances`).stdout.split('\n')
    log(`Instances found on disk ${diskName}: ${instances}`)
    instances.forEach(async instanceFolder => {
        if (!(instanceFolder === "")) {
            const instance = await createInstanceFromFile(instanceFolder, diskName, device)
            if (instance) {
                addInstance(disk, instance)
                startInstance(instance, disk)
            }
        }
    })
    return disk
}

