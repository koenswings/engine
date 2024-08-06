import os from 'os'
import { enableUsbDeviceMonitor } from './monitors/usbDeviceMonitor.js'
import { enableTimeMonitor, generateRandomArrayPopulationCallback, } from './monitors/timeMonitor.js'
import { enableEngineCommandsMonitor } from "./monitors/commandsMonitor.js"
import { enableEngineGlobalMonitor } from "./monitors/engineMonitor.js"
import { changeTest } from "./monitors/timeMonitor.js"
import { handleCommand } from './utils/commandHandler.js'
import { engineCommands } from './utils/engineCommands.js'

import { $, YAML, chalk, sleep } from 'zx'
import { enableWebSocketMonitor } from './monitors/webSocketMonitor.js'
import { deepPrint, log } from './utils/utils.js'
import { enableMulticastDNSEngineMonitor } from './monitors/mdnsMonitor.js'
import { enableInterfaceMonitor } from './monitors/interfaceMonitor.js'
import { addNetwork, findNetworkByName, getLocalEngine } from './data/Store.js'
import { config } from './data/Config.js'

let server

export const startEngine = async () => {

    log(`Hello from ${os.hostname()}!`)
    log(`The current time is ${new Date()}`)
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

    // Process the config
    const settings = config.settings

    // Start the websocket servers
    log('STARTING THE WEBSOCKET SERVERS')
    if (!settings.interfaces) {
        // No access control - listen on all interfaces
        server = enableWebSocketMonitor('0.0.0.0', '1234')   // Address '0.0.0.0' is a wildcard address that listens on all interfaces
    } else {
        // Access control - listen only on specified interfaces - also listen on localhost to sync the appnets to their persisted state
        server = enableWebSocketMonitor('0.0.0.0', '1234')   // Address '0.0.0.0' is a wildcard address that listens on all interfaces
        //enableWebSocketMonitor('127.0.0.1', '1234')
    }

    // If this process is killed or exited, close the server
    process.on('exit', () => {
        log('Closing the websocket server')
        console.log('*** Exit received ****');
        console.log('*** The Engine will be closed in 10 sec ****');
        setTimeout(shutdownProcedure, 10000);
    })
    process.on('SIGINT', () => {
        // this will be fired when you kill the app with ctrl + c.
        log('Closing the websocket server')
        console.log('*** SIGINT received ****');
        console.log('*** The Engine will be closed in 10 sec ****');
        setTimeout(shutdownProcedure, 10000);
    })
    process.on('SIGTERM', () => {
        // this will be fired by the Linux shutdown command
        log('Closing the websocket server')
        console.log('*** SIGTERM received ****');
        console.log('*** The Engine will be closed in 10 sec ****');
        setTimeout(shutdownProcedure, 10000);
    })

    // Create and sync the appnets
    await sleep(1000)
    log('CREATING AND SYNCING THE APPNETS')
    if (settings.appnets) {
        settings.appnets.forEach(async (appnet) => {
            await addNetwork(appnet.name)
        })        
    } else {
        await addNetwork("appnet")
    }
    await sleep(3000)
    const appNetwork = findNetworkByName("appnet")
    log("Local engine YMap 3 sec afer syncing: " + deepPrint(appNetwork.doc.getMap(getLocalEngine().id), 2))
    log(deepPrint(getLocalEngine(), 2))


    // Start the interface monitors
    await sleep(1000)
    log('STARTING INTERFACE MONITORS')
    if (!settings.interfaces) {
        // No access control - listen on all interfaces
        enableInterfaceMonitor([])
    } else {
        // Access control - listen only on specified interfaces - also listen on localhost to sync the appnets to their persisted state
        enableInterfaceMonitor(settings.interfaces)
    }

    await sleep(1000)
    log(chalk.bgMagenta('STARTING MULTICAST DNS ENGINE MONITOR'))
    enableMulticastDNSEngineMonitor()

    
    await sleep(1000)
    log('STARTING OBJECT MONITORS ON LOCAL ENGINE')
    enableEngineGlobalMonitor(getLocalEngine())
    enableEngineCommandsMonitor(getLocalEngine())


    await sleep(1000)
    log('STARTING MONITORING OF USB0')
    enableUsbDeviceMonitor()


    await sleep(15000)
    log('STARTING CHANGE TEST')
    changeTest()
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

}


function shutdownProcedure() {
    console.log('*** Engine is now closing ***');
    server.close()
    process.exit(0);
}

