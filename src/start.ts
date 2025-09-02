import os from 'os'
import { enableUsbDeviceMonitor } from './monitors/usbDeviceMonitor.js'
import { enableTimeMonitor, generateHeartBeat, generateRandomArrayPopulationCallback, } from './monitors/timeMonitor.js'
import { enableEngineCommandsMonitor, enableEngineLastRunMonitor, enableEngineSetMonitor } from "./monitors/enginesMonitor.js"
import { changeTest } from "./monitors/timeMonitor.js"
import { handleCommand } from './utils/commandHandler.js'
import { engineCommands } from './utils/engineCommands.js'

import { $, YAML, chalk, fs, sleep } from 'zx'
import { deepPrint, log, uuid } from './utils/utils.js'
import { config } from './data/Config.js'
import { createOrUpdateEngine, inspectEngine, localEngineId } from './data/Engine.js'
import { AppnetName, IPAddress, PortNumber, Timestamp } from './data/CommonTypes.js'
import { enableIndexServer, enableInstanceStatusMonitor } from './monitors/instancesMonitor.js'
import { Docker } from 'node-docker-api'
import { throttle } from '@automerge/automerge-repo/helpers/throttle.js'
import { DocumentId, Repo } from '@automerge/automerge-repo'
import { startAutomergeServer } from './repo.js'
import { enableMulticastDNSEngineMonitor } from './monitors/mdnsMonitor.js'
import { createServerStore, getLocalEngine, initialiseServerStore } from './data/Store.js'
import { enableStoreMonitor } from './monitors/storeMonitor.js'



export const startEngine = async (disableMDNS?:boolean):Promise<void> => {

    log(`Hello from ${os.hostname()}!`)
    log(`The current time is ${new Date()}`)
    log('Here is some information about the system:')
    log(`  Interfaces: ${JSON.stringify(os.networkInterfaces())}`)
    log(`  Platform: ${os.platform()}`)
    log(`  Architecture: ${os.arch()}`)
    log(`  OS Type: ${os.type()}`)
    log(`  OS Release: ${os.release()}`)
    log(`  OS Uptime: ${os.uptime()}`)
    log(`  OS Load Average: ${os.loadavg()}`)
    log(`  Total Memory: ${os.totalmem()}`)
    log(`  Free Memory: ${os.freemem()}`)
    log(`  CPU Cores: ${os.cpus().length}`)
    log(`  User Info: ${JSON.stringify(os.userInfo())}`)
    log(`  Home Directory: ${os.homedir()}`)
    log(`  Temp Directory: ${os.tmpdir()}`)
    log(`  Endianness: ${os.endianness()}`)
    log(`  Network Hostname: ${os.hostname()}`)

    // Process the config
    const settings = config.settings
    const STORE_DATA_PATH = "./"+config.settings.storeDataFolder
    const STORE_IDENTITY_PATH = "./"+config.settings.storeIdentityFolder
    const STORE_URL_PATH = STORE_IDENTITY_PATH + "/store-url.txt"
    const STORE_TEMPLATE_PATH = STORE_IDENTITY_PATH + "/store-template.json" 

    // Create the store data directory if it does not yet exist
    if (!fs.existsSync(STORE_DATA_PATH)) {
        log(`Creating the store data folder at ${STORE_DATA_PATH}`)
        await $`mkdir -p ${STORE_DATA_PATH}`
    }

    // Create the store identity directory if it does not yet exist
    if (!fs.existsSync(STORE_IDENTITY_PATH)) {
        log(`Creating the store identity folder at ${STORE_IDENTITY_PATH}`)
        await $`mkdir -p ${STORE_IDENTITY_PATH}`
    }

    log(`Starting Automerge server...`)
    const repo = await startAutomergeServer(STORE_DATA_PATH)

    // If the store URL file does not exist, create it and an initial store document
    // This should only happen if we change the structure of the store document
    // and we want to force the creation of a new initial store document by deleting the old one
    if (!fs.existsSync(STORE_URL_PATH) || !fs.existsSync(STORE_TEMPLATE_PATH)) {
        log(`No URL file found at ${STORE_URL_PATH} or template file found at ${STORE_TEMPLATE_PATH}. Recreating them.`);
        await initialiseServerStore(repo, STORE_TEMPLATE_PATH, STORE_URL_PATH);
    }

    const storeDocUrlStr = fs.readFileSync(STORE_URL_PATH, 'utf-8');
    const storeDocId = storeDocUrlStr.replace('automerge:', '') as DocumentId;
    log(`Using document ID: ${storeDocId}`)

    // HACK: Force save on remote changes
    // The repo doesn't persist changes that come in from a remote peer automatically.
    // This is a workaround to force a save by listening for the sync-state event and then
    // calling the throttled save function that the repo uses internally.
    // const throttledSave = throttle(() => {
    //     if (repo.storageSubsystem) {
    //         repo.storageSubsystem.saveDoc(storeHandle.documentId, storeHandle.doc())
    //     }
    // }, 100)
    
    // repo.synchronizer.on('sync-state', () => {
    //     throttledSave()
    // })

    log(`Initialising store`)
    const storeHandle = await createServerStore(repo, storeDocId, STORE_DATA_PATH, STORE_TEMPLATE_PATH)

    // Create or update the local engine object
    const engine = await createOrUpdateEngine(storeHandle, localEngineId)
    await storeHandle.whenReady()
    const store = storeHandle.doc()

    // Start the app index server
    log(chalk.bgMagenta('STARTING THE INDEX SERVER'))
    await enableIndexServer(storeHandle, settings.port as PortNumber || 1234 as PortNumber)
    
    // If this process is killed, shut down automerge
    process.on('SIGINT', async () => {
        // this will be fired when you kill the app with ctrl + c.
        log('Shutting down automerge')
        log('*** SIGINT received ****');
        await shutdownProcedure(repo)
        process.exit(0)
    })
    process.on('SIGTERM', async () => {
        // this will be fired by the Linux shutdown command
        log('Shutting down automerge')
        log('*** SIGTERM received ****');
        await shutdownProcedure(repo)
        process.exit(0)
    })

    await sleep(1000)
    log(chalk.bgMagenta('STARTING STORE MONITOR'))
    enableStoreMonitor(storeHandle)

    const configMDNS = config.settings.mdns
    if (!disableMDNS && configMDNS) {
        await sleep(1000)
        log(chalk.bgMagenta('STARTING MULTICAST DNS MONITOR'))
        enableMulticastDNSEngineMonitor(store, repo)
    }


    await sleep(1000)
    log(chalk.bgMagenta('STARTING MONITORING OF USB DEVICES'))
    enableUsbDeviceMonitor(store)

    await sleep(1000)
    log(chalk.bgMagenta('STARTING HEARTBEAT GENERATION'))
    generateHeartBeat(storeHandle)
    enableTimeMonitor(5000, () => generateHeartBeat(storeHandle))

}


async function shutdownProcedure(repo:Repo):Promise<void> {
    console.log('*** Engine is now closing ***');
    if (repo) await repo.shutdown()
}