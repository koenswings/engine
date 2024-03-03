import os from 'os'
import { Doc, Array } from 'yjs'
import { WebsocketProvider } from './y-websocket.js'
import { log } from './utils/utils.js'
import { enableYjsWebSocketService } from './services/yjsWebSocketService.js'
import { enableRandomArrayPopulation } from './services/randomDataChangeServices.js'
import { enableNetworkInterfaceMonitor } from './services/networkInterfaceMonitor.js'
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

enableNetworkInterfaceMonitor()

enableUsbDeviceMonitor()

enableYjsWebSocketService()

//enableDateTimeMonitor()


const sharedDoc = new Doc()
const apps:Array<string> = sharedDoc.getArray('apps')
// every time a local or remote client modifies apps, the observer is called
apps.observe(event => {
  console.log(`apps was modified. Apps is now: ${JSON.stringify(apps.toArray())}`)
})
log('Observing apps')



// create a websocket client
const host = 'localhost'
const wsProvider = new WebsocketProvider(`ws://${host}:1234`, 'appdocker', sharedDoc)
wsProvider.on('status', (event: { status: any; }) => {
  console.log(event.status) // logs "connected" or "disconnected"
})
log(`Establishing a connection to ws://${host}:1234 with room name appdocker`)



enableRandomArrayPopulation(apps)








