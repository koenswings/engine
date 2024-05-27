import mDnsSd from 'node-dns-sd'
import events from 'events'   // See https://nodejs.org/api/events.html#events 
import { IPnumber, log } from '../utils/utils.js';
import { chalk } from 'zx';
import { filterNetworksByInterface, getLocalEngine } from '../data/Store.js';
import { inSubNet } from '../utils/utils.js'
// import { Netmask }  from 'netmask'

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
        console.log(chalk.bgBlackBright(`Engines found: ${deviceList.map((device) => device.modelName)}`))
        deviceList.forEach((device) => {
            if (!engines.find((engine) => engine.address === device.address)) {
                // log(chalk.bgMagenta(`Adding engine ${device.familyName} to the list of engines`))
                engines.push({address: device.address, familyName: device.familyName})
                // console.log(chalk.bgBlackBright(`Adding engine: ${JSON.stringify(device, null, '  ')}`))


                // Find all interfaces of the local engine that have a netmask that contains the ip address of the remote engine
                // This can be more than one interface: 
                //    for example when the local engine is connected to a wlan that is bridged to the eth0 LAN
                //    in that case engine has two IP addresses on the same LAN

                const ifaces = Object.keys(getLocalEngine().interfaces).filter((iface) => {
                    const netmask = getLocalEngine().interfaces[iface].netmask
                    const cidr = getLocalEngine().interfaces[iface].cidr
                    const onNet = inSubNet(device.address, netmask)
                    log(`According to onNet, on interface ${iface} , the address ${device.address} is ${onNet ? 'on' : 'not on'} the network ${cidr}`)
                    const netmaskNumber = IPnumber(netmask)
                    // Mask the device address
                    const deviceAddressNumber = IPnumber(device.address)
                    const netNumber = deviceAddressNumber & netmaskNumber
                    // Mask the CIDR address
                    const cidrNumber = IPnumber(cidr)
                    const netNumber2 = cidrNumber & netmaskNumber
                    // Compare
                    const onNet2 = (netNumber === netNumber2)
                    log(`According to onNet2, on interface ${iface} , the address ${device.address} is ${onNet2 ? 'on' : 'not on'} the network ${cidr}`)
                    return onNet2
                    // const block = new Netmask(getLocalEngine().interfaces[iface].netmask)
                    // return block.contains(device.address)
                })
                log(chalk.bgMagenta(`Adding engine ${printDevice(device)}, found on these interfaces: ${ifaces}`))

                // Now find all networks that have connections over this interface
                let networks = []
                ifaces.forEach((iface) => {
                    const nets = filterNetworksByInterface(iface)
                    log(`Networks ${nets.map((net) => net.name)} on interface ${iface}`)
                    networks = networks.concat(nets)
                })
                log(chalk.bgMagenta(`Engine ${device.modelName} found on networks ${networks.map((network) => network.name)}`))    

                networks.forEach((network) => {
                    log(chalk.bgMagenta(`Emitting: new_engine_on_${network.network}_on_${network.iface}`))
                    engineMonitor.emit(`new_engine_on_${network.network}_on_${network.iface}`, device)
                })
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

const removeEngine = (deviceFamilyname) => {
    const device = engines.find((engine) => engine.familyName === deviceFamilyname)
    engines.splice(engines.indexOf(device), 1)
    log(`Engine ${device.familyName} no longer found`)
    printDeviceList(engines)
}

const printDeviceList = (deviceList) => {
    deviceList.forEach((device) => {
        printDevice(device)
    })
}

const printDevice = (device) => {
    // console.log(`${device.familyName} ${device.address}`)
    console.log(chalk.bgBlackBright(`${device.modelName} @ ${device.address}`))
}


export const enableMulticastDNSEngineMonitor = () => {
    // Call discoverEngines every 10 seconds
    setInterval(discoverEngines, 60000)
    // Call it for the first time
    discoverEngines()
}



