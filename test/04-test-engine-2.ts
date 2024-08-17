import { $, chalk, question, sleep } from 'zx'
import { ConnectionResult, Network, createNetwork, connectEngine, getEngines, findEngineByHostname } from '../src/data/Network.js';
import { deepPrint, findIp, isIP4, isNetmask, prompt } from '../src/utils/utils.js';
import { log } from '../src/utils/utils.js';
import { expect } from 'chai';
import { config } from '../src/data/Config.js';
import { findNetworkByName, getLocalEngine } from '../src/data/Store.js';
import { subscribe } from 'valtio';
import { store } from '../src/data/Store.js';
import { AppnetName, Hostname, IPAddress, InterfaceName } from '../src/data/CommonTypes.js';

const testSetup = config.testSetup

const testNet = testSetup.appnet as AppnetName
const testInterface = testSetup.interface as InterfaceName
const testDisk2 = testSetup.testDisk2
const testEngine2Name = testDisk2.name as Hostname
const testEngine2Address = testDisk2.name + ".local" as IPAddress


export let network2: Network
let connection2Promise: Promise<ConnectionResult>

let remoteEngine

describe('Test engine 2: ', () => {

    describe(`Must support connections on address ${testEngine2Address}`, () => {

        before(async function () {
            network2 = await createNetwork(store, testNet)
            // Subscribe to changes in the engineSet object and log them
            // Also protect against too many changes which would overflow stdout
            subscribe(network2.appnet.engines, (value) => {
                log(chalk.bgBlackBright("\n" + `Test engine 2 monitor: engineSet was modified as follows: ${deepPrint(value)}`))
                //log(`NETWORKDATA GLOBAL MONITOR for Network ${networkName}: ${value.length} changes`)
                if (value.length > 10) {
                // exit the program
                log(`Too many changes detected, exiting...`)
                process.exit(1)
                }
            })
            connection2Promise = connectEngine(network2, testEngine2Address, true)
            //console.dir(networkData, {depth: 3, colors: true})
            //log(chalk.green(deepPrint(networkData2, 4)))
            // JSON.stringify(networkData, null, 2)))
        })

        // before(async function () {
        //     // Instruct the user to boot one engine using testdisk-2
        //     this.timeout(0)
        //     await prompt(0, `Please boot the first engine using disk ${testDisk2}`)
        // })

        it('The test machine must be able to connect with it ', async function () {
            this.timeout(0)
            expect(network2).to.exist
            if (network2) expect(network2.appnet).to.exist
            if (network2 && network2.appnet) expect(network2.appnet.engines).to.exist
            expect(connection2Promise).to.exist

            // The promise must resolve to a ConnectionResult
            const connection2 = await connection2Promise
            expect(connection2).to.exist
            expect(connection2.status).to.equal('synced')
        })

        it('The connection must deliver a remote engine object within 30 secs', async function (done) {
            this.timeout(30000)
            if (!network2 || !network2.appnet) this.skip()


            // If networkdata2.engines is not empty, call done()
            if (Object.keys(network2.appnet.engines).length !== 0) {
                done()
            } else {
                // Subscribe to changes in the engineSet object 
                // NOTE: If ever remote data comes in during this test and before we subscribe, this will FAIL
                subscribe(network2.appnet.engines, (value) => {
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
                    const engine = value.find((el) => el[0] === 'set' && el[1][0] === '0')
                    // Now that the ids have propagated, we can query for all engines so that proxies are created and bound to the corresponding Yjs objects
                    getEngines(network2).forEach((engine) => {
                        log(chalk.bgBlackBright(`Engine found: ${deepPrint(engine)}`))
                    })
                    done()
                })
            }
        })

        describe('The connection must deliver a remote engine object ', async function () {
            //await sleep(10000)
            //console.dir(networkData2, {depth: 3, colors: true})
            //log(chalk.bgBlackBright("\n" + deepPrint(networkData2, 4)))
            // We must find an Engine object in networkData2 with the same name as testEngine2
            it(`with the right name`, async function () {
                remoteEngine = findEngineByHostname(network2, testEngine2Name)
                expect(remoteEngine).to.exist
            })

            it(`with a version that equals the version in the test description if one is provided`, async function () {
                if (!remoteEngine || !testDisk2.version) this.skip()
                expect(remoteEngine.version).to.not.be.empty
                expect(remoteEngine.version).to.eql(testDisk2.version)
            })

            it(`with a hostOS that equals the hostOS in the test description if one is provided`, async function () {
                if (!remoteEngine || !testDisk2.hostOS) this.skip()
                expect(remoteEngine.hostOS).to.not.be.empty
                expect(remoteEngine.hostOS).to.eql(testDisk2.hostOS)
            })

            it(`with a lastBooted time that is greater than the moment of this coding`, async function () {
                if (!remoteEngine) this.skip()
                expect(remoteEngine.lastBooted).to.be.greaterThan(1716099940264) // should be bigger than the moment of this coding which is May 19, 2024
            })

            describe(`with an interface named ${testInterface}`, async function () {

                it(`that exists`, async function () {
                    remoteEngine = findEngineByHostname(network2, testEngine2Name)
                    //console.log(`Remote engine: ${deepPrint(remoteEngine)}`)
                    //console.log(testInterface)
                    expect(remoteEngine.connectedInterfaces).to.have.property(testInterface)
                })

                it(`that has the right name`, async function () {
                    if (!remoteEngine) this.skip()
                    expect(remoteEngine.connectedInterfaces[testInterface].name).to.eql(testInterface)
                })

                it(`that has a valid ip4 address...`, async function () {
                    if (!remoteEngine) this.skip()
                    expect(remoteEngine.connectedInterfaces[testInterface].ip4).to.not.be.empty
                    expect(isIP4(remoteEngine.connectedInterfaces[testInterface].ip4)).to.be.true
                })

                it('...which corresponds to the resolution of the address', async function () {
                    this.timeout(10000)
                    // The ip address must correspond to the resolution of testEngine2Address
                    expect(remoteEngine.connectedInterfaces[testInterface].ip4).to.eql(await findIp(testEngine2Address))
                })


                it(`that has a valid netmask`, async function () {
                    if (!remoteEngine) this.skip()
                    expect(remoteEngine.connectedInterfaces[testInterface].netmask).to.not.be.empty
                    expect(isNetmask(remoteEngine.connectedInterfaces[testInterface].netmask)).to.be.true
                })
            })
        })
    })

    // Lets keep the connection open so that we can import it in test 05
    // after(function () {
    //     // Close the network
    //     disconnectNetwork(network2, testInterface)
    // })
})
