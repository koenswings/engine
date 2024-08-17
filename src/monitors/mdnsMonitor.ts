import mDnsSd from 'node-dns-sd'
import events from 'events'   // See https://nodejs.org/api/events.html#events 
import { IPnumber, deepPrint, log, sameNet } from '../utils/utils.js';
import { chalk } from 'zx';
import { Store, findNetworkByName, getLocalEngine } from '../data/Store.js';
import { config } from '../data/Config.js';
import { connectEngine } from '../data/Network.js'
import ciao from '@homebridge/ciao'
import { getInterfacesToRemoteEngine } from '../data/Engine.js';
import { AppnetName, InterfaceName } from '../data/CommonTypes.js';

// log(`***node-dns-sd*** Starting mDnsSd Monitoring`)
// log(Netmask)

// Create an eventEmitter object that emits events when a new engine is discovered on a specified network
export const engineMonitor = new events.EventEmitter();

interface DiscoveredEngine {
    address: string,
    familyName: string
    modelName: string
}

const discoveredEngines: DiscoveredEngine[] = []

export const startAdvertising = (store: Store, networkName: AppnetName, restrictedInterfaces: InterfaceName[]): void => {
    const engine = getLocalEngine(store)
    const engineName = engine.hostName
    const engineVersion = engine.version
    const responder = ciao.getResponder()
    let service

    // Advertise the local engine on the network using mdns using the following service name: engineName._engine._tcp
    if (engineName && restrictedInterfaces.length === 0) {
        log(`Advertising on all interfaces  `)
        service = responder.createService({
            name: engineName.toString(),
            type: 'engine',
            port: 1234, // optional, can also be set via updatePort() before advertising
            txt: {
                name: engineName,
                version: engineVersion,
                appnet: networkName,
            }
        })
    } else if (engineName) {
        log(`Advertising on the following interfaces: ${restrictedInterfaces}`)
        service = responder.createService({
            name: engineName,
            type: 'engine',
            port: 1234, // optional, can also be set via updatePort() before advertising
            restrictedAddresses: restrictedInterfaces,
            txt: {
                name: engineName,
                version: engineVersion,
                appnet: networkName,
            }
        })
    }

    service.advertise().then(() => {
        // stuff you do when the service is published
        log(`Service published for appnet ${networkName})`);
    })

    // Register a callback on the mdnsMonitor for new engines on this interface and network
    engineMonitor.on(`new_engine_on_network_${networkName}`, (device) => {
        log(chalk.bgMagenta(`Engine ${device.modelName} discovered on network ${networkName}`))
        const network = findNetworkByName(networkName)
        if (network) {

            // Access control
            const restrictedInterfaces = config.settings.interfaces ? config.settings.interfaces : []
            const interfacesToRemoteEngine = getInterfacesToRemoteEngine(getLocalEngine(network.store), device.address)
            // Check if there is an overlap between the restricted interfaces and the interfaces to the remote engine
            const networkInterfaces = interfacesToRemoteEngine.filter((iface) => restrictedInterfaces.includes(iface.name))
            const accessGranted = networkInterfaces.length > 0

            // If access is granted, connect the engine
            if (accessGranted) {
                connectEngine(network, device.address)
            }
        }

    })

    // The following comments show or past failed attempts to advertise the engine using the mdns package
    // ********* MDNS Advertisement (error) *********
    // const txtRecord = {
    //     name: engineName,
    //     version: engineVersion,
    //     network: networkName
    // }
    // // const ad = mdns.createAdvertisement(mdns.tcp('engine'), 1234, { txtRecord: txtRecord})
    // const service = mdns.tcp('engine')
    // log(`Service: ${service}`)
    // const ad = mdns.createAdvertisement(service, 1234)
    // ad.start()
    // log(`Engine ${engineName} advertised on network ${networkName}`)
    // ********* MDNS Advertisement (error) *********

}

const discoverEngines = (): void => {

    // ********* MDNS Discovery (error) *********
    // Now discover other engines on the same network
    // const browser = mdns.createBrowser(mdns.tcp('engine', 'api-v1'))
    // const browser = mdns.createBrowser(mdns.tcp('_googlecast'))
    // browser.on('serviceUp', function(service) {
    //      log(`Engine ${service.name} found`)
    // })
    // browser.on('serviceDown', function(service) {
    //      log(`Engine ${service.name} left network`)
    // })
    // browser.start()

    // ********* Discovery using node-dns-sd Packet Monitor (error) *********
    // log(`***node-dns-sd*** Setting a data monitor`)
    // mDnsSd.ondata = (packet) => {
    //     console.log("***node-dns-sd*** "+JSON.stringify(packet, null, '  '));
    // };

    // log(`***node-dns-sd*** Starting mDnsSd Monitoring`)
    // mDnsSd.startMonitoring().then(() => {
    //     console.log('***node-dns-sd*** - mDnsSd Monitoring started.');
    // }).catch((error) => {
    //     log(`***node-dns-sd*** Error starting mDnsSd Monitoring`)
    //     console.error(error);
    // });

    // ********* node-dns-sd Discovery *********
    // log(`***node-dns-sd*** Discovering engines `)
    mDnsSd.discover({
        name: '_engine._tcp.local'
    }).then((deviceList) => {
        // console.log("***node-dns-sd*** "+deepPrint(device_list, 1));
        if (deviceList.length === 0) {
            log(chalk.bgBlackBright(`No engines found`))
        } else {
            log(chalk.bgBlackBright(`Engines found: ${deviceList.map((device) => device.modelName + " @ " + device.address)}`))
            deviceList.forEach((device) => {
                // Search of a package with type TXT on the list in device.packet.additionals, and return the rdata property
                // This is the txt record that we added to the service
                const txt = device.packet.additionals.find((add) => ((typeof add == 'object') && add.hasOwnProperty('type') && add.type === 'TXT'));

                if (!txt || !txt.rdata) {
                    log(chalk.redBright(`************* No TXT record found for engine ${device.modelName}. Not adding it to the list: it must be rediscovered with a valid TXT object`))
                } else {
                    const txtRecord = txt.rdata
                    //log(chalk.bgBlackBright(`TXT record found for engine ${device.modelName}: ${deepPrint(txtRecord, 2)}`))
                    // log(chalk.bgMagenta(`Adding engine ${device.familyName} to the list of engines`))
                    //log(chalk.bgBlackBright(`Adding engine: ${deepPrint(device, 1)}`))
                    const appnet = txtRecord.appnet
                    // Emit an event for the network
                    log(chalk.bgMagenta(`Engine ${device.modelName} is on network ${appnet}`))
                    const network = findNetworkByName(appnet)

                    if (network) {

                        // Access control
                        const restrictedInterfaces = config.settings.interfaces ? config.settings.interfaces : []
                        const interfacesToRemoteEngine = getInterfacesToRemoteEngine(getLocalEngine(network.store), device.address)
                        // Check if there is an overlap between the restricted interfaces and the interfaces to the remote engine
                        const networkInterfaces = interfacesToRemoteEngine.filter((iface) => restrictedInterfaces.includes(iface.name))
                        const accessGranted = networkInterfaces.length > 0

                        // If access is granted, connect the engine
                        if (accessGranted) {
                            connectEngine(network, device.address)
                        }
                    }

                }
            })
        }
    }).catch((error) => {
        log(`***node-dns-sd*** Error discovering engines`)
        console.error(error);
    });
}

// const removeEngine = (deviceFamilyname:string):void => {
//     const engine = discoveredEngines.find((engine) => engine.familyName === deviceFamilyname)
//     if (engine) {
//         discoveredEngines.splice(discoveredEngines.indexOf(engine), 1)
//         log(`Engine ${engine.familyName} no longer found`)
//         logDeviceList(discoveredEngines)
//     }
// }

// const logDeviceList = (discoveredEngines:DiscoveredEngine[]):void => {
//     discoveredEngines.forEach((engine) => {
//         log(printEngine(engine))
//     })
// }

// const printEngine = (engine:DiscoveredEngine):string => {
//     // console.log(`${engine.familyName} ${engine.address}`)
//     //console.log(chalk.bgBlackBright(`${engine.modelName} @ ${engine.address}`))
//     return `${engine.modelName} @ ${engine.address}`
// }


export const enableMulticastDNSEngineMonitor = (store: Store): void => {
    const restrictedInterfaces = config.settings.interfaces ? config.settings.interfaces : []
    const appnets = config.settings.appnets
    if (appnets) {
        appnets.forEach((appnet) => {
            startAdvertising(store, appnet.name as AppnetName, restrictedInterfaces)
        })
        // Call discoverEngines every 10 seconds
        setInterval(discoverEngines, 60000)
        // Call it for the first time
        discoverEngines()
    }
}
