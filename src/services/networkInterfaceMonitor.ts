import net_listner from 'network-interfaces-listener'
import os from 'os'

import { enableRandomArrayPopulation } from '../services/randomDataChangeServices.js'
import { addNetwork, removeNetwork, getNetwork, getEngine, getNetworks} from '../data/store.js'
import { Network, Engine, Disk, NetworkData} from '../data/dataTypes.js'


import { deepPrint, log } from '../utils/utils.js'
import { get } from 'http'

// export const enableNetworkInterfaceMonitor = () => {
//     // Get a list of all non-virtual interface names
//     const nonVirtualInterfaces = Object.keys(os.networkInterfaces()).filter(name =>
//         !name.startsWith('v') &&
//         !name.startsWith('docker') &&
//         !name.startsWith('br')
//     )
//     console.log(`Non-virtual interfaces: ${nonVirtualInterfaces}`)

//     // Monitor the non-virtual interfaces for changes
//     function onNetworkInterfaceChange(data) {
//         console.log(`New data for interface ${Object.keys(data)}: ${JSON.stringify(data)}`)
//         const iface = Object.keys(data)[0]
//         // Find the IP4 address of the interface
//         const ip4 = data[iface].find((address) => address.family === 'IPv4')
//         console.log(`IPv4 address of ${iface}: ${ip4.address}`)
//         // If the interface has an IP4 address, call the initialiseYjs function
//         if (ip4) {
//             console.log(`Interface ${iface} is up with IP4 address ${ip4.address} on network ${ip4.netmask}`)
//             addNetwork(iface, ip4.address, ip4.netmask)
//         } else {
//             console.log(`Interface ${iface} is disconnected and has no IP4 address`)
//             const network = getNetwork(iface)
//             if (network) {
//                 removeNetwork(network)
//                 console.log(`Network with ID ${network.id} removed from store`)
//             } else {
//                 console.log(`No network found for interface ${iface}`)
//             }
//         }
//     }
//     // Call net_listner.addNetInterfaceListener for each non-virtual interface and add the listener
//     nonVirtualInterfaces.forEach((interfaceName) => {
//         net_listner.addNetInterfaceListener(interfaceName, onNetworkInterfaceChange)
//     })

// }

export const monitorInterface = (iface:string, networkName:string) => {
    // Monitor the interface for changes
    // Create a dedicated handler for the specified interface and vlan
    const onNetworkChange = (data) => {
        console.log(`New data for network ${networkName} on interface ${iface}: ${JSON.stringify(data)}`)
        console.log(`New data for interface ${Object.keys(data)}: ${JSON.stringify(data)}`)
        if (iface == Object.keys(data)[0]) {
            // Find the IP4 address of the interface
            const ip4 = data[iface].find((address) => address.family === 'IPv4')
            console.log(`IPv4 address of ${iface}: ${ip4.address}`)
            // If the interface has an IP4 address, call the addNetwork
            if (ip4) {
                console.log(`Interface ${iface} is up with IP4 address ${ip4.address} on network ${ip4.netmask}`)
                addNetwork(networkName, iface, ip4.address, ip4.netmask)
            } else {
                console.log(`Interface ${iface} is disconnected and has no IP4 address`)
                const network = getNetwork(iface)
                if (network) {
                    removeNetwork(network)
                    console.log(`Network with ID ${network.id} removed from store`)
                } else {
                    console.log(`No network found for interface ${iface}`)
                }
            }
        } else {
            // We have an issue - We are getting a callback for an interface for which we didn't register a listener
            console.error(`Interface ${iface} is not the interface we are monitoring`)
        }   
    }
    // Call net_listner.addNetInterfaceListener for the network and add the listener
    net_listner.addNetInterfaceListener(iface, onNetworkChange)
}

