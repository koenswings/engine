import chokidar from 'chokidar'
import { fileExists, log } from '../utils/utils.js'
import { $, YAML } from 'zx'
import { Disk, createDisk, syncDiskWithFile } from '../data/Disk.js'
import { addDisk, removeDisk, findDiskByDevice } from '../data/Engine.js'
import { getLocalEngine } from '../data/Store.js'


export const enableUsbDeviceMonitor = () => {
    // TODO: Alternative implementations for usb device detection:
    // 1. Monitor /dev iso /dev/engine
    // 2. Monitor /dev/disk/by-label
    // 3. Monitor dmesg

    const localEngine = getLocalEngine()
    const watchDir = '/dev/engine'
    const watcher = chokidar.watch(watchDir, {
        persistent: true,
    })


    watcher
        .on('add', async function (path) {
            // log(`Device ${path} has been added`)
            // Strip out the name of the device from the path and assign it to a variable
            const device = path.split('/').pop()
            // Check if the device begins with "sd", is then followed by a letter and ends with the number 2
            // We need the m flag - see https://regexr.com/7rvpq
            if (device.match(/^sd[a-z]2$/m)) {
                log(`USB device ${device} has been added`)
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
                    if (await fileExists(`/disks/${device}/META.yaml`)) {
                        const metaContent = (await $`cat /disks/${device}/META.yaml`).stdout.trim()
                        const diskMetadata = YAML.parse(metaContent)
                        const diskName = diskMetadata.name
                        const diskCreated = diskMetadata.created as number
                        const diskCreatedTime = new Date(diskCreated)
                        log(`Found an appnet disk on device ${device} with name ${diskName} and created on ${diskCreatedTime}`)
                        // Add the disk to the store
                        const disk:Disk = createDisk(device, diskName, diskCreated)
                        await syncDiskWithFile(disk)
                        addDisk(localEngine, disk)
                    } else {
                        log('Not an app disk')
                    }                    
                } catch (e) {
                    log(`Error mounting device ${device}`)
                    log(e)
                }
            } else {
                log(`Non-USB device ${device} has been added`)
            }
        })
        //.on('change', path => log(`File ${path} has been changed`))
        .on('unlink', async function (path) {
            //log(`Device ${path} has been removed`)
            // Strip out the name of the device from the path and assign it to a variable
            const device = path.split('/').pop()
            // Check if the device begins with "sd" and ends with a letter
            if (device.match(/^sd[a-z]2$/m)) {
                log(`USB device ${device} has been removed`)
                // Remove the disk from the store
                const disk = findDiskByDevice(localEngine, device)
                if (disk) {
                    removeDisk(localEngine, disk)
                    log(`Disk ${device} removed from store`)
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
                } catch (e) {
                    log(`Error unmounting device ${device}`)
                    log(e)
                }
            } else {
                log(`Non-USB device ${device} has been removed`)
            }
        })
        .on('error', error => log(`Watcher error: ${error}`))

    // Say we are ready to go
    log(`Watching ${watchDir} for USB devices`)
}



function createDiskFromFile(device: string, diskName: any, diskCreated: number) {
    throw new Error('Function not implemented.')
}

