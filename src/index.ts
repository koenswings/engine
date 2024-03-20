import os from 'os'
import { monitorNetwork } from './monitors/networkMonitor.js'
import { enableUsbDeviceMonitor } from './monitors/usbDeviceMonitor.js'
import { enableTimeMonitor, generateRandomArrayPopulationCallback,  } from './monitors/timeMonitor.js'
import { enableEngineCommandsMonitor } from "./monitors/commandsMonitor.js"
import { enableEngineGlobalMonitor } from "./monitors/engineMonitor.js"
import { changeTest } from "./monitors/timeMonitor.js"

import { sleep } from 'zx'

console.log(`Hello from ${os.hostname()}!`) 
console.log(`Interfaces: ${JSON.stringify(os.networkInterfaces())}`)
console.log(`Platform: ${os.platform()}`)
console.log(`Architecture: ${os.arch()}`)
console.log(`OS Type: ${os.type()}`)
console.log(`OS Release: ${os.release()}`)
console.log(`OS Uptime: ${os.uptime()}`)
console.log(`OS Load Average: ${os.loadavg()}`)
console.log(`Total Memory: ${os.totalmem()}`)
console.log(`Free Memory: ${os.freemem()}`)
console.log(`CPU Cores: ${os.cpus().length}`)
console.log(`User Info: ${JSON.stringify(os.userInfo())}`)
console.log(`Home Directory: ${os.homedir()}`)
console.log(`Temp Directory: ${os.tmpdir()}`)
console.log(`Endianness: ${os.endianness()}`)
console.log(`Network Hostname: ${os.hostname()}`)

enableEngineGlobalMonitor()
enableEngineCommandsMonitor()

console.log('STARTING MONITOR OF ETH0')
monitorNetwork('eth0', 'LAN')
console.log('SLEEPING')
await sleep(5000)
console.log('STARTING MONITOR OF LO')
monitorNetwork('lo', 'Self')
console.log('SLEEPING')
await sleep(5000)
console.log('STARTING MONITOR OF USB0')
enableUsbDeviceMonitor()

enableTimeMonitor(300000, changeTest)


// log(`Randomly populating and depopulating apps array every 5 seconds`)
// const apps = new Array<string>()
// enableDateTimeMonitor(5000, generateRandomArrayPopulationCallback())


// log(`Logging the time every 5 seconds`)
// enableTimeMonitor(5000, logTimeCallback)

// log(`Randomly populating and depopulating apps array every 5 seconds`)
// const apps = new Array<object>()
// enableDateTimeMonitor(5000, generateRandomArrayModification(apps))














