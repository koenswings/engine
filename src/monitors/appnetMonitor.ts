import net_listner from 'network-interfaces-listener'
import os from 'os'
import { addNetwork, findNetworkByName, getLocalEngine } from '../data/Store.js'
import { createNetwork, connectNetwork, disconnectNetwork, getListenerByIface, addListener, getListeners } from '../data/Network.js'
import { deepPrint, log } from '../utils/utils.js'
import { addInterface } from '../data/Engine.js'
import { enableEngineMonitor } from './remoteEngineMonitor.js'

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

export const enableAppnetMonitor = (networkName:string, ifaceName:string) => {

    log(`Monitoring interface ${ifaceName} for connections to engines on network ${networkName}`)

    const localEngine = getLocalEngine()

    // Create a network object if it doesn't exist
    let network = findNetworkByName(networkName)
    if (!network) {
        network = createNetwork(networkName)
        // And add it to the networks array
        addNetwork(network)
        // Add local engine
        network.data.push(localEngine)
    }
  

    // Monitor the interface for changes
    // Create a dedicated handler for the specified interface and vlan
    const onNetworkChange = (data) => {

        console.log(`New data for network ${networkName} on interface ${ifaceName} with keys ${Object.keys(data)}: ${JSON.stringify(data)}`)
        
        // TODO - We should tolerate data with more than one key
        // Replace Object.keys(data)[0] == 'xxx' with data[xxx]
        if (data.message && data.message === 'Network interface is not active') {
            disconnectNetwork(network, ifaceName)
            return
        }

        if (data[ifaceName]) {

            const ip4 = data[ifaceName].find((address) => address.family === 'IPv4').address
            const netmask = data[ifaceName].find((address) => address.family === 'IPv4').netmask
            const cidr = data[ifaceName].find((address) => address.family === 'IPv4').cidr
            const nowConnected:Boolean = ip4 ? true : false
            const wasConnected:Boolean =  localEngine.interfaces[ifaceName] && localEngine.interfaces[ifaceName].hasOwnProperty('ip4')

            if (wasConnected && nowConnected) {

                // Update the network interface with the new data
                log(`Updating interface ${ifaceName} with IP4 address ${ip4} and netmask ${netmask}`)
                const iface = localEngine.interfaces[ifaceName]
                iface.ip4 = ip4
                iface.netmask = netmask
                return 
            }

            if (wasConnected && !nowConnected) {
                
                disconnectNetwork(network, ifaceName)
                return
            }

            if (!wasConnected && nowConnected) {

                addInterface(localEngine, ifaceName, ip4, netmask, cidr)
                log(`Added or updated interface ${ifaceName} on local engine`)
                connectNetwork(network, ip4, ifaceName)
                // Now monitor this interface for additonal engines that are on the network
                enableEngineMonitor(ifaceName, network.name)
                return

            }

            if (!wasConnected && !nowConnected) {
                console.error(`Received new data for an unconnected ${ifaceName} without an IP4 address`)
                return

            }
        }

        if (data.message) {
            
            // This is an unknown message - do nothing
            console.error(`Unknown message: ${data.message}`)
            return

        } 

        // We are getting a callback for an interface for which we didn't register a listener
        console.error(`Unknown keys ${Object.keys(data)}: does not match the interface we are monitoring or 'message'`)

    }   

    // Call the listener once with the current state of the interface
    // Read the curent state of the interface from a call to os.networkInterfaces()
    const ifaceData = os.networkInterfaces()[ifaceName]
    if (ifaceData) {
        // Create an object with the interface name as the key and the interface data as the value
        // Then call the listener with that object
        const data = {}
        data[ifaceName] = ifaceData
        onNetworkChange(data)
    } else {
        console.log(`No initial data for interface ${ifaceName}`)
    }
    // Add the listener
    net_listner.addNetInterfaceListener(ifaceName, onNetworkChange)

    // We should store the listener so that we can remove it later
    // We need to remove the listener when we unmonitor the network
    // We can store the listener in the network object
    addListener(network, ifaceName, onNetworkChange)
    //network.listeners[iface] = onNetworkChange
    log(`Adding to Listeners: ${deepPrint(getListeners(network), 1)}`)

}

// export const OLDenableNetworkMonitor = (ifaceName:string, networkName:string) => {

//     // Create a network object if it doesn't exist
//     let network = findNetwork(networkName)
//     if (!network) {
//         network = addNetwork(networkName)
//     }

//     // Monitor the interface for changes
//     // Create a dedicated handler for the specified interface and vlan
//     const onNetworkChange = (data) => {

//         console.log(`New data for network ${networkName} on interface ${ifaceName} with keys ${Object.keys(data)}: ${JSON.stringify(data)}`)
//         const networkInterface = getNetworkInterface(ifaceName, networkName)
        

//         // TODO - We should tolerate data with more than one key
//         // Replace Object.keys(data)[0] == 'xxx' with data[xxx]
//         if (data.message && data.message === 'Network interface is not active') {
//             // This is a message that the network interface is not active
//             // If the local engine already has a connection to this network, remove it
//             if (networkInterface) {
//                 //disconnectNetwork(networkInterface)
//             }
//             return
//         }

//         if (data[ifaceName]) {

//             const ip4 = data[ifaceName].find((address) => address.family === 'IPv4').address
//             const netmask = data[ifaceName].find((address) => address.family === 'IPv4').netmask
//             const connected:Boolean = ip4 ? true : false

//             if (networkInterface && connected) {

//                 // Update the network interface with the new data
//                 log(`Updating network interface ${networkInterface.iface} with IP4 address ${ip4} and netmask ${netmask}`)
//                 networkInterface.ip4 = ip4
//                 networkInterface.netmask = netmask
//                 return 
//             }

//             if (networkInterface && !connected) {
                
//                 // This interface has lost its connection to the network
//                 // Remove the network interface from the localEngine
//                 //disconnectNetwork(networkInterface)
//                 return

//             }

//             if (!networkInterface && connected) {

//                 // Add the network interface to the localEngine
//                 log(`Adding network interface ${ifaceName} with IP4 address ${ip4} and netmask ${netmask} to network ${networkName}`)
//                 connectNetwork(networkName, ifaceName, ip4, netmask)
//                 return

//             }

//             if (!networkInterface && !connected) {

//                 // This interface is not connected to the network
//                 console.error(`Received new data for ${ifaceName} without an IP4 address`)
//                 return

//             }
//         }

//         if (data.message) {
            
//             // This is an unknown message - do nothing
//             console.error(`Unknown message: ${data.message}`)
//             return

//         } 

//         // We are getting a callback for an interface for which we didn't register a listener
//         console.error(`Unknown keys ${Object.keys(data)}: does not match the interface we are monitoring or 'message'`)

//     }   

//     // Call the listener once with the current state of the interface
//     // Read the curent state of the interface from a call to os.networkInterfaces()
//     const ifaceData = os.networkInterfaces()[ifaceName]
//     if (ifaceData) {
//         // Create an object with the interface name as the key and the interface data as the value
//         // Then call the listener with that object
//         const data = {}
//         data[ifaceName] = ifaceData
//         onNetworkChange(data)
//     } else {
//         console.log(`No initial data for interface ${ifaceName}`)
//     }
//     // Add the listener
//     net_listner.addNetInterfaceListener(ifaceName, onNetworkChange)

//     // We should store the listener so that we can remove it later
//     // We need to remove the listener when we unmonitor the network
//     // We can store the listener in the network object
//     addListener(networkName, ifaceName, onNetworkChange)
//     //network.listeners[iface] = onNetworkChange
//     log(`Adding to Listeners: ${deepPrint(getListeners(), 1)}`)

// }



export const disableAppnetMonitor = (networkName:string, ifaceName:string) => {
    log(`Stop monitoring interface ${ifaceName} for connections to engines on network ${networkName}`)
    const network = findNetworkByName(networkName)
    disconnectNetwork(network, ifaceName)


    // Remove the listener
    // If there is a key in the listeners object that matches the interface and network, remove the listener 
    log(`Removing listener for interface ${ifaceName} from network ${networkName} : ${deepPrint(getListeners(network), 1)}`)
    const listener = getListenerByIface(network, ifaceName)
    if (listener) {
        net_listner.removeNetInterfaceListener(listener)
    } else {
        console.error(`No listener found for interface ${ifaceName} on network ${networkName}`)
    }
}

// export const OLDdisableNetworkMonitor = (iface:string, networkName:string) => {
//     log(`Unmonitoring network ${networkName} via interface ${iface}`)
    
//     // Disconnect the engine from the specified network over the specified interface
//     const networkInterface = getNetworkInterface(iface, networkName)
//     if (networkInterface) {
//         //disconnectNetwork(networkInterface)
//     } else {
//         console.error(`No network interface found for interface ${iface} on network ${networkName}`)
//     }

//     // Remove the listener
//     // If there is a key in the listeners object that matches the interface and network, remove the listener 
//     log(`Removing listener for interface ${iface} from network ${networkName} : ${deepPrint(getListeners(), 1)}`)
//     const listener = getListener(iface, networkName)
//     if (listener) {
//         net_listner.removeNetInterfaceListener(listener)
//     } else {
//         console.error(`No listener found for interface ${iface} on network ${networkName}`)
//     }
// }


