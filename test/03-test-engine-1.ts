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
const testDisk1 = testSetup.testDisk1
const testEngine1Name = testDisk1.name as Hostname
const testEngine1Address = testDisk1.name + ".local" as IPAddress


export let network1: Network
let connection1Promise: Promise<ConnectionResult>

let remoteEngine, disk

describe('Test engine 1: ', () => {

    describe(`Must support connections on address ${testEngine1Address}`, () => {

        before(async function () {
            network1 = await createNetwork(store, testNet)
            // Subscribe to changes in the engineSet object and log them
            // Also protect against too many changes which would overflow stdout
            subscribe(network1.appnet.engines, (value) => {
                log(chalk.bgBlackBright("\n" + `Test engine 1 monitor: engineSet was modified as follows: ${deepPrint(value)}`))
                getEngines(network1).forEach((engine) => {
                    log(chalk.bgBlackBright(`Engine found: ${deepPrint(engine)}`))
                })
                //log(`NETWORKDATA GLOBAL MONITOR for Network ${networkName}: ${value.length} changes`)
                if (value.length > 10) {
                // exit the program
                log(`Too many changes detected, exiting...`)
                process.exit(1)
                }
            })
            connection1Promise = connectEngine(network1, testEngine1Address, true)
            //console.dir(networkData, {depth: 3, colors: true})
            //log(chalk.green(deepPrint(networkData1, 4)))
            // JSON.stringify(networkData, null, 2)))
        })

        // before(async function () {
        //     // Instruct the user to boot one engine using testdisk-1
        //     this.timeout(0)
        //     await prompt(0, `Please boot the first engine using disk ${testDisk1}`)
        // })

        it('The test machine must be able to connect with it ', async function () {
            this.timeout(0)
            expect(network1).to.exist
            if (network1) expect(network1.appnet).to.exist
            if (network1 && network1.appnet) expect(network1.appnet.engines).to.exist
            expect(connection1Promise).to.exist

            // The promise must resolve to a ConnectionResult
            const connection1 = await connection1Promise
            expect(connection1).to.exist
            expect(connection1.status).to.equal('synced')
        })

        it('The connection must deliver a remote engine object within 30 secs', async function (done) {
            this.timeout(30000)
            if (!network1 || !network1.appnet) this.skip()

            // If network.engines is not empty, call done()
            if (Object.keys(network1.appnet.engines).length == 2) {
                log('There are already two objects in the engineSet')
                done()
            } else {
                // Subscribe to changes in the engineSet object 
                // NOTE: If ever remote data comes in during this test and before we subscribe, this will FAIL
                subscribe(network1.appnet.engines, (value) => {
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
                    done()
                })
            }
        })

        describe('The connection must deliver a remote engine object ', async function () {
            //await sleep(10000)
            //console.dir(networkData1, {depth: 3, colors: true})
            //log(chalk.bgBlackBright("\n" + deepPrint(networkData1, 4)))
            // We must find an Engine object in networkData1 with the same name as testEngine1
            it(`with the right name ${testEngine1Name}`, async function () {
                remoteEngine = findEngineByHostname(network1, testEngine1Name)
                log(chalk.bgBlackBright(`^^^^^^^^^^^^^Network1: ${deepPrint(network1)}`))
                expect(remoteEngine).to.exist
            })

            it(`with a version that equals the version in the test description if one is provided`, async function () {
                if (!remoteEngine || !testDisk1.version) this.skip()
                expect(remoteEngine.version).to.not.be.empty
                expect(remoteEngine.version).to.eql(testDisk1.version)
            })

            it(`with a hostOS that equals the hostOS in the test description if one is provided`, async function () {
                if (!remoteEngine || !testDisk1.hostOS) this.skip()
                expect(remoteEngine.hostOS).to.not.be.empty
                expect(remoteEngine.hostOS).to.eql(testDisk1.hostOS)
            })

            it(`with a lastBooted time that is greater than the moment of this coding`, async function () {
                if (!remoteEngine) this.skip()
                expect(remoteEngine.lastBooted).to.be.greaterThan(1716099940264) // should be bigger than the moment of this coding which is May 19, 2024
            })

            it(`with a list of restricted interfaces as described in the config`, async function () {
                if (!remoteEngine) this.skip()
                expect(remoteEngine.restrictedInterfaces).to.eql(config.settings.interfaces)
            })

            describe(`with a connected interface named ${testInterface}: `, async function () {

                it(`that exists`, async function () {
                    remoteEngine = findEngineByHostname(network1, testEngine1Name)
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
                    // The ip address must correspond to the resolution of testEngine1Address
                    expect(remoteEngine.connectedInterfaces[testInterface].ip4).to.eql(await findIp(testEngine1Address))
                })


                it(`that has a valid netmask`, async function () {
                    if (!remoteEngine) this.skip()
                    expect(remoteEngine.connectedInterfaces[testInterface].netmask).to.not.be.empty
                    expect(isNetmask(remoteEngine.connectedInterfaces[testInterface].netmask)).to.be.true
                })
            })

            describe(`with a disk called ${testDisk1.name}: `, async function () {
                it(`that exists`, async function () {
                    if (!remoteEngine) this.skip()
                    disk = remoteEngine.disks.find(disk => disk.name === testDisk1.name)
                    expect(disk).to.exist
                })

                it(`that has a device name`, async function () {
                    if (!remoteEngine || !disk) this.skip()
                    expect(disk.device).to.exist
                })

                it(`that has a creation time that is greater than the moment of this coding`, async function () {
                    if (!remoteEngine || !disk) this.skip()
                    expect(disk.created).to.be.greaterThan(1716099940264) // should be bigger than the moment of this coding which is May 19, 2024
                })

                it(`that has a lastDocked time that is greater than the moment of this coding`, async function () { 
                    if (!remoteEngine || !disk) this.skip()
                    expect(disk.lastDocked).to.be.greaterThan(1716099940264) // should be bigger than the moment of this coding which is May 19, 2024
                })

                describe(`that has the apps as described in the test setup: `, async function () {
                    it(`It must have the right amount of apps`, async function () {
                        if (!remoteEngine || !disk) this.skip()
                        expect(disk.apps).to.have.lengthOf(testDisk1.apps.length)
                    })

                    it(`Each app in the test setup must be present in the disk object`, async function () {
                        if (!remoteEngine || !disk) this.skip()
                        testDisk1.apps.forEach(app => {
                            const appInDisk = disk.apps.find(diskApp => diskApp.name === app.name)
                            expect(appInDisk).to.exist
                            expect(appInDisk).to.eql(app)
                        })
                    })

                    describe(`Each app in the test setup must have a corresponding instance in the disk object: `, async function () {
                        it(`that exists`, async function () {
                            if (!remoteEngine || !disk) this.skip()
                            testDisk1.apps.forEach(app => {
                                const instance = disk.instances.find(instance => instance.instanceOf === app.name)
                                expect(instance).to.exist
                            })
                        })

                        it(`that has a name that contains the app name`, async function () {
                            if (!remoteEngine || !disk) this.skip()
                            testDisk1.apps.forEach(app => {
                                const instance = disk.instances.find(instance => instance.instanceOf === app.name)
                                expect(instance.name).to.include(app.name)
                            })
                        })

                        it(`that has a status of running`, async function () {
                            if (!remoteEngine || !disk) this.skip()
                            testDisk1.apps.forEach(app => {
                                const instance = disk.instances.find(instance => instance.instanceOf === app.name)
                                expect(instance.status).to.eql('Running')
                            })
                        })

                        it(`that has a creation time that is greater than the moment of this coding`, async function () {
                            if (!remoteEngine || !disk) this.skip()
                            testDisk1.apps.forEach(app => {
                                const instance = disk.instances.find(instance => instance.instanceOf === app.name)
                                expect(instance.created).to.be.greaterThan(1716099940264) // should be bigger than the moment of this coding which is May 19, 2024
                            })
                        })

                        it(`that has a lastStarted time that is greater than the moment of this coding`, async function () {
                            if (!remoteEngine || !disk) this.skip()
                            testDisk1.apps.forEach(app => {
                                const instance = disk.instances.find(instance => instance.instanceOf === app.name)
                                expect(instance.lastStarted).to.be.greaterThan(1716099940264) // should be bigger than the moment of this coding which is May 19, 2024
                            })
                        })

                        it(`has a port number that is larger or equal to 3000`, async function () {
                            if (!remoteEngine || !disk) this.skip()
                            testDisk1.apps.forEach(app => {
                                const instance = disk.instances.find(instance => instance.instanceOf === app.name)
                                expect(instance.port).to.be.greaterThanOrEqual(3000)
                            })
                        })

                        it(`has a serviceImages list that is larger or equal to 1`, async function () {
                            if (!remoteEngine || !disk) this.skip()
                            testDisk1.apps.forEach(app => {
                                const instance = disk.instances.find(instance => instance.instanceOf === app.name)
                                expect(instance.serviceImages).to.have.lengthOf.at.least(1)
                            })
                        })
                    })
                })
            })
        })
    })


    // Lets keep the connection open so that we can import it in test 05
    // after(function () {
    //     // Close the network
    //     disconnectNetwork(network1, testInterface)
    // })
})
