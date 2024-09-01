import { subscribe } from "valtio"
import { Disk } from "../data/Disk.js"
import { deepPrint, log } from "../utils/utils.js"

export const enableDiskMonitor = (disk: Disk):void => {
    // Monitor our local engine for any changes applied from within the engine
    subscribe(disk, (value) => {
        log(`DISK MONITOR: Disk ${disk.name} is modified as follows: ${deepPrint(value)}`)
        //log(`LOCAL ENGINE ${localEngine.hostName} GLOBAL MONITOR: ${value.length} changes`)
        // if (value.length > 20) {
        //     // exit the program
        //     log(`Too many changes detected, exiting...`)
        //     process.exit(1)
        // }
    })
    log(`Added a monitor for engine ${disk.name}`)
}