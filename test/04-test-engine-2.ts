import { $, chalk, question, sleep } from 'zx'
import { NetworkData, ConnectionResult, Network, createNetwork, connectNetwork } from '../src/data/Network.js';
import { deepPrint, findIp, isIP4, isNetmask, prompt } from '../src/utils/utils.js';
import { log } from 'console';
import { expect } from 'chai';
import { readConfig } from '../src/data/Config.js';
import { findNetworkByName, getLocalEngine } from '../src/data/Store.js';
import { subscribe } from 'valtio';


const { testSetup } = await readConfig('config.yaml')

const testNet = testSetup.appnet
const testInterface = testSetup.interface
const testDisk2 = testSetup.testDisk2
const testEngine2Name = testDisk2.name
const testEngine2Address = testDisk2.name + ".local"


export let network2: Network
let networkData2: NetworkData
let connection2Promise: Promise<ConnectionResult>



describe('Test engine 2 - ', () => {

    before(async function () {
        network2 = createNetwork(testNet)
        networkData2 = network2.data
        // Subscribe to changes in the networkData1 object and log them
        // Also protect against too many changes which would overflow stdout
        subscribe(networkData2, (value) => {
            log(chalk.bgBlackBright("\n" + `Test engine 1 monitor: Network data was modified as follows: ${deepPrint(value)}`))
            //log(`NETWORKDATA GLOBAL MONITOR for Network ${networkName}: ${value.length} changes`)
            if (value.length > 10) {
                // exit the program
                log(`Too many changes detected, exiting...`)
                process.exit(1)
            }
        })
        connection2Promise = connectNetwork(network2, testEngine2Address, testInterface, false)
        //console.dir(networkData, {depth: 3, colors: true})
        //log(chalk.green(deepPrint(networkData1, 4)))
        // JSON.stringify(networkData, null, 2)))
    })


    before(async function () {
        // Instruct the user to boot one engine using testdisk-1
        this.timeout(0)
        await prompt(0, `Please boot the first engine using disk ${testDisk2}`)
    })


    it('the test machine must be able to connect with it ', async function () {
        this.timeout(0)
        expect(network2).to.exist
        expect(networkData2).to.exist
        expect(connection2Promise).to.exist

        // The promise must resolve to a ConnectionResult
        const connection2 = await connection2Promise
        expect(connection2).to.exist
        expect(connection2.status).to.equal('connected')
    })

    it('the connection must sync within 30 secs and deliver data for the remote engine', async function (done) {
        this.timeout(30000)

        // If networkdata1.engines is not empty, call done()
        if (networkData2.length !== 0) {
            done()
        } else {
            // Subscribe to changes in the networkData1 object 
            // NOTE: If ever remote data comes in during this test and before we subscribe, this will FAIL
            subscribe(networkData2, (value) => {
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
                const engine = value.find((el) => el[0] === 'set' && el[1][0] === 'engines')
                // log the engine we found
                log(chalk.bgBlackBright("\n" + `New engine found: ${deepPrint(engine)}`))
                done()
            })
        }
    })

    it('the connection must deliver data for the remote engine', async function () {
        //await sleep(10000)
        //console.dir(networkData1, {depth: 3, colors: true})
        log(chalk.bgBlackBright("\n" + deepPrint(networkData2, 4)))
        // We must find an Engine object in networkData1 with the same name as testEngine1
        const remoteEngine = networkData2.find(eng => eng.hostName === testEngine2Name)
        expect(remoteEngine).to.exist
    })

    it(`the data for the remote engine must have the right properties`, async function () {
        this.timeout(0)
        const remoteEngine = networkData2.find(eng => eng.hostName === testEngine2Name)
        expect(remoteEngine.version).to.not.be.empty
        if (testDisk2.version) {
            expect(remoteEngine.version).to.eql(testDisk2.version)
        }
        expect(remoteEngine.hostOS).to.not.be.empty
        if (testDisk2.hostOS) {
            expect(remoteEngine.hostOS).to.eql(testDisk2.hostOS)
        }        
        expect(remoteEngine.lastBooted).to.be.greaterThan(1716099940264) // should be bigger than the moment of this coding which is May 19, 2024
        // It must have an interface corresponding to the testInterface
        expect(remoteEngine.interfaces).to.have.property(testInterface)
        // That interface must have a name that corresponds to testInterface
        expect(remoteEngine.interfaces[testInterface].name).to.eql(testInterface)
        // That interface must have a valid ip address and netmask
        expect(remoteEngine.interfaces[testInterface].ip4).to.not.be.empty
        expect(isIP4(remoteEngine.interfaces[testInterface].ip4)).to.be.true
        // The ip address must correspond to the resolution of testEngine2Address
        expect(remoteEngine.interfaces[testInterface].ip4).to.eql(findIp(testEngine2Address))
        expect(remoteEngine.interfaces[testInterface].netmask).to.not.be.empty
        expect(isNetmask(remoteEngine.interfaces[testInterface].netmask)).to.be.true
    })

    // Lets keep the connection open so that we can import it in test 05
    // after(function () {
    //     // Close the network
    //     disconnectNetwork(network1, testInterface)
    // })
})
