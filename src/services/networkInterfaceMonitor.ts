import net_listner from 'network-interfaces-listener'
import os from 'os'

import { enableRandomArrayPopulation } from '../services/randomDataChangeServices.js'
import { addNetwork, removeNetwork, getEngine, getNetwork} from '../data/store.js'
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
        if (iface == Object.keys(data)[0]) {

            // If the localEngine already has a network interface for this interface and networkName, process the new data
            const networkInterface = getEngine().networkInterfaces.find((netiface) => netiface.iface === iface && netiface.network === networkName)
            if (networkInterface) {

                // Find the IP4 address of the interface
                const ip4 = data[iface].find((address) => address.family === 'IPv4').address
                const connected:Boolean = ip4 ? true : false

                if (connected) {
                    // Update the network interface with the new data
                    const netmask = data[iface].find((address) => address.family === 'IPv4').netmask
                    log(`Updating network interface ${networkInterface.iface} with IP4 address ${ip4} and netmask ${netmask}`)
                    networkInterface.ip4 = ip4
                    networkInterface.netmask = netmask
                    return 
                } 

                if (!connected) {
                    // This interface has lost its connection to the network
                    // Remove the network interface from the localEngine
                    log(`Removing network interface ${networkInterface.iface} from localEngine`)
                    getEngine().networkInterfaces = getEngine().networkInterfaces.filter((netiface) => netiface.iface !== iface && netiface.network !== networkName)

                    // If the localEngine no longer has network interfaces connected to the Network, remove the network 
                    if (getEngine().networkInterfaces.filter((netiface) => netiface.network === networkName).length === 0) {
                        log(`Removing network ${networkName} from localEngine`)
                        removeNetwork(getNetwork(networkName))
                    }

                    // console.log(`Interface ${iface} is disconnected and has no IP4 address`)
                    // // Find the network wi
                    // const network = getNetwork(networkInterface.network)
                    // removeNetwork(network)
                    // console.log(`Network ${network.name} removed from store`)
                    }
            } else {
                // If the localEngine does not have a network interface for this interface and networkName, create one
                console.log(`Creating new network interface for interface ${iface} and network ${networkName}`)
                addNetwork(networkName, iface, data[iface].find((address) => address.family === 'IPv4').address, data[iface].find((address) => address.family === 'IPv4').netmask)
            }

        } else {
            // We have an issue - We are getting a callback for an interface for which we didn't register a listener
            console.error(`Interface ${iface} is not the interface we are monitoring`)
        }   
    }
    // Call the listener once with the current state of the interface
    // Read the curent state of the interface from a call to os.networkInterfaces()
    const ifaceData = os.networkInterfaces()[iface]
    if (ifaceData) {
        // Create an object with the interface name as the key and the interface data as the value
        // Then call the listener with that object
        const data = {}
        data[iface] = ifaceData
        onNetworkChange(data)
    } else {
        console.log(`No initial data for interface ${iface}`)
    }
    // Add the listener
    net_listner.addNetInterfaceListener(iface, onNetworkChange)
}

