import { $, YAML, chalk, os } from 'zx';
import { deepPrint, log } from '../utils/utils.js';
import { App, createAppFromFile } from './App.js'
import { Instance, createInstanceFromFile, startInstance } from './Instance.js'
import { proxy } from 'valtio';



export interface Disk {
    name: string;
    device: string;
    // type: DiskType;
    created: number; // We must use a timestamp number as Date objects are not supported in YJS
    lastDocked: number; // We must use a timestamp number as Date objects are not supported in YJS
    removable: boolean;
    upgradable: boolean;
    //engine: Engine;   
    apps: App[];
    instances: Instance[];
}

// type DiskType = 'Apps' | 'Backup';

// Function findApp that searches for an app with the specified name and version on the specified disk
export const findAppByNameAndVersion = (disk: Disk, appName: string, version: string) => {
    return disk.apps.find(app => app.name === appName && app.version === version)
}

export const findInstanceByName = (disk: Disk, instanceName: string) => {
    return disk.instances.find(instance => instance.name === instanceName)
}

export const addInstance = (disk: Disk, instance: Instance) => {
    log(`Updating instance ${instance.name} of disk ${disk.name}:`)
    const existingInstance = findInstanceByName(disk, instance.name)
    if (existingInstance) {
        log(`Disk ${disk.name} already has an instance ${instance.name}. Merging the new instance with the existing instance.`)
        Object.assign(existingInstance, instance)
    } else {
        //log(deepPrint(disk))
        log(`Pushing a new instance ${instance.name} to engine ${disk.name}`)
        disk.instances.push(instance)
    }
}

export const addApp = (disk: Disk, app: App) => {
    log(`Updating app ${app.name} of disk ${disk.name}:`)
    const existingApp = findAppByNameAndVersion(disk, app.name, app.version)
    if (existingApp) {
        log(`Disk ${disk.name} already has an instance ${app.name}. Merging the new instance with the existing instance.`)
        Object.assign(existingApp, app)
    } else {
        //log(deepPrint(disk))
        log(`Pushing a new app ${app.name} to engine ${disk.name}`)
        disk.apps.push(app)
    }
}

export const removeAppByNameAndVersion = (disk: Disk, name: string, version: string) => {
    disk.apps = disk.apps.filter(app => app.name !== name && app.version !== version)
}

export const removeInstanceByName = (disk: Disk, instanceName: string) => {
    disk.instances = disk.instances.filter(instance => instance.name !== instanceName)
}

export const createDisk = (device: string, diskName: string, created: number): Disk => {
    log(`Adding disk ${diskName} on device ${device}`)
    const disk: Disk = {
        name: diskName,
        device: device,
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
    const $disk = proxy<Disk>(disk)
    return $disk
}

// Create similar operations for the disks
export const syncDiskWithFile = async (disk:Disk) => {
    log(`Adding disk ${disk.name} on device ${disk.device}`)

    // Call addApp for each folder found in /disks/diskName/apps
    const apps = (await $`ls /disks/${disk.device}/apps`).stdout.split('\n')
    log(`Apps found on disk ${disk.name}: ${apps}`)
    await apps.forEach(async appFolder => {
        if (!(appFolder === "")) {
            const app: App = await createAppFromFile(appFolder, disk.name, disk.device)
            if (app) {
                addApp(disk, app)
            }
        }
    })

    // Call startInstance for each folder found in /instances
    const instances = (await $`ls /disks/${disk.device}/instances`).stdout.split('\n')
    log(`Instances found on disk ${disk.name}: ${instances}`)
    await instances.forEach(async instanceFolder => {
        if (!(instanceFolder === "")) {
            const instance = await createInstanceFromFile(instanceFolder, disk.name, disk.device)
            // log(`Instance ${instance.name} found on disk ${diskName}`)
            if (instance) {
                //log(deepPrint(disk))
                addInstance(disk, instance)
                //log(deepPrint(disk))
                await startInstance(instance, disk)
            }
        }
    })
    return disk
}

