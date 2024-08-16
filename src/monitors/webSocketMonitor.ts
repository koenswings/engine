import { yjsWebsocketServer } from '../y-websocket/yjsWebSocketServer.js'
import { log } from '../utils/utils.js'
import { IPAddress, PortNumber } from '../data/CommonTypes.js'
import { Server } from 'http'


export const enableWebSocketMonitor = (host:IPAddress, port:PortNumber):Server => {
    // Monitor the specified host and port for web socket conenctions from clients
    // const host = 'localhost'
    // const port = '1234'
    const wsServer = yjsWebsocketServer(host, port)
    log(`Serving web socket connections on ws://${host}:${port}`)
    return wsServer
}

// When receiving an exit signal, close the websocket server
export const disableWebSocketMonitor = (wsServer:Server):void => {
    wsServer.close()
    log('Closing the web socket server')
}