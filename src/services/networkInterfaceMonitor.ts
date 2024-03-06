import net_listner from 'network-interfaces-listener'
import os from 'os'
import { Doc, Array, Map } from 'yjs'
import { WebsocketProvider } from '../yjs/y-websocket.js'
import { enableRandomArrayPopulation } from '../services/randomDataChangeServices.js'
import { enableYjsWebSocketService } from '../services/yjsWebSocketService.js'
import { addNetwork, removeNetwork, getNetwork, getEngine, get$Engine, getNetworks} from '../data/store.js'
import { Network, Engine, Disk, NetworkData} from '../data/dataTypes.js'
import { proxy, subscribe, ref } from 'valtio'
import { bind } from 'valtio-yjs'

import { deepPrint, log } from '../utils/utils.js'
import { get } from 'http'

export const enableNetworkInterfaceMonitor = () => {
    // Get a list of all non-virtual interface names
    const nonVirtualInterfaces = Object.keys(os.networkInterfaces()).filter(name =>
        !name.startsWith('v') &&
        !name.startsWith('docker') &&
        !name.startsWith('br')
    )
    console.log(`Non-virtual interfaces: ${nonVirtualInterfaces}`)

    // Monitor the non-virtual interfaces for changes
    function onNetworkInterfaceChange(data) {
        console.log(`New data for interface ${Object.keys(data)}: ${JSON.stringify(data)}`)
        const iface = Object.keys(data)[0]
        // Find the IP4 address of the interface
        const ip4 = data[iface].find((address) => address.family === 'IPv4')
        console.log(`IPv4 address of ${iface}: ${ip4.address}`)
        // If the interface has an IP4 address, call the initialiseYjs function
        if (ip4) {
            console.log(`Interface ${iface} is up with IP4 address ${ip4.address} on network ${ip4.netmask}`)
            initialiseNetwork(iface, ip4.address, ip4.netmask)
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

    }
    // Call net_listner.addNetInterfaceListener for each non-virtual interface and add the listener
    nonVirtualInterfaces.forEach((interfaceName) => {
        net_listner.addNetInterfaceListener(interfaceName, onNetworkInterfaceChange)
    })

}

export let networkDoc

const initialiseNetwork = (iface, ip4, net) => {
    log(`Initialising a new network for interface ${iface} with IP4 address ${ip4} and netmask ${net}`)
    networkDoc = new Doc()

    // Create the YMap for the network data
    const yNetworkData = networkDoc.getMap('data')

    // create a valtio state for the network data
    // const networkData:NetworkData = proxy<NetworkData>({
    //     engines: [getEngine()],
    // });


    // Clone the result of getEngine() into a new object. Do NOT use JSON.parse(JSON.stringify(getEngine())) 
    const engine = { ...getEngine() }
    // Remove all networkInterfaces from the cloned engine object except the one that corresponds with the network we are currently adding
    // We do not want other engines to see what networks this engine is connected to
    engine.networkInterfaces = engine.networkInterfaces.filter(networkInterface => networkInterface.iface === iface)
    const networkData:NetworkData = proxy<NetworkData>({
        engines: [getEngine()]
    })

    // bind them
    const unbind = bind(networkData, yNetworkData);
    log(`Interface ${iface}: Created a Valtio-yjs proxy for networkData`)

    // Enable the Yjs WebSocket service for this network
    enableYjsWebSocketService(ip4, '1234')
    const wsProvider = new WebsocketProvider(`ws://${ip4}:1234`, 'appdocker', networkDoc)
    wsProvider.on('status', (event: { status: any; }) => {
        console.log(event.status) // logs "connected" or "disconnected"
    })
    log(`Interface ${iface}: Created an Yjs websocket service on adddress ws://${ip4}:1234 with room name appdocker`)

    // Enable random array population for the apps array
    // enableRandomArrayPopulation(apps)

    const network: Network = {
        id: networkDoc.guid,
        doc: networkDoc,
        wsProvider: wsProvider,
        data: networkData,
        yData: yNetworkData,
        unbind: unbind
    }
    addNetwork(network)
    log(`Interface ${iface}: Network initialised with ID ${network.id} and added to store`)

    // Create a NetworkInterface
    const networkInterface = {
        network: network.id,
        iface: iface,
        ip4: ip4,
        netmask: net
    }
    // And add it to the local engine
    get$Engine().networkInterfaces.push(networkInterface)
    log(`Interface ${iface}: Network interface added to local engine`)

    // Monitor networkData for changes using a Valtio subscription
    subscribe(networkData.engines, (value) => {
        console.log(`Interface ${iface}: Engines was modified. Engines is now: ${deepPrint(value)}`)
    })
    log('Interface ${iface}: Subscribed to networkData.engines')
}
