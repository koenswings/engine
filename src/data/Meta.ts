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
    const sn = (await $`hdparm -I /dev/${device} | grep 'Serial\ Number'`).stdout
    const id = sn.trim().split(':')
    if (id.length === 2) {
      return id[1].trim() as DiskID
    } else {
      return undefined
    }
  }



