import { subscribe } from 'valtio'
import { log, deepPrint } from '../utils/utils.js'
import { Store, getEngine } from '../data/Store.js'
import { Engine } from '../data/Engine.js'
import { Network } from '../data/Network.js'
import { AppnetName, EngineID, InstanceID } from '../data/CommonTypes.js'
import { handleCommand } from '../utils/commandHandler.js'
import { engineCommands } from '../utils/engineCommands.js'
import { fs } from 'zx'
import http from 'http'



export const enableInstanceSetMonitor = (store:Store, network:Network):void => {
    // Monitor the engineSet for changes
    subscribe(network.appnet.instances, (value) => {
        log(`INSTANCESET MONITOR: The instanceSet of network ${network.appnet.name} was modified as follows: ${deepPrint(value)}`)
        const instanceIds = Object.keys(network.appnet.instances) as InstanceID[]
        generateHTML(instanceIds, network.appnet.name)
    })
    log(`Added INSTANCESET MONITOR to network ${network.appnet.name}`)
}

const generateHTML = (instanceIds:InstanceID[], appnetName:AppnetName):void => {
    // Generate the HTML for the instances
    const html = `<!DOCTYPE html>
    <html>
        <head>
            <title>Instances</title>
        </head>
        <body>
            <h1>Instances</h1>
            <ul>
                ${instanceIds.map((instanceId) => {
                    return `<li>${instanceId}</li>`
                }).join('\n')}
            </ul>
        </body>
    </html>`
    log(`Generated HTML: ${html}`)
    // Write the HTML to a file called <appnetName>.html
    fs.writeFileSync(`${appnetName}.html`, html)
}   

export const enableIndexServer = (store:Store, appnetName:AppnetName):void => {
    // Start an HTTP server that serves the index.html file of the specified appnet
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
    server.listen(80)
    log(`Started HTTP server for network ${appnetName} on port 80`)
}

