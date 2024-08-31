import { $, YAML, chalk, os } from 'zx';
import { deepPrint, log } from '../utils/utils.js';
import { App, createOrUpdateApp } from './App.js'
import { Instance, Status, createOrUpdateInstance, startAndAddInstance } from './Instance.js'
import { proxy } from 'valtio';
import { ID } from 'yjs';
import { UUID } from 'crypto';
import { uuidv4 } from 'lib0/random.js';
import { AppID, AppName, DeviceName, DiskID, EngineID, Hostname, InstanceID, InstanceName, Timestamp, Version } from './CommonTypes.js';
import { Store, getApp, getInstance } from './Store.js';
import { bind } from '../valtio-yjs/index.js';
import { Network } from './Network.js';
import { Engine } from './Engine.js';
import { add } from 'lib0/math.js';
import { addInstanceToAppnet, removeInstanceFromAppnet } from './Appnet.js';



export interface Disk {
    id: DiskID;
    name: Hostname;
    device: DeviceName;
    engineId: EngineID;   // The engine on which this disk is inserted
    // type: DiskType;
    created: Timestamp; // We must use a timestamp number as Date objects are not supported in YJS
    lastDocked: Timestamp; // We must use a timestamp number as Date objects are not supported in YJS
    removable: boolean;
    upgradable: boolean;
    //engine: Engine;   
    apps: { [key: AppID]: boolean };
    instances: { [key: InstanceID]: boolean };
}

// type DiskType = 'Apps' | 'Backup';



export const getApps = (store: Store, disk: Disk): App[] => {
    const appIds = Object.keys(disk.apps) as AppID[]
    return appIds.map(appId => getApp(store, appId))
}


export const findApp = (store: Store, disk: Disk, appId: AppID): App | undefined => {
    return getApps(store, disk).find(app => app.id === appId)   
}

// Function findApp that searches for an app with the specified name and version on the specified disk
// export const findAppByNameAndVersion = (store: Store, disk: Disk, appName: AppName, version: Version): App | undefined => {
//     const appIds = Object.keys(disk.apps) as AppID[]
//     const appId = appIds.find(appId => {
//         const app = store.appDB[appId]
//         app.name === appName && app.version === version
//     })
//     if (appId) {
//         return store.appDB[appId]
//     } else {
//         return undefined
//     }
// }

export const getInstances = (store: Store, disk: Disk): Instance[] => {
    const instanceIds = Object.keys(disk.instances) as InstanceID[]
    return instanceIds.map(instanceId => getInstance(store, instanceId))
}

export const findInstance = (store: Store, disk: Disk, instanceId: InstanceID): Instance | undefined => {
    return getInstances(store, disk).find(instance => instance.id === instanceId)   
}

export const findInstanceOfApp = (store: Store, disk: Disk, appId: AppID): Instance | undefined => {
    return getInstances(store, disk).find(instance => instance.instanceOf === appId)   
}
// export const findInstanceByName = (store: Store, disk: Disk, instanceName: InstanceName): Instance | undefined => {
//     const instanceIds = Object.keys(disk.instances) as InstanceID[]
//     const instanceId = instanceIds.find(instanceId => store.instanceDB[instanceId].name === instanceName)
//     if (instanceId) {
//         return store.instanceDB[instanceId]
//     } else {
//         return undefined
//     }
// }

// export const addInstance = (store: Store, disk: Disk, instance: Instance): void => {
//     log(`Updating instance ${instance.name} of disk ${disk.name}:`)
//     const existingInstance = findInstanceByName(store, disk, instance.name)
//     if (existingInstance) {
//         log(`Disk ${disk.name} already has an instance ${instance.name}. Merging the new instance with the existing instance.`)
//         Object.assign(existingInstance, instance)
//     } else {
//         //log(deepPrint(disk))
//         log(`Pushing a new instance ${instance.name} to engine ${disk.name}`)
//         disk.instances[instance.id] = true
//     }
// }

export const addInstance = (store:Store, disk: Disk, instance: Instance): void => {
    disk.instances[instance.id] = true
    store.networks.forEach((network) => {
        log(`Trying to add instance ${instance.id} with status ${instance.status} to appnet ${network.appnet.name}`)
        if (instance.status == 'Running' as Status ) addInstanceToAppnet(network.appnet, instance)
    })
}

// export const addApp = (store: Store, disk: Disk, app: App): void => {
//     log(`Updating app ${app.name} of disk ${disk.name}:`)
//     const existingApp = findAppByNameAndVersion(store, disk, app.name, app.version)
//     if (existingApp) {
//         log(`Disk ${disk.name} already has an instance ${app.name}. Merging the new instance with the existing instance.`)
//         Object.assign(existingApp, app)
//     } else {
//         //log(deepPrint(disk))
//         log(`Pushing a new app ${app.name} to engine ${disk.name}`)
//         disk.apps[app.id] = true
//     }
// }

export const addApp = (disk: Disk, app: App): void => {
    disk.apps[app.id] = true
}

export const removeApp = (store: Store, disk: Disk, appId: AppID): void => {
    const app = findApp(store, disk, appId)
    if (app) {
        delete disk.apps[app.id]
    }
}

export const removeInstance = (store: Store, disk: Disk, instanceId: InstanceID): void => {
    const instance = findInstance(store, disk, instanceId)
    if (instance) {
        delete disk.instances[instance.id]
        store.networks.forEach((network) => {
            removeInstanceFromAppnet(network.appnet, instance.id)
        })
    }
}

export const createOrUpdateDisk = (store: Store, engineId: EngineID, device: DeviceName, diskId: DiskID, diskName: Hostname, created: Timestamp): Disk => {
    if (store.diskDB[diskId]) {
        log(`Updating disk ${diskId} on engine ${engineId}`)
        const disk = store.diskDB[diskId]
        disk.engineId = engineId
        disk.name = diskName
        disk.device = device
        disk.created = created
        disk.lastDocked = new Date().getTime() as Timestamp
        return disk
    } else {
        log(`Creating disk ${diskName} on engine ${engineId}`)
        // const disk: Disk = {
        //     id: diskId,
        //     name: diskName,
        //     device: device,
        //     engineId: engineId,
        //     created: created,
        //     lastDocked: new Date().getTime() as Timestamp,
        //     removable: false,
        //     upgradable: false,
        //     apps: proxy<{ [key: AppID]: boolean }>({}),
        //     instances: proxy<{ [key: InstanceID]: boolean }>({})
        // }

        // Disable typescript checking for the following code 
        // The alternative is to make all properties optional, but they will only be optional in this function
        //@ts-ignore
        const disk: Disk = {
            id: diskId
        }
        
        // Add the disk to the local engine
        const $disk = proxy<Disk>(disk)

        // Bind it to all networks
        bindDisk($disk, store.networks)

        // Update the disk
        disk.name = diskName
        disk.device = device
        disk.engineId = engineId
        disk.created = created
        disk.lastDocked = new Date().getTime() as Timestamp
        disk.removable = false
        disk.upgradable = false

        // Store the disk
        store.diskDB[$disk.id] = $disk

        return $disk
    }
}

export const bindDisk = ($disk:Disk, networks:Network[]):void => {
    networks.forEach((network) => {
        // Bind the $disk proxy to the network
        const yDisk = network.doc.getMap($disk.id)
        network.unbind = bind($disk as Record<string, any>, yDisk)
        log(`Bound disk ${$disk.id} to network ${network.appnet.name}`)

        // Initialize the apps and instances Ids array
        $disk.apps = proxy<{ [key: AppID]: boolean }>({}),
        $disk.instances = proxy<{ [key: InstanceID]: boolean }>({})

        // Bind the proxy for the apps and instances Ids array to a corresponding Yjs Map
        bind($disk.apps, network.doc.getMap(`${$disk.id}_apps`))
        bind($disk.instances, network.doc.getMap(`${$disk.id}_instances`))
    })
}

// Create similar operations for the disks
export const updateAppsAndInstances = async (store: Store, disk: Disk): Promise<void> => {
    log(`Updating apps and instances of disk ${disk.name} on device ${disk.device}`)

    // Apps
    const previousApps = getApps(store, disk)
    const actualApps:App[] = []

    // Call addApp for each folder found in /disks/diskName/apps
    const appIds = (await $`ls /disks/${disk.device}/apps`).stdout.split('\n')
    log(`App ids found on disk ${disk.name}: ${appIds}`)
    for (let appId of appIds) {
      await updateApp(store, disk, appId  as AppID, actualApps)
    }

    // OLD CODE
    // await Promise.all(apps.map(async (appFolder) => {
    //     if (!(appFolder === "")) {
    //         const appName = appFolder as AppName
    //         const app: App | undefined = await createOrUpdateApp(store, appName, disk.name, disk.device)
    //         if (app) {
    //             // addApp(store, disk, app)
    //             log(`Adding app ${app.name} to disk ${disk.name}`)
    //             // disk.apps[app.id] = true
    //             addApp(disk, app)
    //             actualApps.push(app)
    //         }
    //     }
    // }))

    log(`Actual apps: ${actualApps.map(app => app.id)}`)
    log(`Previous apps: ${previousApps.map(app => app.id)}`)

    // Remove apps that are no longer on disk
    previousApps.forEach((app) => {
        if (!actualApps.includes(app)) {
            removeApp(store, disk, app.id)
        }
    })

    // Instances
    const previousInstances = getInstances(store, disk)
    const actualInstances:Instance[] = []

    // Call startInstance for each folder found in /instances
    const instanceIds = (await $`ls /disks/${disk.device}/instances`).stdout.split('\n')
    log(`Instance Ids found on disk ${disk.name}: ${instanceIds}`)
    for (let instanceId of instanceIds) {
        await updateInstance(store, disk, instanceId  as InstanceID, actualInstances)
      }

    // OLD CODE
    // await Promise.all(instances.map(async (instanceFolder) => {
    //     if (!(instanceFolder === "")) {
    //         const instanceName = instanceFolder as InstanceName
    //         const instance = await createOrUpdateInstance(store, instanceName, disk)
    //         // log(`Instance ${instance.name} found on disk ${diskName}`)
    //         if (instance) {
    //             //log(deepPrint(disk))
    //             // addInstance(store, disk, instance)
    //             //log(deepPrint(disk))
    //             log(`Adding instance ${instance.name} to disk ${disk.name}`)
    //             // disk.instances[instance.id] = true
    //             actualInstances.push(instance)
    //             await startAndAddInstance(store, instance, disk)
    //         }
    //     }
    // }))

    log(`Actual instances: ${actualInstances.map(instance => instance.id)}`)
    log(`Previous instances: ${previousInstances.map(instance => instance.id)}`)
    
    // Remove instances that are no longer on disk
    previousInstances.forEach((instance) => {
        if (!actualInstances.includes(instance)) {
            removeInstance(store, disk, instance.id)
        }
    })
}

export const updateApp = async (store: Store, disk: Disk, appID: AppID, actualApps:App[]): Promise<void> => {
    if (!(appID === "")) {
        const app: App | undefined = await createOrUpdateApp(store, appID, disk.name, disk.device)
        if (app) {
            // addApp(store, disk, app)
            log(`Adding app ${app.name} to disk ${disk.name}`)
            // disk.apps[app.id] = true
            addApp(disk, app)
            actualApps.push(app)
        }
    }
}

export const updateInstance = async (store: Store, disk: Disk, instanceId: InstanceID, actualInstances:Instance[]): Promise<void> => {
        if (!(instanceId === "")) {
            const instance = await createOrUpdateInstance(store, instanceId, disk)
            if (instance) {
                log(`Adding instance ${instance.id} to disk ${disk.id}`)
                actualInstances.push(instance)
                await startAndAddInstance(store, instance, disk)
            }
        }
}