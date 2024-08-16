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

const testSetup = config.testSetup
const testNet = testSetup.appnet as AppnetName
const testInterface = testSetup.interface

const loopBackAddress = '127.0.0.1' as IPAddress

let network: Network
let connectionPromise: Promise<ConnectionResult>

let engine, appnet



describe('The test master (the engine from which these tests are run) - ', async function () {

  it(`must have a Network object with the name ${testNet}`, async function () {
    appnet = findNetworkByName(store, testNet)
    expect(appnet).to.exist
  })

  describe(`must have a local Engine object `, async function () {
    it(`that must exist`, async function () {
      engine = getLocalEngine(store)
      expect(engine).to.exist
    })
    it(`that must be a top-level object in the Yjs doc of the Network`, async function () {
      if (!engine || !appnet) this.skip()
      //expect(appnet.engines.values()).to.include(engine)
    expect(network.doc.getMap(engine.id)).to.exist
    })
    it(`whose id should be contained in the engines set of the Network`, async function () {
      if (!engine || !appnet) this.skip()
      //expect(appnet.engines.values()).to.include(engine)
    expect(network.appnet.engines[engine.id]).to.be.true
    })

    // The local engine can be on any machine so we cannot know the values, only that they should not be empty
    it(`that must have a hostName property that is a non-empty string`, async function () {
      if (!engine) this.skip()
      expect(engine.hostName).to.not.be.empty
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
    describe(`that must have an interface `, async function () {
      it(`corresponding to the testInterface`, async function () {
        if (!engine) this.skip()
        expect(engine.connectedInterfaces).to.have.property(testInterface)
      })

      // expect(engine.connectedInterfaces[testInterface].name).to.eql(testInterface)
      it(`that must have a name that corresponds to testInterface`, async function () {
        if (!engine || !engine.connectedInterfaces[testInterface]) this.skip()
        expect(engine.connectedInterfaces[testInterface].name).to.eql(testInterface)
      })

      // expect(engine.connectedInterfaces[testInterface].ip4).to.not.be.empty
      // expect(isIP4(engine.connectedInterfaces[testInterface].ip4)).to.be.true
      it(`that must have a valid ip address`, async function () {
        if (!engine || !engine.connectedInterfaces[testInterface]) this.skip()
        expect(engine.connectedInterfaces[testInterface].ip4).to.not.be.empty
        expect(isIP4(engine.connectedInterfaces[testInterface].ip4)).to.be.true
      })

      // expect(engine.connectedInterfaces[testInterface].netmask).to.not.be.empty
      // expect(isNetmask(engine.connectedInterfaces[testInterface].netmask)).to.be.true
      it(`that must have a valid netmask`, async function () {
        if (!engine || !engine.connectedInterfaces[testInterface]) this.skip()
        expect(engine.connectedInterfaces[testInterface].netmask).to.not.be.empty
        expect(isNetmask(engine.connectedInterfaces[testInterface].netmask)).to.be.true
      })
    })
  })


  describe('must support connections over the loopback interface', async function () {

    before(async function () {
      network = await createNetwork(store, testNet)
      // Subscribe to changes in the engineSet object and log them
      // Also protect against too many changes which would overflow stdout
      subscribe(network.appnet.engines, (value) => {
        log(chalk.bgBlackBright("\n" + `Test master monitor: engineSet was modified as follows: ${deepPrint(value)}`))
        //log(`NETWORKDATA GLOBAL MONITOR for Network ${networkName}: ${value.length} changes`)
        if (value.length > 10) {
          // exit the program
          log(`Too many changes detected, exiting...`)
          process.exit(1)
        }
      })
      connectionPromise = connectEngine(network, loopBackAddress, true)
      //log(chalk.green(deepPrint(networkData1, 4)))
    })


    // Expect the local engine to have an interface called "lo" with ip address 127.0.0.1
    it(`the local engine must have an interface called "lo"`, async function () {
      expect(engine.connectedInterfaces).to.have.property("lo")
    })
    it(`the ip address of the "lo" interface must be ${loopBackAddress}`, async function () {
      expect(engine.connectedInterfaces["lo"].ip4).to.eql(loopBackAddress)
    })

    it(`the connection must be successful`, async function () {

      // Expect the network, networkData and connectionPromise to exist
      expect(network).to.exist
      expect(network.appnet).to.exist
      expect(network.appnet.engines).to.exist
      expect(connectionPromise).to.exist

      // The promise must resolve to a ConnectionResult
      const connection1 = await connectionPromise
      expect(connection1).to.exist
      expect(connection1.status).to.equal('synced')
      //console.dir(networkData, {depth: 3, colors: true})
      // JSON.stringify(networkData, null, 2)))   
    })

    it('the connection must deliver an engine object within 30 secs', async function (done) {
      this.timeout(30000)

      // If network.appnet.engines is not empty, it has already synced, so call done()
      if (Object.keys(network.appnet.engines).length !== 0) {
        done()
      } else {
        // Subscribe to changes in the engineSet object 
        // NOTE: If ever remote data comes in during this test and before we subscribe, this will FAIL
        subscribe(network.appnet.engines, (value) => {
          log(chalk.bgBlackBright(`engineSet changed: ${deepPrint(value)}`))
          // Test for the chnage that modifies the engines array
          // Here is an example of a value we expect
          // [[
          //     'set',
          //     [ 'engines', '0' ],
          //     {
          //       hostName: 'loving-jennings',
          //       version: '1.0',
          //       hostOS: 'Linux',
          //       dockerMetrics: {
          //         memory: '3975192576',
          //         cpu: '0.74,0.27,0.2',
          //         network: '',
          //         disk: ''
          //       },
          //       dockerLogs: { logs: [] },
          //       dockerEvents: { events: [] },
          //       lastBooted: 1716718389298,
          //       interfaces: {
          //         eth0: {
          //           name: 'eth0',
          //           ip4: '192.168.0.139',
          //           netmask: '255.255.255.0'
          //         }
          //       },
          //       disks: [],
          //       commands: []
          //     },
          //     undefined
          //   ]]
          // SO find an element in the array that sets the engine property at a specific index to an object and extract that object
          // const engineId = value.find((el) => el[0] === 'set' && el[1][0] === '0')
          // Now that the ids have propagated, we can query for all engines so that proxies are created and bound to the corresponding Yjs objects
          getEngines(network).forEach((engine) => {
            log(chalk.bgBlackBright(`Engine found: ${deepPrint(engine)}`))
          })
          done()
        })
      }

    })

    it('the engine object delivered over the connection must equal the test master engine', async function () {
      const engine = getLocalEngine(store)
      // engineSet must have a key for the id of the local engine
      expect(network.appnet.engines).to.have.property(engine.id)
      // the object at that key must be a deep copy of the local engine object
      expect(network.appnet.engines[engine.id]).to.eql(engine)
      // networkData1.engines must have an object that is a deep copy of the local engine object
      // expect(network.engineSet).to.have.lengthOf(1)
      // expect(network.engineIds[0]).to.eql(engine.id)
      // expect(getEngine(network, network.engineIds[0])).to.eql(engine)
    })

    after(function () {
      // Close the network
      // disconnectNetwork(network, testInterface)
    })

  }) // Websocket Server Tests

}) // Test Master Tests


//   //   it(`the local Engine object must have the right properties`, async function () {
//   //     const engine = getEngine()
//   //     // The local engine can be on any third machine so we cannot know the values, only that they should not be empty
//   //     expect(engine.hostName).to.not.be.empty
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
// expect(engine).to.have.property('hostName').that.is.a('string')
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
