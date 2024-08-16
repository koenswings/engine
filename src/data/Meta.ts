import { $, YAML } from 'zx'
import { fileExists, log } from '../utils/utils.js'
import { DiskID, Hostname, Timestamp, Version } from './CommonTypes.js'

export interface DiskMeta {
    name: Hostname
    id: DiskID
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
  