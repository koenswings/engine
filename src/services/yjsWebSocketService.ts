import { yjsWebsocketServer } from '../yjs/yjsWebSocketServer.js'
import { log } from '../utils/utils.js'


export const enableYjsWebSocketService = (host, port) => {
    // create a websocket server
    // const host = 'localhost'
    //const port = '1234'
    const wsServer = yjsWebsocketServer(host, port)
    log(`Serving web socket connections on ws://${host}:${port}`)
}

