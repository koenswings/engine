#!/usr/bin/env node


// const WebSocket = require('ws')
// import WebSocket from 'ws';
import { WebSocketServer } from 'ws'
// const setupWSConnection = require('./utils.js').setupWSConnection
import { setupWSConnection } from './utils.js'

// const http = require('http')
import http from 'http'

export const yjsWebsocketServer = (port) => {
  const wss = new WebSocketServer({ noServer: true })

  //const host2 = host || process.env.HOST || 'localhost' 
  const port2 = port || process.env.PORT || 1234

  const server = http.createServer((request, response) => {
    response.writeHead(200, { 'Content-Type': 'text/plain' })
    response.end('okay')
  })

  wss.on('connection', setupWSConnection)

  server.on('upgrade', (request, socket, head) => {
    // You may check auth of request here..
    // See https://github.com/websockets/ws#client-authentication
    /**
     * @param {any} ws
     */
    const handleAuth = ws => {
      wss.emit('connection', ws, request)
    }
    wss.handleUpgrade(request, socket, head, handleAuth)
  })

  server.listen(port2, () => {
    console.log(`running on port ${port2}`)
  })
}