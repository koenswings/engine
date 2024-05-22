import assert, { doesNotMatch } from 'assert'
import { chalk, question, sleep } from 'zx'
import { connect } from '../src/utils/connect.js';
import { NetworkData } from '../src/data/dataTypes.js';
import { Defaults, readDefaults } from '../scratchpad/readDefaults.js';
import { deepPrint, prompt } from '../src/utils/utils.js';
import { log } from 'console';
import { expect } from 'chai';
import { readConfig } from '../src/utils/readConfig.js';
import { ConnectionResult } from '../src/data/dataTypes.js';
import { getEngine } from '../src/data/store.js';

const { testSetup } = await readConfig('config.yaml')

const testNet = testSetup.appnet
const testInterface = testSetup.interface
const localEngine = '127.0.0.1'

let connection1Promise: Promise<ConnectionResult>
let networkData1: NetworkData

// export const connectNetwork = (network:Network, ifaceName:string, ip4:string, netmask:string) => {
//     log(`Connecting network ${network.name} to engines on interface ${ifaceName}.`)
//     log(`Local engine has IP4 address ${ip4} on this interface.`)
//     log(`The LAN on this interface has a netmask of ${netmask}`)
  
//     const networkDoc = network.doc
  
//     // Create an Interface
//     const iface = {
//       name: ifaceName,
//       ip4: ip4,
//       netmask: netmask,
//     }
  
//     // And add it to the local engine
//     getEngine().interfaces[ifaceName] = iface
//     log(`Added or updated interface ${ifaceName} on local engine`)
  
//     // UPDATE001: Decomment the following code in case we want to only open sockets on the interfaces that we monitor
//     // Enable the Yjs WebSocket service for this interface if it is not already enabled
//     // if (!runningServers.hasOwnProperty(ip4)) {
//     //   enableWebSocketMonitor(ip4, '1234')
//     //   runningServers[ip4] = true
//     // } else {
//     //   log(`WebSocket server already running on ${ip4}`)
//     // }
  
//     const wsProvider = new WebsocketProvider(`ws://${ip4}:1234`, network.name, networkDoc)
//     // Add the wsProvider to the wsProviders object of the network
//     // network.wsProviders[`${ip4}:1234-on-${ifaceName}`] = wsProvider
//     if (!network.connections[ifaceName]) {
//       network.connections[ifaceName] = {}
//     }
//     network.connections[ifaceName][`${ip4}:1234`] = wsProvider
//     wsProvider.on('status', (event: { status: any; }) => {
//       if (event.status === 'connected') {
//         log(`${event.status} to ${ip4}:1234-on-${ifaceName}`) 
//       } else if (event.status === 'disconnected') {
//         log(`${event.status} from ${ip4}:1234-on-${ifaceName}`) 
//       } else if (event.status === 'reconnection-failure-3') {
//         log(`Reconnection to ${ip4}:1234-on-${ifaceName} failed 3 times.`)
//         // network.connections[ifaceName][`${ip4}:1234`].destroy()
//         // delete network.connections[ifaceName][`${ip4}:1234`]
//         // Lets keep trying till we reboot...
  
//       } else {
//         log(`Unhandled status ${event.status} for ${ifaceName}`)
//       }
//     })
//     log(`Interface ${ifaceName}: Created an Yjs websocket client connection on adddress ws://${ip4}:1234 with room name ${network.name}`)
  
//     // Now monitor this interface for additonal engines that are on the network
//     enableEngineMonitor(ifaceName, network.name)
//   }

describe(`The local engine connected via ${localEngine} - `, () => {

    before(async function () {
        this.timeout(0)
        connection1Promise = connect(testNet, localEngine, 1234)
        log(chalk.green(deepPrint(networkData1, 4)))
    })

    describe('After a fresh boot - ', () => {
        it('the test machine must be able to connect with itself over the loopback interface ', async () => {
            expect(connection1Promise).to.exist
            // The promise must resolve to a ConnectionResult
            const connection1 = await connection1Promise
            expect(connection1).to.exist
            expect(connection1.status).to.equal('connected')
            networkData1 = connection1.networkData
            expect(networkData1).to.exist
            //console.dir(networkData, {depth: 3, colors: true})
            // JSON.stringify(networkData, null, 2)))   
        })

        it('the connection must sync within 5 secs and deliver data for the local machine', async function () {
            this.timeout(0)
            await sleep(5000)
            const engine = getEngine()
            // networkData1.engines must have an object that is a deep copy of the local engine object
            expect(networkData1.engines).to.have.lengthOf(1)
            expect(networkData1.engines[0]).to.eql(engine)
        })

        //   it(`the local Engine object must have the right properties`, async function () {
        //     const engine = getEngine()
        //     // The local engine can be on any third machine so we cannot know the values, only that they should not be empty
        //     expect(engine.hostName).to.not.be.empty
        //     expect(engine.version).to.not.be.empty
        //     expect(engine.hostOS).to.not.be.empty
        //     expect(engine.lastBooted).to.be.greaterThan(1716099940264) // should be bigger than the moment of this coding which is May 19, 2024
        //     // It must have an interface corresponding to the testInterface
        //     expect(engine.interfaces).to.have.property(testInterface)
        //     // That interface must have a name that corresponds to testInterface
        //     expect(engine.interfaces[testInterface].name).to.eql(testInterface)
        //     // That interface must have a valid ip address and netmask
        //     expect(engine.interfaces[testInterface].ip4).to.not.be.empty
        //     expect(isIP4(engine.interfaces[testInterface].ip4)).to.be.true
        //     expect(engine.interfaces[testInterface].netmask).to.not.be.empty
        //     expect(isNetmask(engine.interfaces[testInterface].netmask)).to.be.true
        //   }) 
    })
}) // Single Remote Engine Tests