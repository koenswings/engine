import os from 'os'
import { enableUsbDeviceMonitor } from './monitors/usbDeviceMonitor.js'
import { enableTimeMonitor, generateHeartBeat, generateRandomArrayPopulationCallback, } from './monitors/timeMonitor.js'
import { enableEngineCommandsMonitor, enableEngineSetMonitor } from "./monitors/enginesMonitor.js"
import { changeTest } from "./monitors/timeMonitor.js"
import { handleCommand } from './utils/commandHandler.js'
import { engineCommands } from './utils/engineCommands.js'

import { $, YAML, chalk, sleep } from 'zx'
import { enableWebSocketMonitor } from './monitors/webSocketMonitor.js'
import { deepPrint, log, uuid } from './utils/utils.js'
import { enableMulticastDNSEngineMonitor } from './monitors/mdnsMonitor.js'
import { enableInterfaceMonitor } from './monitors/interfaceMonitor.js'
import { addNetwork, findNetworkByName, getLocalEngine, initialiseStore } from './data/Store.js'
import { config } from './data/Config.js'
import { initialiseLocalEngine } from './data/Engine.js'
import { AppnetName, IPAddress, PortNumber } from './data/CommonTypes.js'
import { store } from './data/Store.js'
import { enableIndexServer, enableInstanceSetMonitor } from './monitors/instancesMonitor.js'

let server

export const startEngine = async (disableMDNS?:boolean):Promise<void> => {

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

    // Start the app index server
    log(chalk.bgMagenta('STARTING THE INDEX SERVER FOR APPNET'))
    enableIndexServer(store, 'appnet' as AppnetName)


    // Start the websocket servers
    await sleep(1000)
    log(chalk.bgMagenta('STARTING THE WEBSOCKET SERVERS'))
    server = enableWebSocketMonitor('0.0.0.0' as IPAddress, 1234 as PortNumber)   // Address '0.0.0.0' is a wildcard address that listens on all interfaces

    // OLD - Only start a websocket server on the local address now and add additional servers for all settings.interfaces later on to control access
    // if (!settings.interfaces) {
    //     // No access control - listen on all interfaces
    //     server = enableWebSocketMonitor('0.0.0.0' as IPAddress, 1234 as PortNumber)   // Address '0.0.0.0' is a wildcard address that listens on all interfaces
    // } else {
    //     // Access control - listen only on specified interfaces - also listen on localhost to sync the appnets to their persisted state
    //     enableWebSocketMonitor('127.0.0.1' as IPAddress, '1234')
    // }

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
    log(chalk.bgMagenta('CREATING AND SYNCING THE APPNETS'))
    if (settings.appnets) {
        settings.appnets.forEach(async (appnet) => {
            await addNetwork(store, appnet.name as AppnetName)
        })        
    } else {
        await addNetwork(store, "appnet" as AppnetName)
    }

    // Initialize the local engine
    await sleep(1000)
    log(chalk.bgMagenta('INITIALISING THE LOCAL ENGINE'))
    const localEngine = await initialiseLocalEngine(store)

    await sleep(1000)
    log(chalk.bgMagenta('STARTING MONITORS ON ALL ENGINES'))
    store.networks.forEach((network) => {
        enableEngineSetMonitor(store, network)
    })

    await sleep(1000)
    log(chalk.bgMagenta('STARTING A COMMANDS MONITOR ON THE LOCAL ENGINE'))
    enableEngineCommandsMonitor(localEngine)

    await sleep(1000)
    log(chalk.bgMagenta('STARTING INSTANCES MONITOR'))
    store.networks.forEach((network) => {
        enableInstanceSetMonitor(store, network)
    })


    // Start the interface monitors
    await sleep(1000)
    log(chalk.bgMagenta('STARTING INTERFACE MONITORS'))
    if (!settings.interfaces) {
        // No access control - listen on ALL interfaces
        enableInterfaceMonitor(store, [])
    } else {
        // Access control - listen only on the specified interfaces
        enableInterfaceMonitor(store, settings.interfaces)
    }

    await sleep(1000)
    log(chalk.bgMagenta('STARTING MULTICAST DNS MONITOR'))
    if (!disableMDNS) enableMulticastDNSEngineMonitor(store)


    await sleep(1000)
    log(chalk.bgMagenta('STARTING MONITORING OF USB DEVICES'))
    enableUsbDeviceMonitor(store)


    await sleep(15000)
    // log(chalk.bgMagenta('STARTING CHANGE TEST'))
    // changeTest(store)
    // enableTimeMonitor(300000, changeTest)
    log(chalk.bgMagenta('STARTING HEARTBEAT GENERATION'))
    generateHeartBeat()
    enableTimeMonitor(60000, generateHeartBeat)






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


function shutdownProcedure():void {
    console.log('*** Engine is now closing ***');
    server.close()
    process.exit(0);
}

