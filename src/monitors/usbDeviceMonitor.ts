import chokidar from 'chokidar'
import { fileExists, getKeys, log } from '../utils/utils.js'
import { DiskMeta, readHardwareId, createMeta, readMetaUpdateId } from '../data/Meta.js';
import { $, fs, YAML } from 'zx'
import { Disk, createOrUpdateDisk, processDisk } from '../data/Disk.js'
import { findDiskByDevice } from '../data/Store.js'
import { Store, getDisk, getDisksOfEngine, getLocalEngine } from '../data/Store.js'
import { DeviceName, DiskID, DiskName, EngineID, Hostname, InstanceID } from '../data/CommonTypes.js'
import { add } from 'lib0/math.js';
import { Status, stopInstance } from '../data/Instance.js';
import { config } from '../data/Config.js'
import { getPackedSettings } from 'http2';
import { DocHandle } from '@automerge/automerge-repo';


export const enableUsbDeviceMonitor = async (storeHandle: DocHandle<Store>) => {
    
    // TODO: Alternative implementations for usb device detection:
    // 1. Monitor /dev iso /dev/engine
    // 2. Monitor /dev/disk/by-label
    // 3. Monitor dmesg

    const store: Store = storeHandle.doc()
    const localEngine = getLocalEngine(store)

    if (!localEngine) {
        log(`No local engine found in the store`)
        throw new Error(`No local engine found in the store`)
    }

    // Statically analyse the devices in /dev/disk/by-label
    // if (!(localEngine.hostName == 'dev' as Hostname)) {     // QUICK HACK TO AVOID PROBLEMS ON THE DEV ENGINE
    // log(`Engine hostname is ${localEngine.hostname}`)
    // if (!(localEngine.id == '123456mac' as EngineID)) {     // QUICK HACK TO AVOID PROBLEMS ON THE DEV ENGINE
    //     const actualDevices = (await $`ls /dev/disk/by-label`).toString().split('\n').filter(device => device.match(/^sd[a-z]2$/m))
    //     log(`Actual devices: ${actualDevices}`)
    //     const storedDevices = getKeys(localEngine.disks).map(diskID => store.diskDB[diskID].device).filter(device => device !== undefined)
    //     log(`Existing devices: ${storedDevices}`)
    //     storedDevices.forEach(device => {
    //         if (!actualDevices.includes(device)) {
    //             log(`Removing device ${device}`)
    //             // Remove the disk from the store
    //             const disk = findDiskByDevice(store, localEngine, device as DeviceName)
    //             if (disk) {
    //                 undockDisk(localEngine, disk.id)
    //                 log(`Disk ${device} removed from local engine`)
    //             }
    //         }
    //     })
    // }

    // Check if the device is a valid appnet disk device
    const validDevice = function (device: string): boolean {
        // Check if the device begins with "sd", is then followed by a letter and ends with the number 2
        // We need the m flag - see https://regexr.com/7rvpq 
        return device && (device.match(/^sd[a-z]2$/m) || device.match(/^sd[a-z]$/m)) ? true : false
    }

    const addDevice = async function (path) {
        log(`A disk on device ${path} has been added`)
        
        // Strip out the name of the device from the path and assign it to a variable
        const device = path.split('/').pop() as DeviceName
    
        // Only process devices that are valid appnet disk devices
        if (validDevice(device)) {
            log(`The disk on device ${device} has a valid device name`)
            log(`Processing the disk on device ${device}`)
            try {
                // Check if the mount point exists. Run "mount -t ext4" and check if the output contains the string "/dev/<device> on /disks/<device> type ext4". 
                const mountOutput = await $`mount -t ext4`
                if (mountOutput.stdout.includes(`/dev/${device} on /disks/${device} type ext4`)) {
                    log(`Device ${device} already mounted`)
                } else {
                    log(`Mounting device ${device}`)
                    // Make the mount point
                    await $`mkdir -p /disks/${device}`
                    // Mount the device to the mount point
                    await $`mount /dev/${device} /disks/${device}`
                    log(`Device ${device} has been successfully mounted`)
                }

                // Check if the disk has a file META.yaml in the root location of the disk
                // If so, read the YAML content from the file and parse it into the object diskMetadata
                // if (await $`test -f /disks/${device}/META.yaml`.then(() => true).catch(() => false)) {
                // if (await fileExists(`/disks/${device}/META.yaml`)) {
                //     const metaContent = (await $`cat /disks/${device}/META.yaml`).stdout.trim()
                //     const diskMetadata = YAML.parse(metaContent)
                //     const diskName = diskMetadata.name
                //     const diskCreated = diskMetadata.created as number
                //     const diskCreatedTime = new Date(diskCreated)
                //     log(`Found an appnet disk on device ${device} with name ${diskName} and created on ${diskCreatedTime}`)
                //     // Add the disk to the store
                //     const disk:Disk = createDisk(device, diskName, diskCreated)
                //     await syncDiskWithFile(disk)
                //     addDisk(localEngine, disk)
                // } else {
                //     log('Not an app disk')
                // }         

                // let diskName
                // let diskCreated 
                // let diskCreatedTime
                // let diskId:DiskID
                // let diskIdOrUndefined = await readDiskId(device)
                // const meta:DiskMeta | undefined = await readMeta(device)
                // if (diskIdOrUndefined || meta) {
                //     if (diskIdOrUndefined && meta) {
                //         diskId = diskIdOrUndefined
                //         diskName = diskId.toString() as Hostname
                //         diskCreated = meta.created
                //         diskCreatedTime = new Date(diskCreated)
                //         log(`Found an appnet disk on device ${device} of engine ${localEngine.id} with a META file and a hardware ID. The META file has name = ${diskName} and creation time = ${diskCreatedTime}. The hardware id is ${diskId}`)
                //     } else if (diskIdOrUndefined) {
                //         diskId = diskIdOrUndefined
                //         diskName = diskId.toString() as Hostname
                //         diskCreated = 0
                //         diskCreatedTime = new Date(diskCreated)
                //         log(`Found an appnet disk on device ${device} of engine ${localEngine.id} with a hardware ID ${diskId}. Setting the name to ${diskName} and creation time to ${diskCreatedTime}`)
                //     } else if (meta) {
                //         diskName = meta.diskName as DiskName
                //         diskId = meta.diskId as DiskID
                //         diskCreated = meta.created
                //         diskCreatedTime = new Date(diskCreated)
                //         log(`Found an appnet disk on device ${device} of engine ${localEngine.id} with a META file with name ${diskName}, id ${diskId} and created on ${diskCreatedTime}`)
                //     }
                //     // Add the disk to the store
                //     log(`Updating the meta information of the disk in the store`)
                //     // @ts-ignore
                //     const disk:Disk = createOrUpdateDisk(store, localEngine.id, device, diskId, diskName, diskCreated)
                //     log(`Processing the disk`)
                //     await processDisk(store, disk)
                //     log(`Adding the disk ${disk.id} to the local engine`)
                //     addDisk(localEngine, disk)
                // } else {
                //     log('Could not find an id or a META file.  Not an app disk')
                // }

                // Check if the disk has a file META.yaml in the root location of the disk
                // If so, read the YAML content from the file and parse it into the object diskMetadata
                if (fs.existsSync(`/META.yaml`)) {
                    // Update the METADATA
                    // WRONG - the creation date can not be modfied
                    log(`Found a META file on device ${device}. This disk has been processed by the system before.`)
                    const meta: DiskMeta | undefined = await readMetaUpdateId(device)
                    if (meta) {
                        // Add the disk to the store
                        const disk: Disk = createOrUpdateDisk(storeHandle, localEngine.id, device, meta.diskId, meta.diskName, meta.created)
                        // Process the contents of the disk
                        await processDisk(storeHandle, disk)
                    } else {
                        log('Error processing the META file.')
                    }
                } else {
                    log('Could not find a META file. This disk has not yet been processed by the system.')
                }
            } catch (e) {
                log(`Error processing device ${device}`)
                log(e)
            }
        } else {
            log(`The disk on device ${device} is not on a supported device name`)
        }
    }

    const removeDevice = async (path) => {
        //log(`Device ${path} has been removed`)
        // Strip out the name of the device from the path and assign it to a variable
        const device = path.split('/').pop()
        // Check if the device begins with "sd" and ends with a letter
        if (validDevice(device)) {
            log(`Processing the removal of USB device ${device}`)
            // Remove the disk from the store
            const disk = findDiskByDevice(store, device as DeviceName)
            if (!disk) {
                log(`No disk found on ${device}`)
                return
            }
            undockDisk(storeHandle, disk)
        } else {
            log(`Non-USB device ${device} has been removed`)
        }
    }

    // *********
    // Clean up the /disks/old folder
    // *********

    if (!config.settings.isDev) { // Do not clean up the /disks/old folder in development mode
        try {
            log(`Cleaning up the /disks/old folder`)
            await $`rm -fr /disks/old/*`
        } catch (e) {
            log(`Error cleaning up the /disks/old folder`)
            log(e)
        }
    }


    // *********
    // Cleaning of the network database and the /disks folder
    // Looking at the devices that are currentluy attached to the system:
    // - Remove disks that were attached before the current boot (as recorded in the network database) 
    //   but are no longer attached now
    // - Clean up mount points in /disks that are not actual devices
    // *********

    const actualDevices = config.settings.isDev ? [] : (await $`ls /dev/engine`).toString().split('\n').filter(device => validDevice(device))
    log(`Actual devices: ${actualDevices}`)

    // Cleaning the network database
    log(`Removing from the network database disks that were attached before the current boot but are no longer attached now...`)

    // Find the disks that were previously mounted on this engine
    const storedDiskIds = getDisksOfEngine(store, localEngine) // was getKeys(localEngine.disks) as DiskID[]
    if (storedDiskIds.length !== 0) {
        log(`The engine object that is synced from the network shows that the engine had previously (before the current boot) mounted the following disks : ${storedDiskIds}`)
        
        // Find the devices that these disks were mounted on
        const storedDevices = getDisksOfEngine(store, localEngine)
            .map(disk => disk.device)
            .filter((device): device is DeviceName => device !== undefined && device !== null)
        log(`Which were mounted on these devices: ${storedDevices}`)
        log(`If these devices are no longer existing, they will be removed from the network database`)

        // For each of these devices, check if they are still actual. If not, remove them from the network database
        for (let device of storedDevices) {
            if (!actualDevices.includes(device)) {
                log(`Removing from the network the disk that was previously mounted on device ${device}`)
                // Remove the disk from the store
                const disk = findDiskByDevice(store, device as DeviceName)
                if (disk) {
                    await undockDisk(storeHandle, disk)
                    log(`Disk ${disk.id} removed from local engine`)
                }
            }
        }
    } else {
        log(`No previous disks found in the network database`)
    }

    // Cleaning the mount points: remove all mount points that are not in the actual devices
    log(`Cleaning the mount points...`)

    // TBD If this is really needed - The system seeks device names independent of the mount points and 
    // any mount points with existing content will be shadowed by the mount
    //const previousMounts = (await $`ls /disks`).toString().split('\n').filter(device => device.match(/^sd[a-z]2$/m))
    const previousMounts = config.settings.isDev ? [] : (await $`ls /disks`).toString().split('\n').filter(device => validDevice(device))
    log(`Previously mounted devices: ${previousMounts}`)
    const mountOutput = await $`mount -t ext4`
    for (let device of previousMounts) {
        log(`Checking if device ${device} is still actual or mounted`)
        if (!actualDevices.includes(device) && !mountOutput.stdout.includes(`/dev/${device} on /disks/${device} type ext4`)) {
            log(`${device} is not actual and mounted but still exists. Cleaning up device ${device}`)
            // To protect against a race condition in which the device may be mounted after the check in mountOutput, \
            // we use the unmount command once more  However, this is no guarantee that the device is not mounted again
            // To improve on this, we move the mounted output to /disks/old
            // This will then interfere with the docking of that disk, so it will not show up in the system
            // But this is better then being deleted ;-)
            // We then clean the old folder at the beginning of the USB monitor, before any new devices are being moved to /dev/old
            try {
                // log(`Unmounting device ${device}`)
                await $`umount /disks/${device}`
            } catch (e) {
                if (e.stderr.includes('not mounted')) {
                    // log(`Device ${device} is not mounted`)
                    // await $`rm -fr /disks/${device}`
                    // Create a folder /disks/old if it does not exist
                    await $`mkdir -p /disks/old`
                    await $`mv /disks/${device} /disks/old/${device}`
                    log(`Device ${device} has been moved to /disks/old`)
                } else {
                    log(`Error unmounting device during cleaning ${device}`)
                    log(e)
                }
            }

            // Previous Code
            // try {
            //     log(`Removing the content in /disks/${device}`)
            //     await $`rm -fr /disks/${device}`
            // } catch (e) {
            //     log(`Error removing folder ${device}`)
            //     log(e)
            // }

            log(`Device ${device} has been successfully cleaned up`)
        }
    }

    // *********
    // Watch the /dev/engine directory for changes
    // *********

    // Initialize the watcher
    const watchDir = '/dev/engine'
    const watcher = chokidar.watch(watchDir, {
        persistent: true,
    })

    // Add event listeners 
    watcher
        .on('add', addDevice)
        //.on('change', path => log(`File ${path} has been changed`))
        .on('unlink', removeDevice)
        .on('error', error => log(`Watcher error: ${error}`))

    // Say we are ready to go
    log(`Watching ${watchDir} for USB devices`)


}


const undockDisk = async (storeHandle: DocHandle<Store>, disk: Disk) => {
    const store: Store = storeHandle.doc()
    const device = disk.device
    if (!device) {
        log(`Disk ${disk.id} is not mounted on any device. Nothing to undock.`)
        return
    }
    // Unmount
    try {
        // Check if the mount point exists. Run "mount -t ext4" and check if the output contains the device
        const mountOutput = await $`mount -t ext4`
        if (!mountOutput.stdout.includes(`/dev/${device} on /disks/${device} type ext4`)) {
            log(`Device ${device} already unmounted`)
        } else {
            log(`Unmounting device ${device}`)
            // Unmount
            await $`umount /disks/${device}`
            await $`rmdir /disks/${device}`
            log(`Device ${device} has been successfully unmounted`)
        }
        // Remove mount point
        await $`rm -fr /disks/${device}`
        log(`Mount point /disks/${device} has been removed`)
        storeHandle.change(doc => {
            const dsk = doc.diskDB[disk.id]
            // Move the disk to the 'Undocked' state
            dsk.dockedTo = null
            // Set the disk's device to null
            dsk.device = null
        })  
        // Stop all instances of the disk and move them to the 'Undocked' state
        const instances = getKeys(store.instanceDB).filter(instanceId => store.instanceDB[instanceId].diskId === disk.id) as InstanceID[]
        for (const instanceId of instances) {
            const instance = store.instanceDB[instanceId]
            await stopInstance(storeHandle, instance, disk)
            log(`Instance ${instance.id} stopped`)
            // Move the instance to the 'Undocked' state
            storeHandle.change(doc => {
                const inst = doc.instanceDB[instance.id]
                inst.status = 'Undocked' as Status
            })
            log(`Instance ${instanceId} has been moved to the 'Undocked' state`)
        }                    
    } catch (e) {
        log(`Error unmounting device ${device}`)
        log(e)
    }
}
