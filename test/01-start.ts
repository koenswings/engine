import { log } from "console";
import { startEngine } from "../src/start.js"
import { deepPrint, prompt } from '../src/utils/utils.js';
import path from 'path';
import { chalk } from "zx";

before(async function () {
    this.timeout(0)
    const disableMDNS = true
    await startEngine(disableMDNS)
})

before(async function () {
    this.timeout(0)
    //await prompt(0, 'Please create a test infrastructure corresponding to the testSetup description in config.yaml.')
    log(chalk.bgBlackBright(`Please create a test infrastructure corresponding to the testSetup description in config.yaml. Make sure that the test master is on a net called appnet. Make sure that all test engines are on the test net.  `))
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