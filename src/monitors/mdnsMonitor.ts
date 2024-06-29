import mDnsSd from 'node-dns-sd'
import events from 'events'   // See https://nodejs.org/api/events.html#events 
import { IPnumber, deepPrint, log, sameNet } from '../utils/utils.js';
import { chalk } from 'zx';
import { findNetworkByName, getLocalEngine } from '../data/Store.js';
import { config } from '../data/Config.js';
import { connectEngine } from '../data/Network.js'
import ciao from '@homebridge/ciao'
import { getInterfacesToRemoteEngine } from '../data/Engine.js';

// log(`***node-dns-sd*** Starting mDnsSd Monitoring`)
// log(Netmask)

// Create an eventEmitter object that emits events when a new engine is discovered on a specified network
export const engineMonitor = new events.EventEmitter();

interface Device {
    address: string,
    familyName: string
}

const engines:Device[] = [] 

// Write a function that calls the mDnsSd.discover function every 10 seconds to retrieve the current active list of engines
// It should then compares that list with the list of engines in the store and updates the store with any new engines found
// The function should also remove any engines from the store that are no longer active
// The function should be called from the monitorForOtherEngines function
// The function should be called every 10 seconds
// The function should be called with a setInterval
const oldDiscoverEngines = () => {

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
        }).then((deviceList) =>{
        // console.log("***node-dns-sd*** "+deepPrint(device_list, 1));
        console.log(chalk.bgBlackBright(`Engines found: ${deviceList.map((device) => device.modelName+" @ "+device.address)}`))
        deviceList.forEach((device) => {
            if (!engines.find((engine) => engine.address === device.address)) {
                // Now search of a package with type TXT on the list in device.packet.additionals, and return the rdata property
                // This is the txt record that we added to the service
                const txt = device.packet.additionals.find((add) => ((typeof add == 'object') && add.hasOwnProperty('type') && add.type === 'TXT'));

                if (!txt || !txt.rdata) {
                    log(chalk.redBright(`************* No TXT record found for engine ${device.modelName}. Not adding it to the list: it must be rediscovered with a valid TXT object`))
                    return
                } else {
                    const txtRecord = txt.rdata
                    log(chalk.bgBlackBright(`TXT record found for engine ${device.modelName}: ${deepPrint(txtRecord, 2)}`))
                    // log(chalk.bgMagenta(`Adding engine ${device.familyName} to the list of engines`))
                    log(chalk.bgBlackBright(`Adding engine: ${deepPrint(device, 1)}`))
                    engines.push({address: device.address, familyName: device.familyName})
                    const appnet = txtRecord.appnet
                    // Emit an event for the network
                    log(chalk.bgBlackBright(`Emitting: new_engine_on_network_${appnet}`))
                    engineMonitor.emit(`new_engine_on_network_${appnet}`, device)
                }



                // Find all interfaces of the local engine that have a netmask that contains the ip address of the remote engine
                // This can be more than one interface: 
                //    for example when the local engine is connected to a wlan that is bridged to the eth0 LAN
                //    in that case engine has two IP addresses on the same LAN
                // deepPrint(getLocalEngine().interfaces, 2)
                // const ifaces = Object.keys(getLocalEngine().interfaces).filter((iface) => {
                //     const netmask = getLocalEngine().interfaces[iface].netmask
                //     const ip4 = getLocalEngine().interfaces[iface].ip4
                //     // const cidr = getLocalEngine().interfaces[iface].cidr
                //     // const onNet = inSubNet(device.address, netmask)
                //     // log(`According to onNet, on interface ${iface} , the address ${device.address} is ${onNet ? 'on' : 'not on'} the network ${cidr}`)
                //     // const netmaskNumber = IPnumber(netmask)
                //     // // Mask the device address
                //     // const deviceAddressNumber = IPnumber(device.address)
                //     // const netNumber = deviceAddressNumber & netmaskNumber
                //     // // Mask the CIDR address
                //     // const cidrNumber = IPnumber(cidr)
                //     // const netNumber2 = cidrNumber & netmaskNumber
                //     // // Compare
                //     // const onNet2 = (netNumber === netNumber2)
                //     // log(`According to onNet2, on interface ${iface} , the address ${device.address} is ${onNet2 ? 'on' : 'not on'} the network ${cidr}`)
                //     const onNet = sameNet(device.address, ip4, netmask)
                //     // if (onNet) {
                //     //     log(`On interface ${iface}, remote address ${device.address} is on the same network as the local engine ${ip4}`)
                //     // }
                //     log(`Remote address ${device.address} is ${onNet ? 'on' : 'not on'} the same network as the local engine ${ip4}`)
                //     return onNet
                //     // const block = new Netmask(getLocalEngine().interfaces[iface].netmask)
                //     // return block.contains(device.address)
                // })

                // // Now find all networks that have connections over this interface
                // ifaces.forEach((iface) => {
                //     const nets = filterNetworksByInterface(iface)
                //     log(`Interface ${iface} has the following appnets: ${nets.map((net) => net.name)}`)
                //     nets.forEach((network) => {
                //         log(chalk.bgMagenta(`Emitting: new_engine_on_network_${network.name}_via_interface_${iface}`))
                //         engineMonitor.emit(`new_engine_on_network_${network.name}_via_interface_${iface}`, device)
                //     })
                // })                
            }
        })
        // Also catch the case where the device is no longer in the list
        // and remove it from the engines array
        // engines.forEach((engine) => {
        //     const found = device_list.find((device) => device.address === engine.address)
        //     if (!found) {
        //         engines.splice(engines.indexOf(engine), 1)
        //         log(`Engine ${engine.familyName} no longer found`)
        //         printDeviceList(engines)
        //     }
        // })
        }).catch((error) => {
        log(`***node-dns-sd*** Error discovering engines`)    
        console.error(error);
        });
}   

const discoverEngines = () => {

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
        }).then((deviceList) =>{
        // console.log("***node-dns-sd*** "+deepPrint(device_list, 1));
        console.log(chalk.bgBlackBright(`Engines found: ${deviceList.map((device) => device.modelName+" @ "+device.address)}`))
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

                    // Access control
                    const restrictedInterfaces = config.settings.interfaces ? config.settings.interfaces : []
                    const interfacesToRemoteEngine = getInterfacesToRemoteEngine(getLocalEngine(), device.address)
                    // Check if there is an overlap between the restricted interfaces and the interfaces to the remote engine
                    const networkInterfaces = interfacesToRemoteEngine.filter((iface) => restrictedInterfaces.includes(iface))
                    const accessGranted = networkInterfaces.length > 0

                    // If access is granted, connect the engine
                    if (network && accessGranted) {
                        connectEngine(network, device.address)
                    }
                }  
        })
        }).catch((error) => {
            log(`***node-dns-sd*** Error discovering engines`)    
            console.error(error);
        });
}   

const removeEngine = (deviceFamilyname) => {
    const device = engines.find((engine) => engine.familyName === deviceFamilyname)
    engines.splice(engines.indexOf(device), 1)
    log(`Engine ${device.familyName} no longer found`)
    logDeviceList(engines)
}

const logDeviceList = (deviceList) => {
    deviceList.forEach((device) => {
        log(printDevice(device))
    })
}

const printDevice = (device) => {
    // console.log(`${device.familyName} ${device.address}`)
    //console.log(chalk.bgBlackBright(`${device.modelName} @ ${device.address}`))
    return `${device.modelName} @ ${device.address}`
}


export const enableMulticastDNSEngineMonitor = () => {
    const restrictedInterfaces = config.settings.interfaces ? config.settings.interfaces : []
    const appnets = config.settings.appnets
    appnets.forEach((appnet) => {
        startAdvertising(appnet.name, restrictedInterfaces)
    })
    // Call discoverEngines every 10 seconds
    setInterval(discoverEngines, 60000)
    // Call it for the first time
    discoverEngines()
}



export const startAdvertising = (networkName: string, restrictedInterfaces: string[]) => {
    const engine = getLocalEngine()
    const engineName = engine.hostName
    const engineVersion = engine.version
    const responder = ciao.getResponder()
    let service

    // Advertise the local engine on the network using mdns using the following service name: engineName._engine._tcp
    if (restrictedInterfaces.length === 0) {
        log(`Advertising on all interfaces  `)
        service = responder.createService({
            name: engineName,
            type: 'engine',
            port: 1234, // optional, can also be set via updatePort() before advertising
            txt: {
                    name: engineName,
                    version: engineVersion,
                    appnet: networkName,
                }
            })
    } else {
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

        // Access control
        const restrictedInterfaces = config.settings.interfaces ? config.settings.interfaces : []
        const interfacesToRemoteEngine = getInterfacesToRemoteEngine(getLocalEngine(), device.address)
        // Check if there is an overlap between the restricted interfaces and the interfaces to the remote engine
        const networkInterfaces = interfacesToRemoteEngine.filter((iface) => restrictedInterfaces.includes(iface))
        const accessGranted = networkInterfaces.length > 0

        // If access is granted, connect the engine
        if (network && accessGranted) {
            connectEngine(network, device.address)
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

