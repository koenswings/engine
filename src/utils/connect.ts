import { Doc } from 'yjs'
import { WebsocketProvider } from '../y-websocket/y-websocket.js'
import { proxy } from 'valtio'
import { App, Disk, Engine, NetworkData } from '../data/dataTypes.js'
import { bind } from '../valtio-yjs/index.js'
import {pEvent} from 'p-event'
import { ConnectionResult } from '../data/dataTypes.js'


export const connect = (network:string, ip4:string, port:number) => {
    console.log(`Connecting to ${network} using the engine at ${ip4}:${port}`)
    const networkDoc = new Doc()
    let networkData: NetworkData
    const wsProvider = new WebsocketProvider(`ws://${ip4}:1234`, network, networkDoc)
    wsProvider.on('status', (event: ConnectionResult) => {
        console.log(event.status) // logs "connected" or "disconnected"
        let unbind: () => void
        if (event.status === 'connected') {
            console.log(`Connected to network ${network}`)
            const yNetworkData = networkDoc.getMap('data')
            //const engines = yNetworkData.get('engines') as Engine[]
            //console.log(deepPrint(engines, 1))
            networkData = proxy<NetworkData>({engines:[] as Engine[]});
            // Bind the Valtio proxy to the Yjs object
            unbind = bind(networkData  as Record<string, any>, yNetworkData);
            event.networkData = networkData
        } 
        if (event.status === 'disconnected') {
            console.log('Disconnected from network')
            unbind()
        }
    })
    return pEvent(wsProvider, 'status', (event: ConnectionResult) => event.status === 'connected')
}