import { $, YAML, chalk, os } from 'zx';
import { deepPrint, log } from '../utils/utils.js';
import { App, createAppFromFile } from './App.js'
import { Instance, createInstanceFromFile, startInstance } from './Instance.js'
import { proxy } from 'valtio';
import { ID } from 'yjs';
import { UUID } from 'crypto';
import { uuidv4 } from 'lib0/random.js';
import { AppID, AppName, DeviceName, DiskID, Hostname, InstanceID, InstanceName, Timestamp, Version } from './CommonTypes.js';
import { Store } from './Store.js';
import { bind } from '../valtio-yjs/index.js';



export interface Disk {
    id:DiskID;
    name: Hostname;
    device: DeviceName;
    // type: DiskType;
    created: Timestamp; // We must use a timestamp number as Date objects are not supported in YJS
    lastDocked: Timestamp; // We must use a timestamp number as Date objects are not supported in YJS
    removable: boolean;
    upgradable: boolean;
    //engine: Engine;   
    apps: {[key:AppID]:boolean};
    instances: {[key:InstanceID]:boolean};
}

// type DiskType = 'Apps' | 'Backup';



export const getApps = (store:Store, disk: Disk):App[] => {
    return Object.keys(disk.apps).flatMap(appId => store.appDB[appId])
}

export const getInstances = (store:Store, disk: Disk):Instance[] => {
    return Object.keys(disk.instances).map(instanceId => store.instanceDB[instanceId])
}

// Function findApp that searches for an app with the specified name and version on the specified disk
export const findAppByNameAndVersion = (store:Store, disk: Disk, appName: AppName, version: Version):App | undefined => {
    const appIds = Object.keys(disk.apps) as AppID[]
    const appId = appIds.find(appId => {
        const app = store.appDB[appId]
        app.name === appName && app.version === version
    })
    if (appId) {
        return store.appDB[appId]
    } else {
        return undefined
    }
}

export const findInstanceByName = (store:Store, disk: Disk, instanceName: InstanceName):Instance | undefined => {
    const instanceIds = Object.keys(disk.instances) as InstanceID[]
    const instanceId = instanceIds.find(instanceId => store.instanceDB[instanceId].name === instanceName)
    if (instanceId) {
        return store.instanceDB[instanceId]
    } else {
        return undefined
    }
}

export const addInstance = (store:Store, disk: Disk, instance: Instance):void => {
    log(`Updating instance ${instance.name} of disk ${disk.name}:`)
    const existingInstance = findInstanceByName(store, disk, instance.name)
    if (existingInstance) {
        log(`Disk ${disk.name} already has an instance ${instance.name}. Merging the new instance with the existing instance.`)
        Object.assign(existingInstance, instance)
    } else {
        //log(deepPrint(disk))
        log(`Pushing a new instance ${instance.name} to engine ${disk.name}`)
        disk.instances[instance.id] = true
    }
}

export const addApp = (store:Store, disk: Disk, app: App):void => {
    log(`Updating app ${app.name} of disk ${disk.name}:`)
    const existingApp = findAppByNameAndVersion(store, disk, app.name, app.version)
    if (existingApp) {
        log(`Disk ${disk.name} already has an instance ${app.name}. Merging the new instance with the existing instance.`)
        Object.assign(existingApp, app)
    } else {
        //log(deepPrint(disk))
        log(`Pushing a new app ${app.name} to engine ${disk.name}`)
        disk.apps[app.id] = true
    }
}

export const removeAppByNameAndVersion = (store:Store, disk: Disk, name: AppName, version: Version):void => {
    const app = findAppByNameAndVersion(store, disk, name, version)
    if (app) {
        delete disk.apps[app.id]
    }
}

export const removeInstanceByName = (store:Store, disk: Disk, instanceName: InstanceName):void => {
    const instance = findInstanceByName(store, disk, instanceName)
    if (instance) {
        delete disk.instances[instance.id]
    }
}

export const createDisk = (store:Store, device: DeviceName, id: DiskID, diskName: Hostname, created: Timestamp): Disk => {
    log(`Adding disk ${diskName} on device ${device}`)
    const disk: Disk = {
        id: id, 
        name: diskName,
        device: device,
        created: created,
        lastDocked: new Date().getTime() as Timestamp,
        removable: false,
        upgradable: false,
        apps: proxy<{[key:AppID]:boolean}>({}),
        instances: proxy<{[key:InstanceID]:boolean}>({})
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

    // Bind the proxy for the app Ids array to a corresponding Yjs Map
    store.networks.forEach((network) => {
        bind($disk.apps, network.doc.getMap(`${$disk.id}_apps`))
        bind($disk.instances, network.doc.getMap(`${$disk.id}_instances`))
    })

    return $disk
}

// Create similar operations for the disks
export const syncDiskWithFile = async (store:Store, disk:Disk):Promise<void> => {
    log(`Adding disk ${disk.name} on device ${disk.device}`)

    // Call addApp for each folder found in /disks/diskName/apps
    const apps = (await $`ls /disks/${disk.device}/apps`).stdout.split('\n')
    log(`Apps found on disk ${disk.name}: ${apps}`)
    await Promise.all(apps.map(async (appFolder) => {
        if (!(appFolder === "")) {
            const appName = appFolder as AppName
            const app: App | undefined = await createAppFromFile(appName, disk.name, disk.device)
            if (app) {
                addApp(store, disk, app)
            }
        }
    }))
    

    // Call startInstance for each folder found in /instances
    const instances = (await $`ls /disks/${disk.device}/instances`).stdout.split('\n')
    log(`Instances found on disk ${disk.name}: ${instances}`)
    await Promise.all(instances.map(async (instanceFolder) => {
        if (!(instanceFolder === "")) {
            const instanceName = instanceFolder as InstanceName
            const instance = await createInstanceFromFile(instanceName, disk.name, disk.device)
            // log(`Instance ${instance.name} found on disk ${diskName}`)
            if (instance) {
                //log(deepPrint(disk))
                addInstance(store, disk, instance)
                //log(deepPrint(disk))
                await startInstance(store, instance, disk)
            }
        }
    }))
}

