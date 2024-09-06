import { $, YAML } from 'zx'
import { fileExists, log } from '../utils/utils.js'
import { DeviceName, DiskID, EngineID, Hostname, Timestamp, Version } from './CommonTypes.js'
import { Device } from 'usb'

export interface DiskMeta {
    hostname: Hostname
    engineId: EngineID
    diskId: DiskID
    created: Timestamp
    version: Version
  }
  
  export const readMeta = async (device?: string):Promise<DiskMeta | undefined> => {
    //log(`The root dir has this this content ${await $`ls /`}`)
    let path
    if (typeof device !== 'undefined') {
      path = `/disks/${device}/META.yaml`
    } else {
      path = `/META.yaml`
    }
    log(`Reading metadata at path ${path}`)
    try {
      //log(`Our current dir is ${await $`pwd`} with content ${await $`ls`} and path ${path}`)
      if (await fileExists(path)) {
        const metaContent = (await $`cat ${path}`).stdout.trim()
        const diskMetadata:DiskMeta = YAML.parse(metaContent)
        return diskMetadata
      } else {
        log('Not an app disk')
        return undefined
      }
    } catch (e) {
        return undefined
    }
  }
  
  export const readDiskId = async (device: DeviceName):Promise<DiskID | undefined> => {
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



