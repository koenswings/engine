import { startEngine } from "../src/start.js"
import { deepPrint, prompt } from '../src/utils/utils.js';
import path from 'path';



before(async function () {
    this.timeout(0)
    console.log(`Starting engine`)
    await startEngine()
})

before(async function () {
    this.timeout(0)
    await prompt(0, 'Please create a test infrastructure corresponding to the testSetup description in config.yaml.')
})

// describe('Local engine - ', async function () {
//     this.timeout(0)
//     console.log(`Importing local-engine tests`)
//     import('./local-engine.js');
// });

// describe('One remote engine - ',  () => {
//     console.log(`Importing one-remote-engine tests`)
//     import('./single-remote-engine.js')
// });

// describe('Two remote engines - ',  () => {
//     console.log(`Importing two-remote-engines tests`)
//     import('./two-remote-engines.js')
// });