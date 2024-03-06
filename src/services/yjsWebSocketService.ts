import { yjsWebsocketServer } from '../yjs/yjsWebSocketServer.js'
import { log } from '../utils/utils.js'


export const enableYjsWebSocketService = (port, host) => {
    // create a websocket server
    // const host = 'localhost'
    //const port = '1234'
    const wsServer = yjsWebsocketServer(port, host)
    log(`Serving apps on ws://${host}:${port}`)
}

