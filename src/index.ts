import os from 'os'
import { enableUsbDeviceMonitor } from './monitors/usbDeviceMonitor.js'
import { enableTimeMonitor, generateRandomArrayPopulationCallback,  } from './monitors/timeMonitor.js'
import { enableEngineCommandsMonitor } from "./monitors/commandsMonitor.js"
import { enableLocalEngineGlobalMonitor } from "./monitors/localEngineMonitor.js"
import { changeTest } from "./monitors/timeMonitor.js"
import { commands, handleCommand } from './utils/commandHandler.js'


import { $, YAML, chalk, sleep } from 'zx'
import { enableWebSocketMonitor } from './monitors/webSocketMonitor.js'
import { log } from './utils/utils.js'
import { enableMulticastDNSEngineMonitor } from './monitors/mdnsMonitor.js'

log(`Hello from ${os.hostname()}!`) 
log(`Interfaces: ${JSON.stringify(os.networkInterfaces())}`)
log(`Platform: ${os.platform()}`)
log(`Architecture: ${os.arch()}`)
log(`OS Type: ${os.type()}`)
log(`OS Release: ${os.release()}`)
log(`OS Uptime: ${os.uptime()}`)
log(`OS Load Average: ${os.loadavg()}`)
log(`Total Memory: ${os.totalmem()}`)
log(`Free Memory: ${os.freemem()}`)
log(`CPU Cores: ${os.cpus().length}`)
log(`User Info: ${JSON.stringify(os.userInfo())}`)
log(`Home Directory: ${os.homedir()}`)
log(`Temp Directory: ${os.tmpdir()}`)
log(`Endianness: ${os.endianness()}`)
log(`Network Hostname: ${os.hostname()}`)

// UPDATE001: Comment the following code in case we want to only open sockets on the interfaces that we monitor
log('STARTING MONITOR OF WEBSOCKETS')
enableWebSocketMonitor('0.0.0.0', '1234')   // Address '0.0.0.0' is a wildcard address that listens on all interfaces


log('STARTING OBJECT MONITORS ON LOCAL ENGINE')
enableLocalEngineGlobalMonitor()
enableEngineCommandsMonitor()

console.log(chalk.bgMagenta('STARTING MULTICAST DNS ENGINE MONITOR'))
enableMulticastDNSEngineMonitor()



// Read an external file that contains a list of commands that we want to execute at startup
// The file is a Yaml file that has a startupCommands property that is an array of strings
// Each string is a command that we want to execute
interface Config {
    startupCommands: string[],
}
let config:Config

try {
    const configFile = await $`cat config.yaml`
    config = YAML.parse(configFile.stdout)
}
catch (e) {
    log(chalk.red('Error reading config'));
    console.error(e);
    process.exit(1); 
}
log(chalk.green(`Config read: ${config}`));

// Execute each command in the startupCommands array
config.startupCommands.forEach((command) => {
    log(`Executing command: ${command}`)
    handleCommand(commands, command)
})   
  
sleep(5000)  
log('STARTING MONITORING OF USB0')
enableUsbDeviceMonitor()
sleep(5000)
log('STARTING CHANGE TEST')
enableTimeMonitor(300000, changeTest)



// log('STARTING MONITOR OF ETH0')
// enableNetworkMonitor('eth0', 'LAN')
// log('SLEEPING')
// await sleep(5000)
// log('STARTING MONITOR OF LO')
// enableNetworkMonitor('lo', 'Self')
// log('SLEEPING')
// await sleep(5000)



// log(`Randomly populating and depopulating apps array every 5 seconds`)
// const apps = new Array<string>()
// enableDateTimeMonitor(5000, generateRandomArrayPopulationCallback())


// log(`Logging the time every 5 seconds`)
// enableTimeMonitor(5000, logTimeCallback)

// log(`Randomly populating and depopulating apps array every 5 seconds`)
// const apps = new Array<object>()
// enableDateTimeMonitor(5000, generateRandomArrayModification(apps))














