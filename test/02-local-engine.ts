import { NetworkData, Engine, Disk, App } from '../src/data/dataTypes.js';
import { deepPrint, isIP4, isNetmask, prompt } from '../src/utils/utils.js';
import { getEngine, getNetwork, getNetworks } from '../src/data/store.js';
import { log } from 'console';
import { readConfig } from '../src/utils/readConfig.js';
//import { expect } from 'chai';
const { expect } = await import('chai')

const { testSetup } = await readConfig('config.yaml')
const testNet = testSetup.appnet
const testInterface = testSetup.interface



describe('The local engine - ', async function () {

  it(`must have a Network object with the name ${testNet}`, async function () {
    const appnet = getNetwork(testNet)
    expect(appnet).to.exist
  })

  it(`must have a local Engine object`, async function () {
    const engine = getEngine()
    expect(engine).to.exist
  })

  it(`the local Engine object must be part of the Engine array in the NetworkData object of the Network`, async function () {
    const appnet = getNetwork(testNet)
    const engine = getEngine()
    expect(appnet.data.engines).to.include(engine)
  })

  it(`the local Engine object must have the right properties`, async function () {
    const engine = getEngine()
    // The local engine can be on any third machine so we cannot know the values, only that they should not be empty
    expect(engine.hostName).to.not.be.empty
    expect(engine.version).to.not.be.empty
    expect(engine.hostOS).to.not.be.empty
    expect(engine.lastBooted).to.be.greaterThan(1716099940264) // should be bigger than the moment of this coding which is May 19, 2024
    // It must have an interface corresponding to the testInterface
    expect(engine.interfaces).to.have.property(testInterface)
    // That interface must have a name that corresponds to testInterface
    expect(engine.interfaces[testInterface].name).to.eql(testInterface)
    // That interface must have a valid ip address and netmask
    expect(engine.interfaces[testInterface].ip4).to.not.be.empty
    expect(isIP4(engine.interfaces[testInterface].ip4)).to.be.true
    expect(engine.interfaces[testInterface].netmask).to.not.be.empty
    expect(isNetmask(engine.interfaces[testInterface].netmask)).to.be.true
  }) 
}) // Local Engine Tests



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
