import assert, { doesNotMatch } from 'assert'
import { chalk, question, sleep } from 'zx'
import { connect } from '../src/utils/connect.js';
import { NetworkData } from '../src/data/dataTypes.js';
import { Defaults, readDefaults } from '../scratchpad/readDefaults.js';
import { deepPrint, isIP4, isNetmask, prompt } from '../src/utils/utils.js';
import { log } from 'console';
import { expect } from 'chai';
import { readConfig } from '../src/utils/readConfig.js';
import { ConnectionResult } from '../src/data/dataTypes.js';


const { testSetup } = await readConfig('config.yaml')

const testNet = testSetup.appnet
const testInterface = testSetup.interface
const testDisk1 = testSetup.testDisk1
const testEngine1 = testDisk1.name
let connection1Promise: Promise<ConnectionResult>
let networkData1: NetworkData

describe('One remote engine - ',  () => {

before(async function () {
    this.timeout(0)
    connection1Promise = connect(testNet, testEngine1, 1234)
    //console.dir(networkData, {depth: 3, colors: true})
    log(chalk.green(deepPrint(networkData1, 4)))
    // JSON.stringify(networkData, null, 2)))
})


before(async function () {
    // Instruct the user to boot one engine using testdisk-1
    this.timeout(0)
    await prompt(0, `Please boot the first engine using disk ${testDisk1}`)
})

context('After a fresh boot - ', () => {
    it('the test machine must be able to connect with the remote engine ', async () => {
        expect(connection1Promise).to.exist
        // The promise must resolve to a ConnectionResult
        const connection1 = await connection1Promise
        expect(connection1).to.exist
        expect(connection1.status).to.equal('connected')
        networkData1 = connection1.networkData
        expect(networkData1).to.exist
    })

    it('the connection must sync within 5 secs and deliver data for the remote machine', async () => {
        await sleep(5)
        // We must find an Engine object in networkData1 with the same name as testEngine1
        const remoteEngine = networkData1.engines.find(eng => eng.hostName === testEngine1)
        expect(remoteEngine).to.exist
    })

    it(`the data for the remote engine must have the right properties`, async function () {
        const remoteEngine = networkData1.engines.find(eng => eng.hostName === testEngine1)
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