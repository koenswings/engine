import { getLocalEngine, findNetworkByName, } from '../src/data/Store.js';
import { deepPrint, isIP4, isNetmask, prompt } from '../src/utils/utils.js';
import { log } from '../src/utils/utils.js';
import { config } from '../src/data/Config.js';
import { ConnectionResult, Network, connectEngine, createNetwork, getEngines } from '../src/data/Network.js';
import { chalk, sleep } from 'zx';
import { subscribe } from 'valtio';
//import { expect } from 'chai';
const { expect } = await import('chai')
import { store } from '../src/data/Store.js';
import { App } from '../src/data/App.js';
import { AppnetName, IPAddress } from '../src/data/CommonTypes.js';
import { Engine } from '../src/data/Engine.js';

const testSetup = config.testSetup
const testNet = testSetup.appnet as AppnetName
const testInterface = testSetup.interface

const loopBackAddress = '127.0.0.1' as IPAddress

let network: Network | undefined
let connectionPromise: Promise<ConnectionResult>

let engine:Engine



describe('The test master (the engine from which these tests are run) - ', async function () {

  describe(`must have a Network object with the name ${testNet}`, async function () {
    it(`that must exist`, async function () {
      network = findNetworkByName(testNet)
      expect(network).to.exist
    })
    it(`that must have the right name`, async function () {
      if (!network) this.skip()
      expect(network.name).to.eql(testNet)
    })
    it('that must have a Doc object', async function () {
      if (!network) this.skip()
      expect(network.doc).to.exist
    })
    describe('that must have an Appnet object', async function () {
      it('that must exist', async function () {
        if (!network) this.skip()
        expect(network.appnet).to.exist
      })
      it('that must have the right name', async function () {
        if (!network || !network.appnet) this.skip()
        expect(network.appnet.name).to.eql(testNet)
      })
     it('that must have an engines property', async function () {
        if (!network || !network.appnet) this.skip()
        expect(network.appnet.engines).to.exist
      })
      it(`that is bound to an Yjs Map object called ${testNet}_engineSet `, async function () {
        if (!network || !network.appnet) this.skip()
        expect(network.doc.getMap(`APPNET_${testNet}_engineSet`)).to.exist
      })
    })
    describe('that must be connected with the loopback interface ', async function () {

      it(`must have a wsProvider object for the loopback address ${loopBackAddress}`, async function () {
        if (!network) this.skip()
        expect(network.connections).to.have.property(`${loopBackAddress}:1234`)
        expect(network.connections[`${loopBackAddress}:1234`]).to.exist
      })

      it(`the wsProvider must be in the connected state`, async function () {
        if (!network) this.skip()
        expect(network.connections[`${loopBackAddress}:1234`].wsconnected).to.be.true
      })
    
      // it(`the connection must be successful`, async function () {
  
      //   // Expect the network, networkData and connectionPromise to exist
      //   expect(network).to.exist
      //   if (network) expect(network.appnet).to.exist
      //   if (network && network.appnet) expect(network.appnet.engines).to.exist
      //   expect(connectionPromise).to.exist
  
      //   // The promise must resolve to a ConnectionResult
      //   const connection1 = await connectionPromise
      //   expect(connection1).to.exist
      //   expect(connection1.status).to.equal('synced')
      //   //console.dir(networkData, {depth: 3, colors: true})
      //   // JSON.stringify(networkData, null, 2)))   
      // })
  
      // it('the connection must deliver an engine object within 30 secs', async function (done) {
      //   this.timeout(30000)
      //   if (!network || !network.appnet) this.skip()
      //   // If network.appnet.engines is not empty, it has already synced, so call done()
      //   if (Object.keys(network.appnet.engines).length !== 0) {
      //     done()
      //   } else {
      //     // Subscribe to changes in the engineSet object 
      //     // NOTE: If ever remote data comes in during this test and before we subscribe, this will FAIL
      //     subscribe(network.appnet.engines, (value) => {
      //       log(chalk.bgBlackBright(`engineSet changed: ${deepPrint(value)}`))
      //       // Test for the chnage that modifies the engines array
      //       // Here is an example of a value we expect
      //       // [[
      //       //     'set',
      //       //     [ 'engines', '0' ],
      //       //     {
      //       //       hostname: 'loving-jennings',
      //       //       version: '1.0',
      //       //       hostOS: 'Linux',
      //       //       dockerMetrics: {
      //       //         memory: '3975192576',
      //       //         cpu: '0.74,0.27,0.2',
      //       //         network: '',
      //       //         disk: ''
      //       //       },
      //       //       dockerLogs: { logs: [] },
      //       //       dockerEvents: { events: [] },
      //       //       lastBooted: 1716718389298,
      //       //       interfaces: {
      //       //         eth0: {
      //       //           name: 'eth0',
      //       //           ip4: '192.168.0.139',
      //       //           netmask: '255.255.255.0'
      //       //         }
      //       //       },
      //       //       disks: [],
      //       //       commands: []
      //       //     },
      //       //     undefined
      //       //   ]]
      //       // SO find an element in the array that sets the engine property at a specific index to an object and extract that object
      //       // const engineId = value.find((el) => el[0] === 'set' && el[1][0] === '0')
      //       // Now that the ids have propagated, we can query for all engines so that proxies are created and bound to the corresponding Yjs objects
      //       if (network) {
      //         getEngines(network).forEach((engine) => {
      //           log(chalk.bgBlackBright(`Engine found: ${deepPrint(engine)}`))
      //         })
      //       }
      //       done()
      //     })
      //   }
  
      // })
  
      // it('the engine object delivered over the connection must equal the test master engine', async function () {
      //   if (!network || !network.appnet) this.skip()
      //   const engine = getLocalEngine(store)
      //   // engineSet must have a key for the id of the local engine
      //   expect(network.appnet.engines).to.have.property(engine.id)
      //   // the object at that key must be a deep copy of the local engine object
      //   expect(network.appnet.engines[engine.id]).to.eql(engine)
      //   // networkData1.engines must have an object that is a deep copy of the local engine object
      //   // expect(network.engineSet).to.have.lengthOf(1)
      //   // expect(network.engineIds[0]).to.eql(engine.id)
      //   // expect(getEngine(network, network.engineIds[0])).to.eql(engine)
      // })
  
      after(function () {
        // OLD
        // Close the network
        // disconnectNetwork(network, testInterface)
      })
  
    }) // Websocket Server Tests
  
  })

  describe(`must have a local Engine object `, async function () {
    it(`that must exist`, async function () {
      engine = getLocalEngine(store)
      log('@@@@@@@@@@@@@@@@@@@ getLocalEngine = '+deepPrint(engine))
      expect(engine).to.exist
    })
    it(`that must be a root-level object in the Yjs doc of the Network`, async function () {
      if (!engine || !network) this.skip()
      //expect(appnet.engines.values()).to.include(engine)
      expect(network.doc.getMap("ENGINE_"+engine.id)).to.exist
    })
    it(`whose id should be contained in the engines set of the Network`, async function () {
      if (!engine || !network) this.skip()
      //expect(appnet.engines.values()).to.include(engine)
      expect(network.appnet.engines[engine.id]).to.be.true
    })

    // The local engine can be on any machine so we cannot know the values, only that they should not be empty
    it(`that must have a hostname property that is a non-empty string`, async function () {
      if (!engine) this.skip()
      expect(engine.hostname).to.not.be.empty
    })

    // expect(engine.version).to.not.be.empty
    it(`that must have a version property that is a non-empty string`, async function () {
      if (!engine) this.skip()
      expect(engine.version).to.not.be.empty
    })

    // expect(engine.hostOS).to.not.be.empty
    it(`that must have a hostOS property that is a non-empty string`, async function () {
      if (!engine) this.skip()
      expect(engine.hostOS).to.not.be.empty
    })

    // expect(engine.lastBooted).to.be.greaterThan(1716099940264) // should be bigger than the moment of this coding which is May 19, 2024
    it(`that must have a lastBooted property that is a number greater than 1716099940264`, async function () {
      if (!engine) this.skip()
      expect(engine.lastBooted).to.be.greaterThan(1716099940264)
    })

    // expect(engine.connectedInterfaces).to.have.property(testInterface)
    describe(`that must have connected interfaces `, async function () {
      it(`that must exist`, async function () {
        if (!engine) this.skip()
        expect(engine.connectedInterfaces).to.exist
      })
      // Expect the local engine to have an interface called "lo" with ip address 127.0.0.1
      it(`that must include an interface called "lo"`, async function () {
        if (!engine || !engine.connectedInterfaces) this.skip()
        expect(engine.connectedInterfaces).to.have.property("lo")
      })
      it(`the ip address of the "lo" interface must be ${loopBackAddress}`, async function () {
        if (!engine || !engine.connectedInterfaces) this.skip()
        expect(engine.connectedInterfaces["lo"].ip4).to.eql(loopBackAddress)
      })
      it(`that must include the testInterface ${testInterface}`, async function () {
        if (!engine || !engine.connectedInterfaces) this.skip()
        expect(engine.connectedInterfaces).to.have.property(testInterface)
      })

      // expect(engine.connectedInterfaces[testInterface].name).to.eql(testInterface)
      it(`that must have a name that corresponds to testInterface`, async function () {
        if (!engine || !engine.connectedInterfaces || !engine.connectedInterfaces[testInterface]) this.skip()
        expect(engine.connectedInterfaces[testInterface].name).to.eql(testInterface)
      })

      // expect(engine.connectedInterfaces[testInterface].ip4).to.not.be.empty
      // expect(isIP4(engine.connectedInterfaces[testInterface].ip4)).to.be.true
      it(`that must have a valid ip address`, async function () {
        if (!engine || !engine.connectedInterfaces || !engine.connectedInterfaces[testInterface]) this.skip()
        expect(engine.connectedInterfaces[testInterface].ip4).to.not.be.empty
        expect(isIP4(engine.connectedInterfaces[testInterface].ip4)).to.be.true
      })

      // expect(engine.connectedInterfaces[testInterface].netmask).to.not.be.empty
      // expect(isNetmask(engine.connectedInterfaces[testInterface].netmask)).to.be.true
      it(`that must have a valid netmask`, async function () {
        if (!engine || !engine.connectedInterfaces || !engine.connectedInterfaces[testInterface]) this.skip()
        expect(engine.connectedInterfaces[testInterface].netmask).to.not.be.empty
        expect(isNetmask(engine.connectedInterfaces[testInterface].netmask)).to.be.true
      })
    })
  })

 
}) // Test Master Tests


//   //   it(`the local Engine object must have the right properties`, async function () {
//   //     const engine = getEngine()
//   //     // The local engine can be on any third machine so we cannot know the values, only that they should not be empty
//   //     expect(engine.hostname).to.not.be.empty
//   //     expect(engine.version).to.not.be.empty
//   //     expect(engine.hostOS).to.not.be.empty
//   //     expect(engine.lastBooted).to.be.greaterThan(1716099940264) // should be bigger than the moment of this coding which is May 19, 2024
//   //     // It must have an interface corresponding to the testInterface
//   //     expect(engine.interfaces).to.have.property(testInterface)
//   //     // That interface must have a name that corresponds to testInterface
//   //     expect(engine.interfaces[testInterface].name).to.eql(testInterface)
//   //     // That interface must have a valid ip address and netmask
//   //     expect(engine.interfaces[testInterface].ip4).to.not.be.empty
//   //     expect(isIP4(engine.interfaces[testInterface].ip4)).to.be.true
//   //     expect(engine.interfaces[testInterface].netmask).to.not.be.empty
//   //     expect(isNetmask(engine.interfaces[testInterface].netmask)).to.be.true
//   //   }) 
// })



// ARCHIVE OF TESTS
// expect(engine).to.have.property('hostname').that.is.a('string')
// expect(engine).to.have.property('version').that.is.a('string')
// expect(engine).to.have.property('hostOS').that.is.a('string')
// expect(engine).to.have.property('dockerMetrics').that.is.an('object')
// expect(engine).to.have.property('dockerLogs').that.is.an('object')
// expect(engine).to.have.property('dockerEvents').that.is.an('object')
// expect(engine).to.have.property('lastBooted').that.is.a('number')
// expect(engine).to.have.property('disks').that.is.an('array')
// expect(engine).to.have.property('interfaces').that.is.an('object')
// expect(engine).to.have.property('commands').that.is.an('array')
// expect(instanceof(engine)).to.eql("Engine")


// Tests that TypeScript will take care of have been removed
// We are not going to check if the Network object has the right properties
// because TypeScript will take care of that

// it(`its Network object must have a non-empty NetworkData object with the right properties`, async function () {
//   const appnetData = getNetwork(testNet).data
//   expect(appnetData).to.exist
//   expect(appnetData).to.be.an('object')
// })

// it(`its Network object must have an engines property containing Engines`, async function () {
//   const appnetData = getNetwork(testNet).data
//   expect(appnetData).to.have.property('engines')
//   expect(appnetData.engines).to.be.an('array')
//   appnetData.engines.forEach((engine: Engine) => {
//     expect(engine).to.be.an('object')
//     expect(engine).to.be.an.instanceof(Engine)
//   })
// })

// // Disks property
// it(`its Network object must have a disks property containing Disks`, async function () {
//   const appnetData = getNetwork(testNet).data
//   expect(appnetData).to.have.property('disks')
//   expect(appnetData.disks).to.be.an('array')
//   appnetData.disks.forEach((disk: Disk) => {
//     expect(disk).to.be.an('object')
//     expect(disk).to.be.an.instanceof(Disk)
//   })
// })

// // Apps property
// it(`its Network object must have an apps property containing Apps`, async function () {
//   const appnetData = getNetwork(testNet).data
//   expect(appnetData).to.have.property('apps')
//   expect(appnetData.apps).to.be.an('array')
//   appnetData.apps.forEach((app: App) => {
//     expect(app).to.be.an('object')
//     expect(app).to.be.an.instanceof(App)
//   })
// })
