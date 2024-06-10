import { $, chalk, question, sleep } from 'zx'
import { NetworkData, ConnectionResult, Network, createNetwork, connectEngine } from '../src/data/Network.js';
import { deepPrint, findIp, isIP4, isNetmask, prompt } from '../src/utils/utils.js';
import { log } from 'console';
import { expect } from 'chai';
import { readConfig } from '../src/data/Config.js';
import { findNetworkByName, getLocalEngine } from '../src/data/Store.js';


const { testSetup } = await readConfig('config.yaml')

const testNet = testSetup.appnet
const testInterface = testSetup.interface

const testDisk1 = testSetup.testDisk1
const testEngine1Name = testDisk1.name
const testEngine1Address = testDisk1.name + ".local"

const testDisk2 = testSetup.testDisk2
const testEngine2Name = testDisk2.name
const testEngine2Address = testDisk2.name + ".local"

import { network1 } from './03-test-engine-1.js'
import { network2 } from './04-test-engine-2.js'
let networkData1 
let networkData2 


describe('Two remote engines - ', () => {

    before(function () {
        // Networks should have their network data by now
        networkData1 = network1.data
        networkData2 = network2.data
    })

    it(`test engine 1 must appear in the network data of test engine 2`, async function () {
        const remoteEngine1 = networkData2.find(eng => eng.hostName === testEngine1Name)
        expect(remoteEngine1).to.exist
    })

    it(`test engine 2 must appear in the network data of test engine 1`, async function () {
        const remoteEngine2 = networkData1.find(eng => eng.hostName === testEngine2Name)
        expect(remoteEngine2).to.exist
    })

    it(`the two network data objects should be deeply equal`, async function () {
        expect(networkData1).to.deep.equal(networkData2)
    })

    // These tests can not run if we allow the test master to be a non-priviliged engine - these are on an isolated network and can not detect other engines
    // it('the test machine must have auto-detected the remote engine using mDNS', async function () {
    //     // This means that our local network has the engine
    //     const appnet = findNetworkByName(testNet)
    //     const engine = getLocalEngine()
    //     // appnet.data.engines must contain - besides the local engine - an object with the same name as testEngine1
    //     expect(appnet.data).to.have.lengthOf(2)
    //     const remoteEngine = appnet.data.find(eng => eng.hostName === testEngine1Name)
    //     expect(remoteEngine).to.exist
    // })

    // it('the auto-detected remote engine must have the right properties', async function () {
    //     const appnet = findNetworkByName(testNet)
    //     const remoteEngine = appnet.data.find(eng => eng.hostName === testEngine1Name)
    //     // We can find the required values in testDisk1 if they are defined there  Otherwise, we just expect them to be non-empty
    //     expect(remoteEngine.version).to.not.be.empty
    //     if (testDisk1.version) {
    //         expect(remoteEngine.version).to.eql(testDisk1.version)
    //     }
    //     expect(remoteEngine.hostOS).to.not.be.empty
    //     if (testDisk1.hostOS) {
    //         expect(remoteEngine.hostOS).to.eql(testDisk1.hostOS)
    //     }
    //     expect(remoteEngine.lastBooted).to.be.greaterThan(1716099940264) // should be bigger than the moment of this coding which is May 19, 2024
    //     expect(remoteEngine.interfaces).to.have.property(testInterface)
    //     expect(remoteEngine.interfaces[testInterface].name).to.eql(testInterface)
    //     expect(remoteEngine.interfaces[testInterface].ip4).to.not.be.empty
    //     expect(isIP4(remoteEngine.interfaces[testInterface].ip4)).to.be.true
    //     // The ip address must correspond to the resolution of testEngine1Address
    //     expect(remoteEngine.interfaces[testInterface].ip4).to.eql(findIp(testEngine1Address))
    //     expect(remoteEngine.interfaces[testInterface].netmask).to.not.be.empty
    //     expect(isNetmask(remoteEngine.interfaces[testInterface].netmask)).to.be.true
    // })

    after(function () {
        // Close the network
        // disconnectNetwork(network1, testInterface)
        // disconnectNetwork(network2, testInterface)
    })

})
