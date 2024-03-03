import { yjsWebsocketServer } from '../yjs/yjsWebSocketServer.js'
import { log } from '../utils/utils.js'


export const enableYjsWebSocketService = () => {
    // create a websocket server
    // const host = 'localhost'
    const port = '1234'
    const wsServer = yjsWebsocketServer(port)
    log(`Serving apps on ws://xxx:${port}`)
}

