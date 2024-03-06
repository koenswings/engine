import net_listner from 'network-interfaces-listener'
import os from 'os'
import { Doc, Array, Map } from 'yjs'
import { WebsocketProvider } from '../yjs/y-websocket.js'
import { enableRandomArrayPopulation } from '../services/randomDataChangeServices.js'
import { enableYjsWebSocketService } from '../services/yjsWebSocketService.js'
import { addNetwork, removeNetwork, getNetwork, getEngine} from '../data/store.js'
import { Network, Engine, Disk, NetworkData} from '../data/dataTypes.js'
import { proxy, subscribe } from 'valtio'
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


const initialiseNetwork = (iface, ip4, net) => {
    log(`Initialising a new network for interface ${iface} with IP4 address ${ip4} and netmask ${net}`)
    const networkDoc = new Doc()

    // Create the YMap for the network data
    const yNetworkData = networkDoc.getMap('data')

    // create a valtio state for the network data
    const networkData:NetworkData = proxy<NetworkData>({
        engines: [getEngine()],
    });

    // bind them
    const unbind = bind(networkData, yNetworkData);



    // const apps: Array<string> = networkDoc.getArray('apps')
    // apps.observe(event => {
    //     console.log(`apps was modified. Apps is now: ${JSON.stringify(apps.toArray())}`)
    // })
    // log('Initialising and observing apps')

    // Same for Engines and Disks
    // const engines = networkDoc.getArray('engines')
    // engines.observe(event => {
    //     console.log(`engines was modified. Engines is now: ${JSON.stringify(engines.toArray())}`)
    // })
    // log('Initialising and observing engines')

    // Add an Engine object to Engines representing the local engine 
    // Be careful: Map only allows values of type object|boolean|string|number|Uint8Array|Y.AbstractType
    //const engine:Map<string | Status | Version | DockerEvents | DockerLogs | DockerMetrics> = new Map()
    //const engine:Map<any> = new Map()
    // const engine = new Map()
    // engine.set('hostName', os.hostname())
    // engine.set('version', { major: 1, minor: 0 })
    // engine.set('hostOS', os.type())
    // engine.set('status', 'Running')
    // engine.set('dockerMetrics', {
    //     memory: os.totalmem().toString(),
    //     cpu: os.loadavg().toString(),
    //     network: "",
    //     disk: ""
    // })
    // engine.set('dockerLogs', { logs: [] })
    // engine.set('dockerEvents', { events: [] })
    // engine.set('lastBooted', new Date().getTime())
    // engines.insert(0, [getEngine()])
    // log('Initialising and adding local engine to engines')

    // engines.insert(0, [{
    //     hostName: os.hostname(),
    //     version: {
    //         major: 1,
    //         minor: 0
    //     },
    //     hostOS: os.type(),
    //     status: 'Running',
    //     dockerMetrics: {
    //         memory: os.totalmem().toString(),
    //         cpu: os.loadavg().toString(),
    //         network: "",
    //         disk: ""
    //     },
    //     dockerLogs: { logs: [] },
    //     dockerEvents: { events: [] },
    //     lastBooted: new Date()
    // }])
    // log('Initialising and adding local engine to engines')


    // const disks: Array<Disk> = networkDoc.getArray('disks')
    // disks.observe(event => {
    //     console.log(`disks was modified. Disks is now: ${JSON.stringify(disks.toArray())}`)
    // })
    // log('Initialising and observing disks')

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
        // iface: iface,
        // ip4: ip4,
        // netmask: net,
        doc: networkDoc,
        wsProvider: wsProvider,
        data: networkData
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
    getEngine().networkInterfaces.push(networkInterface)
    log(`Interface ${iface}: Network interface added to local engine`)


    // Monitor networkData for changes using a Valtio subscription
    subscribe(networkData.engines, (value) => {
        console.log(`Interface ${iface}: Engines was modified. Engines is now: ${deepPrint(value)}`)
    })
    log('Interface ${iface}: Subscribed to networkData.engines')
}
