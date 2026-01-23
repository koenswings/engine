import { fs } from 'zx'
import http from 'http'

import { log, deepPrint, getKeys, findIp } from '../utils/utils.js'
import { Store, getInstance } from '../data/Store.js'
import { InstanceID, InterfaceName, IPAddress, PortNumber } from '../data/CommonTypes.js'
import { getEngineOfInstance } from '../data/Store.js'
import { DocHandle } from '@automerge/automerge-repo'

// export const enableInstanceSetMonitor = async (storeHandle:DocHandle<Store>):Promise<void> => {
//     const store = storeHandle.doc()
//     // Generate HTML for the current instances
//     const instanceIds = getKeys(store.instanceDB) as InstanceID[]
//     await generateHTML(store, instanceIds)

//     storeHandle.on('change', ({ doc, patches }) => {
//         log(`enableInstanceSetMonitor handles ${deepPrint(patches)}`)
//         for (const patch of patches) {
//             // The path for an additional Engine in the engineDB set is expected to be in the form:
//             // ['engineDB', <index>]
//             if (patch.action === 'put' &&  // Since we never change the object value, we know that 'put' means an addition 
//                 patch.path.length === 2 &&
//                 patch.path[0] === 'instanceDB' &&
//                 typeof patch.path[1] === 'number') {
//                 const instanceId = patch.path[1].toString() as InstanceID
//                 log(`New instance added with ID: ${instanceId}`)
//                 // Update the HTML
//                 generateHTML(store, getKeys(store.instanceDB) as InstanceID[])
//             }
//             // The path for a removed Engine in the engineDB set is expected to be in the form:
//             // ['engineDB', <index>]
//             else if (patch.action === 'del' &&
//                 patch.path.length === 2 &&
//                 patch.path[0] === 'instanceDB' &&
//                 typeof patch.path[1] === 'number') {
//                 const instanceId = patch.path[1].toString() as InstanceID
//                 log(`Instance removed with ID: ${instanceId}`)
//                 // Update the HTML
//                 generateHTML(store, getKeys(store.instanceDB) as InstanceID[])
//             }
//         }   
//     })
//     log(`Added INSTANCESET MONITOR`)
// }

// export const enableInstanceStatusMonitor = async (storeHandle:DocHandle<Store>):Promise<void> => {
//     // Generate HTML for the current instances
//     await generateHTML(storeHandle)

//     // Monitor for changes in the status of instances
//     storeHandle.on('change', ({ doc, patches }) => {
//         log(`Instance Status Monitor handles ${deepPrint(patches)}`)
//         for (const patch of patches) {
//             // Monitor the status property of any instance in the instanceDB set
//             // The path for a change in the status property of an instance is expected to be in the form:
//             // ['instanceDB', <instanceId>, 'status']
//             if (patch.action === 'put' &&
//                 patch.path.length === 3 &&
//                 patch.path[0] === 'instanceDB' &&
//                 typeof patch.path[1] === 'string' && // instanceId
//                 patch.path[2] === 'status') {
//                 const instanceId = patch.path[1] as InstanceID
//                 const status = patch.value as string
//                 log(`Instance ${instanceId} status changed to: ${status}`)
//                 // Update the HTML
//                 generateHTML(storeHandle)
//             }
//         }   
//     })
//     log(`Added INSTANCESET MONITOR`)
// }

export const generateHTML = async (storeHandle:DocHandle<Store>):Promise<void> => {
    const store = storeHandle.doc()
    const instanceIds = getKeys(store.instanceDB) as InstanceID[]
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
                ${(await Promise.all(instanceIds.map(async (instanceId) =>  {
                    // Find the engine hostname for the instance and generate a url using the hostname and the port number of the instance
                    const instance = getInstance(store, instanceId) ?? undefined
                    if (!instance) {
                        return `<li>Instance ${instanceId} not found</li>`
                    }
                    const diskId = instance.storedOn
                    const engine = getEngineOfInstance(store, instance) ?? undefined
                    if (!engine) {
                        return `<li>Instance ${instanceId} not docked</li>`
                    }
                    const hostname = engine.hostname
                    const port = instance.port
                    // const ip = await findIp(`${hostname}.local` as IPAddress)
                    // HACK - Assuming engines are only used over eth0 - We should restrict the interaces and then enumerate the addresses on all restricted interfaces
                    const ip = await findIp(hostname+'.local' as IPAddress)
                    if (ip && (instance.status === 'Running') && port && port > 0) {
                        return `<li><a href="http://${hostname}.local:${port}">${instance.name} on disk ${diskId} (${instance.status})</a> or use <a href="http://${ip}:${port}">this</a></li>`
                    } else if ((instance.status === 'Running') && port && port > 0) {
                        return `<li><a href="http://${hostname}.local:${port}">${instance.name} on disk ${diskId} (${instance.status})</a></li>`
                    } else {
                        return `<li>${instance.name} on disk ${diskId} has status (${instance.status})</li>`
                    }
                }))).join('\n')}
            </ul>
        </body>
    </html>`
    log(`Generated HTML: ${html}`)
    // Write the HTML to a file called <appnetName>.html
    fs.writeFileSync(`appnet.html`, html)
}   

export const enableIndexServer = async (storeHandle:DocHandle<Store>):Promise<void> => {
    // Start an HTTP server that serves the index.html file of the specified appnet
    const portNumber = 80

    // If the file `${appnetName}.html` does not exist, generate it
    if (!fs.existsSync(`appnet.html`)) {
        await generateHTML(storeHandle)
    }
    const server = http.createServer((req, res) => {
        res.writeHead(200, {'Content-Type': 'text/html'})
        fs.readFile(`appnet.html`, (err, data) => {
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
    log(`Started HTTP server on port ${portNumber}`)
}

