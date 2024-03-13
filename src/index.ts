import os from 'os'
import { enableYjsWebSocketService } from './services/yjsWebSocketService.js'
import { monitorInterface } from './services/networkInterfaceMonitor.js'
import { enableUsbDeviceMonitor } from './services/usbDeviceMonitor.js'
import { enableDateTimeMonitor } from './services/dateTimeMonitor.js'

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

monitorInterface('eth0', 'LAN')
monitorInterface('lo', 'Self')

enableUsbDeviceMonitor()

//enableDateTimeMonitor()











