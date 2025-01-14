import net_listner from 'network-interfaces-listener'
import os from 'os'
import { addNetwork, closeRunningServer, createRunningServer, findNetworkByName, getLocalEngine, getListenerByIface, addListener, getListeners, Store } from '../data/Store.js'
import { createNetwork, connectEngine } from '../data/Network.js'
import { deepPrint, log } from '../utils/utils.js'
import { existsSync, write } from 'fs'
import { $, chalk } from 'zx'
import { exit } from 'process'
import { InterfaceName } from '../data/CommonTypes.js'
import { LIBUSB_CAP_HAS_HID_ACCESS } from 'usb/dist/usb/bindings.js'
import { enableWebSocketMonitor } from './webSocketMonitor.js'
import { addConnectedInterface, isConnected, removeConnectedInterfaceByName } from '../data/Engine.js'


export const enableInterfaceMonitor = async (store:Store, ifaceNames:InterfaceName[]):Promise<void> => {
    log(`Enabling the interface monitor for interfaces ${ifaceNames} using store: ${deepPrint(store, 1)}`)
    const monitorAll = ifaceNames.length === 0
  
    if (monitorAll) {
        log(`Monitoring the connection status of all interfaces`)
    } else {
        log(`Monitoring the connection status of interfaces ${ifaceNames}`)
    }

    // Monitor the interface for changes
    const onNetworkChange = (data) => {

        // TODO - We should filter out the interfaces that are not in the list of monitored interfaces
        // const changedInterfaces = Object.keys(data).filter((ifaceName) => {
        //     return monitorAll || ifaceNames.includes(ifaceName as InterfaceName)
        // })
        const changedInterfaces = Object.keys(data)
        log(`New data for interfaces ${changedInterfaces}: ${JSON.stringify(data)}`)

        // TODO - We should tolerate data with more than one key
        // Replace Object.keys(data)[0] == 'xxx' with data[xxx]
        // if (data.message && data.message === 'Network interface is not active') {
        //     // disconnectNetwork(network, ifaceName)
        //     removeInterfaceByName(getLocalEngine(), ifaceName)
        //     return
        // }

        for (const ifaceName of changedInterfaces) {

            processInterface(store, data, ifaceName as InterfaceName)
        }

        if (data.message) {
            
            // This is an unknown message - do nothing
            console.error(`Unknown message: ${data.message}`)
            return

        } 
    }   

    // Call the listener once with the current state of the interface
    // Read the curent state of the interface from a call to os.networkInterfaces()
    onNetworkChange(os.networkInterfaces())

    // Register the listener for each interface
    // Store the listener so that we can remove it later
    // We need to remove the listener when we unmonitor the network
    if (monitorAll) {
        net_listner.addNetInterfaceListener("ALL", onNetworkChange)
        addListener(store, "ALL" as InterfaceName, onNetworkChange)
    } else {
        for (const ifaceName of ifaceNames) {
            net_listner.addNetInterfaceListener(ifaceName, onNetworkChange)
            addListener(store, ifaceName, onNetworkChange)
        }
    }
}

const processInterface = (store:Store, data:any, ifaceName:InterfaceName):void => {
    log (`Processing interface ${ifaceName}`)
    log(`Using store ${deepPrint(store, 1)}`)
    const localEngine = getLocalEngine(store)
    // Check if data[ifaceName] is an array
    if (!Array.isArray(data[ifaceName])) {
        log(`Data for interface ${ifaceName} is not an array`)
        return
    }
    const ip4Set = data[ifaceName].find((netObject) => {
        // Check if netObject is an object with property family that is 'IPv4'
        return netObject.family && netObject.family === 'IPv4'
    })

    //if (localEngine.connectedInterfaces && ip4Set) {
    if ((localEngine.connectedInterfaces !== undefined) && ip4Set) {
        const ip4 = ip4Set.address
        const netmask = ip4Set.netmask
        const cidr = ip4Set.cidr
        const nowConnected:Boolean = ip4 ? true : false
        const wasConnected:Boolean = isConnected(localEngine, ifaceName)

        if (wasConnected && nowConnected) {

                const iface = localEngine.connectedInterfaces[ifaceName]
                const oldIp4 = iface.ip4
                const oldnetmask = iface.netmask
                const oldcidr = iface.cidr
                if (oldIp4 !== ip4) {
                    log(`Changing the IP address on interface ${ifaceName} from ${oldIp4} to ${ip4}`)
                    // OLD - Do this when we want to create websocket servers for each restricted interface
                    // Close the existing server
                    // closeRunningServer(store, oldIp4)
                    // createRunningServer(store, ip4)
                    // Update the network interface with the new data
                    iface.ip4 = ip4
                }

                if (oldnetmask !== netmask) {
                    log(`Changing the netmask on interface ${ifaceName} from ${oldnetmask} to ${netmask}`)
                    iface.netmask = netmask
                }

                if (oldcidr !== cidr) {
                    log(`Changing the cidr on interface ${ifaceName} from ${oldcidr} to ${cidr}`)
                    iface.cidr = cidr
                }

                return 
            }

            if (wasConnected && !nowConnected) {
                
                //disconnectNetwork(network, ifaceName)
                removeConnectedInterfaceByName(getLocalEngine(store), ifaceName)
                return
            }

            if (!wasConnected && nowConnected) {

                addConnectedInterface(localEngine, ifaceName, ip4, netmask, cidr)
                log(`Interface ${ifaceName} on local engine has received an IP4 address ${ip4}`)
                // Start the websocket server on this interface
                // Do not enable the websocket monitor on the localhost as it is already enabled
                if (ip4 !== '127.0.0.1') {
                    // enableWebSocketMonitor(ip4, '1234') 
                    return
                }
            }

            if (!wasConnected && !nowConnected) {
                console.error(`Received new data for an unconnected ${ifaceName} without an IP4 address`)
                return

            }
        } else {
            log(`Interface ${ifaceName} on local engine has no connected interfaces or no IP4 address`)
        }
}

