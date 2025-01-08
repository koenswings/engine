import { $, chalk, YAML } from 'zx'
import { fileExists, log, uuid } from '../utils/utils.js'
import { DeviceName, DiskID, DiskName, EngineID, Hostname, Timestamp, Version } from './CommonTypes.js'
import { Device } from 'usb'
import { write } from 'fs'

export interface DiskMeta {
  diskId: DiskID        // The serial number of the disk or user-assigned iif there is no serial number - We store it so that it easily inspectable
  diskName: DiskName    // The user-defined name of the disk.  Not necessarily unique
  //engineId: EngineID
  created: Timestamp    // The timestamp when the disk was created
  version?: Version     // Only applicable to system disks - the version of the engine running on the disk
  lastDocked: Timestamp // The timestamp when the disk was last docked (in cqse of an app disk) or when the engine was last booted (in case of a system disk)
}

// Create a sample META.yaml file for an appdisk with id AA000000000000000724 and a create timestamp corresponding to 2024-12-12 and a lastDocked timestamp corresponding to 2025-01-07
const sampleMeta: DiskMeta = {
  diskId: 'AA000000000000000724' as DiskID,
  diskName: 'MyAppDisk' as DiskName,
  created: 1731446400000 as Timestamp,
  lastDocked: 1733673600000 as Timestamp
}

// The corresponding YAML string
// diskId: 'AA000000000000000724'
// diskName: 'Nextcloud' 
// created:    1731446400000 
// lastDocked: 1733673600000 

export const readMetaUpdateId = async (device?: DeviceName): Promise<DiskMeta | undefined> => {
  //log(`The root dir has this this content ${await $`ls /`}`)
  let path
  let rootDevice: DeviceName
  if (device !== 'undefined') {
    path = `/disks/${device}/META.yaml`
    rootDevice = (await $`findmnt / -no SOURCE`).stdout.split('/')[2] as DeviceName
  } else {
    path = `/META.yaml`
    rootDevice = device
  }
  log(`Reading metadata at path ${path}`)
  try {
    //log(`Our current dir is ${await $`pwd`} with content ${await $`ls`} and path ${path}`)
    if (await fileExists(path)) {

      // Find the hardware id
      let diskId = await readDiskId(rootDevice) as DiskID
      if (diskId === undefined) {
        diskId = uuid() as DiskID
      }

      // Read the META.yaml file
      const metaContent = (await $`cat ${path}`).stdout.trim()
      const meta: DiskMeta = YAML.parse(metaContent)

      // If the diskId does not match the one in the META file, update it
      if (meta.diskId !== diskId) {
        meta.diskId = diskId
        log(`Found a new hardware id that is different from the one in the META file. Updating disk id to ${diskId}`)
        await writeMeta(meta, path)
      }
      return meta
    } else {
      log(`No META file found at path ${path}. This disk has not yet been touched by the system.`)
      return undefined
    }
  } catch (e) {
    return undefined
  }
}

export const readDiskId = async (device: DeviceName): Promise<DiskID | undefined> => {
  log(`Reading disk id for device ${device}`)
  try {
    const sn = (await $`hdparm -I /dev/${device} | grep 'Serial\ Number'`).stdout
    log(`Serial number is ${sn}`)
    const id = sn.trim().split(':')
    log(`split ID is ${id}`)
    if (id.length === 2) {
      return id[1].trim() as DiskID
    } else {
      log(`Cannot read disk id for device ${device}`)
      return undefined
    }
  } catch (e) {
    log(`Error reading disk id of device ${device}: ${e}`)
    return undefined
  }
}


export const createMeta = async (device: DeviceName, version: Version | undefined = undefined): Promise<DiskMeta> => {
  // Find the hardware id
  let diskId = await readDiskId(device) as DiskID
  if (diskId === undefined) {
    diskId = uuid() as DiskID
  }

  const meta: DiskMeta = {
    diskId: diskId,
    diskName: diskId.toString() as DiskName,
    created: new Date().getTime() as Timestamp,
    lastDocked: new Date().getTime() as Timestamp
  }
  if (version) {
    meta.version = version
  }

  try {
    // Create the META.yaml file
    writeMeta(meta, `/META.yaml`)
  } catch (e) {
    console.log(chalk.red('Error creating metadata'));
  }
  return meta
}

const writeMeta = async (meta: DiskMeta, rootPath: string): Promise<void> => {
  const enginePath = `/home/pi`
  await $`sudo echo 'diskId: ${meta.diskId}' >> ${enginePath}/METAtemp.yaml`
  await $`sudo echo 'diskName: ${meta.diskId}' >> ${enginePath}/METAtemp.yaml`
  await $`sudo echo 'created: ${meta.created}' >> ${enginePath}/METAtemp.yaml`
  await $`sudo echo 'lastDocked: ${meta.lastDocked}' >> ${enginePath}/METAtemp.yaml`
  if (meta.version) {
    await $`sudo echo 'version: ${meta.version}' >> ${enginePath}/METAtemp.yaml`
  }
  // Move the META.yaml file to the root directory
  await $`sudo mv ${enginePath}/META.yaml ${rootPath}`
}


