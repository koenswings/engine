import { subscribe } from 'valtio'
import { log, deepPrint } from '../utils/utils.js'
import { Store, getEngine, getInstance, store } from '../data/Store.js'
import { Engine } from '../data/Engine.js'
import { Network } from '../data/Network.js'
import { AppnetName, EngineID, InstanceID, PortNumber } from '../data/CommonTypes.js'
import { handleCommand } from '../utils/commandHandler.js'
import { engineCommands } from '../utils/engineCommands.js'
import { fs } from 'zx'
import http from 'http'
import { getEngineOfInstance } from '../data/Instance.js'



export const enableInstanceSetMonitor = (store:Store, network:Network):void => {

    // Generate HTML for the current instances
    const instanceIds = Object.keys(network.appnet.instances) as InstanceID[]
    generateHTML(instanceIds, network.appnet.name)

    // Monitor the engineSet for changes
    subscribe(network.appnet.instances, (value) => {
        log(`INSTANCESET MONITOR: The instanceSet of network ${network.appnet.name} was modified as follows: ${deepPrint(value)}`)
        const instanceIds = Object.keys(network.appnet.instances) as InstanceID[]
        generateHTML(instanceIds, network.appnet.name)
    })
    log(`Added INSTANCESET MONITOR to network ${network.appnet.name}`)
}

export const generateHTML = (instanceIds:InstanceID[], appnetName:AppnetName):void => {
    // Generate the HTML for the instances
    const html = `<!DOCTYPE html>
    <html>
        <head>
            <title>Instances</title>
            <meta http-equiv="refresh" content="5"> 
        </head>
        <body>
            <h1>Apps</h1>
            <ul>
                ${instanceIds.map((instanceId) => {
                    // Find the engine hostname for the instance and generate a url using the hostname and the port number of the instance
                    const instance = getInstance(store, instanceId)
                    const diskId = instance.diskId
                    const engine = getEngineOfInstance(store, instance)
                    if (!engine) {
                        return `<li>Instance ${instanceId} not found</li>`
                    }
                    const hostname = engine.hostname
                    const port = instance.port
                    return `<li><a href="http://${hostname}.local:${port}">${instanceId} (${instance.name} on disk ${diskId})</a></li>`
                }).join('\n')}
            </ul>
        </body>
    </html>`
    log(`Generated HTML: ${html}`)
    // Write the HTML to a file called <appnetName>.html
    fs.writeFileSync(`${appnetName}.html`, html)
}   

export const enableIndexServer = (store:Store, appnetName:AppnetName, port?:PortNumber):void => {
    // Start an HTTP server that serves the index.html file of the specified appnet
    let portNumber:number
    if (port) {
        portNumber = parseInt(port.toString())
    } else {
        portNumber = 80
    }
    // If the file `${appnetName}.html` does not exist, generate it
    if (!fs.existsSync(`${appnetName}.html`)) generateHTML([], appnetName)
    const server = http.createServer((req, res) => {
        res.writeHead(200, {'Content-Type': 'text/html'})
        fs.readFile(`${appnetName}.html`, (err, data) => {
            if (err) {
                res.writeHead(404)
                res.write('File not found')
            } else {
                res.write(data)
            }
            res.end()
        })
    })
    server.listen(portNumber)
    log(`Started HTTP server for network ${appnetName} on port ${portNumber}`)
}

