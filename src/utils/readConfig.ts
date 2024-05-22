import { $, YAML, chalk } from "zx"

// ********************************************************************************************************************
// Read the defaults from the YAML file and override the default configuration using the command line
// ********************************************************************************************************************

// This is the list of configuration parameters for this script
// - the remote host to connect to
// - the user to use to connect to the remote host
// - the password to use to connect to the remote host
// - the hostname to set on the remote host
// - the language to set on the remote host
// - the keyboard layout to set on the remote host
// - the timezone to set on the remote host
// - wether to upadate the system
// - wether to upgrade the system 
// - whether to switch off HDMI power
// - wether to install temperature measurement
// - whether to install the Argon fan script
// - wether to install Zerotier
// - wether to install RaspAP
// The parameters must be read from the command line
// The defaults for these parameters (in case no value is provided on the commandline) must be read from a YAML file

// Please provide a sample YAML file here in comments
// user: pi
// machine: raspberrypi.local
// password: raspberry
// hostname: raspberrypi
// language: en_GB.UTF-8
// keyboard: us
// timezone: Europe/Brussels
// update: true
// upgrade: true
// hdmi: false
// temperature: true
// argon: true
// zerotier: true
// raspap: true

// Please define a TypeScript type for the object read from the YAML file
export interface Defaults {
    user: string,
    machine: string,
    password: string,
    engine: string,
    network: string,
    language: string,
    keyboard: string,
    timezone: string,
    update: boolean,
    upgrade: boolean,
    hdmi: boolean,
    temperature: boolean,
    argon: boolean,
    zerotier: boolean,
    raspap: boolean,
    gadget: boolean
}

// Test Setup
// Sample:
  // appnet: appnet
  // interface: eth0
  // testDisk1: 
  //   - name: loving-jennings.local
  //   - apps:
  //     - name: kolibri
  //       version: 1.0-0.15.5-dev
  //       title: Kolibri
  //       description: |
  //         Kolibri is an adaptable set of open solutions specially developed to support learning for the half of the world without Internet access. 
  //         Centered around an offline-first learning platform that runs on a variety of low-cost and legacy devices, the Kolibri Product Ecosystem includes a curricular tool, a library of open educational resources, and a toolkit of resources to support training and implementation in formal, informal, and non-formal learning environments.
  //       url: https://learningequality.org/kolibri/
  //       category: education
  //       icon: icon.png
  //       author: Koen Swings
  // testDisk2: 
  //   - name: bold-banzai.local
  //   - apps:
  //     - name: kolibri
  //       version: 1.0-0.15.5-dev
  //       title: Kolibri
  //       description: |
  //         Kolibri is an adaptable set of open solutions specially developed to support learning for the half of the world without Internet access. 
  //         Centered around an offline-first learning platform that runs on a variety of low-cost and legacy devices, the Kolibri Product Ecosystem includes a curricular tool, a library of open educational resources, and a toolkit of resources to support training and implementation in formal, informal, and non-formal learning environments.
  //       url: https://learningequality.org/kolibri/
  //       category: education
  //       icon: icon.png
  //       author: Koen Swings
export interface TestSetup {
  appnet: string,
  interface: string,
  testDisk1: TestDisk,
  testDisk2: TestDisk
}

export interface TestDisk {
  name: string,
  apps: TestApp[]
}

export interface TestApp {
  name: string,
  version: string,
  title: string,
  description: string,
  url: string,
  category: string,
  icon: string
}


// Startup configuration
// Sample:
  // startup:
  //   commands:
  //     - enableAppnetMonitor appnet eth0 
  //     - enableAppnetMonitor appnet wlan0
export interface Startup {
  commands: string[]
}

export const readConfig = async (path: string) => {
  // Now read the defaults from the YAML file and verify that it has the correct type using typeof.  
  let defaults: Defaults
  let testSetup: TestSetup
  let startup: Startup
  try {
    await $`pwd`
    const configFile = await $`cat ${path}`
    const config = YAML.parse(configFile.stdout)
    //console.log(readDefaults)
    defaults = config.defaults as Defaults
    testSetup = config.testSetup as TestSetup
    startup = config.startup as Startup
    console.log(chalk.green('Config read'));
    return {startup: startup, defaults: defaults, testSetup: testSetup}
  } catch (e) {
    console.log(chalk.red('Error reading config!!'));
    console.error(e) 
    console.trace()
    //process.exit(1)
  }
}