import { chalk, question, sleep } from 'zx'
import { NetworkData, ConnectionResult, Network, createNetwork, connectNetwork } from '../src/data/Network.js';
import { deepPrint, isIP4, isNetmask, prompt } from '../src/utils/utils.js';
import { log } from 'console';
import { expect } from 'chai';
import { readConfig } from '../src/utils/readConfig.js';


const { testSetup } = await readConfig('config.yaml')

const testNet = testSetup.appnet
const testInterface = testSetup.interface
const testDisk1 = testSetup.testDisk1
const testEngine1Name = testDisk1.name
const testEngine1Address = testDisk1.name+".local"


let network1: Network 
let networkData1: NetworkData 
let connection1Promise: Promise<ConnectionResult>



describe('One remote engine - ',  () => {

before(async function () {
    network1 = createNetwork(testNet)
    networkData1 = network1.data
    connection1Promise = connectNetwork(network1, testEngine1Address, testInterface)
    //console.dir(networkData, {depth: 3, colors: true})
    //log(chalk.green(deepPrint(networkData1, 4)))
    // JSON.stringify(networkData, null, 2)))
})


before(async function () {
    // Instruct the user to boot one engine using testdisk-1
    this.timeout(0)
    await prompt(0, `Please boot the first engine using disk ${testDisk1}`)
})

context('After a fresh boot - ', () => {
    it('the test machine must be able to connect with the remote engine ', async function () {
        this.timeout(0)
        expect(network1).to.exist
        expect(networkData1).to.exist
        expect(connection1Promise).to.exist
        // The promise must resolve to a ConnectionResult
        const connection1 = await connection1Promise
        expect(connection1).to.exist
        expect(connection1.status).to.equal('connected')
    })

    it('the connection must sync within 5 secs and deliver data for the remote machine', async function () {
        this.timeout(0)
        await sleep(7000)
        //console.dir(networkData1, {depth: 3, colors: true})
        log(chalk.green(deepPrint(networkData1, 4)))
        // We must find an Engine object in networkData1 with the same name as testEngine1
        const remoteEngine = networkData1.engines.find(eng => eng.hostName === testEngine1Name)
        expect(remoteEngine).to.exist
    })

    it(`the data for the remote engine must have the right properties`, async function () {
        const remoteEngine = networkData1.engines.find(eng => eng.hostName === testEngine1Name)
        expect(remoteEngine.version).to.not.be.empty
        expect(remoteEngine.hostOS).to.not.be.empty
        expect(remoteEngine.lastBooted).to.be.greaterThan(1716099940264) // should be bigger than the moment of this coding which is May 19, 2024
        // It must have an interface corresponding to the testInterface
        expect(remoteEngine.interfaces).to.have.property(testInterface)
        // That interface must have a name that corresponds to testInterface
        expect(remoteEngine.interfaces[testInterface].name).to.eql(testInterface)
        // That interface must have a valid ip address and netmask
        expect(remoteEngine.interfaces[testInterface].ip4).to.not.be.empty
        expect(isIP4(remoteEngine.interfaces[testInterface].ip4)).to.be.true
        expect(remoteEngine.interfaces[testInterface].netmask).to.not.be.empty
        expect(isNetmask(remoteEngine.interfaces[testInterface].netmask)).to.be.true
    }) 
})
}) // Single Remote Engine Tests