import { $, YAML, chalk } from "zx"
import { log } from "../utils/utils.js"

// const $$ = $({
//   verbose: false
// })

$.verbose = false

// Startup configuration
// Sample:
// startup:
//   commands:
//     - enableAppnetMonitor appnet eth0 
//     - enableAppnetMonitor appnet wlan0
// export interface Startup {
//   commands: string[]
// }

export interface Config {
  settings: Settings,
  defaults: ScriptDefaults,
  testSetup: TestSetup,
}

export interface Settings {
  mdns?: boolean, // Whether to enable mDNS
  port?: number, // The port on which the index server is running
  isDev?: boolean, // Whether this is a development environment
  storeDataFolder: string, // The path to the store database
  storeIdentityFolder: string, // The path to the store identity - This should be part of the code repository
}

// export interface AppnetConfig {
//   name: AppnetName,
//   id?: number
// }

// export type AppnetSetup = AppnetConfig[]

// export const getAppnetId = (config: Config, appnetName: AppnetName): number | undefined => {
//   // Find the id of a given appnet
//   const appnets = config.settings.appnets
//   if (appnets) {
//     const appnetConfig = appnets.find((appnet) => appnet.name === appnetName)
//     return appnetConfig ? appnetConfig.id : undefined
//   } else { return undefined }
// }

// export const setAppnetId = (config: Config, appnetName: string, id:number):void => {
//   // Find the id of a given appnet
//   const appnets = config.settings.appnets
//   if (appnets) {
//     const appnetConfig = appnets.find((appnet) => appnet.name === appnetName)
//     if (appnetConfig) {
//       appnetConfig.id = id
//     } 
//   }
// }

export interface Config {
  defaults: ScriptDefaults,
  testSetup: TestSetup,
  //appnetSetup: AppnetSetup
}

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
export interface ScriptDefaults {
  user: string,
  machine: string,
  password: string,
  engine: string,
  engineId: string,
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
  gadget: boolean,
  nodocker: boolean
  gitAccount: string
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
  diskId: string,
  engineId: string,
  engineName: string,
  apps: TestApp[],
  // Optional properties for version, hostOS
  version?: string,
  hostOS?: string
}

export interface TestApp {
  id: string,
  name: string,
  version: string,
  title: string,
  description: string,
  url: string,
  category: string,
  icon: string
}



const readConfig = async (path: string): Promise<Config> => {
  // Now read the defaults from the YAML file and verify that it has the correct type using typeof.  
  let config: Config
  try {
    await $`pwd`
    const configFile = await $`cat ${path}`
    config = YAML.parse(configFile.stdout)
    // log(chalk.green('Config read'));
    return config
  } catch (e) {
    log(chalk.red('Error reading config!!'));
    console.error(e)
    console.trace()
    process.exit(1)
  }
}

export const writeConfig = async (config: Config, path: string) => {
  try {
    await $`echo ${YAML.stringify(config)} > ${path}`
    // log(chalk.green('Config written'));
  } catch (e) {
    log(chalk.red('Error writing config'));
    console.error(e);
    process.exit(1);
  }
}

export const config = await readConfig('config.yaml')

// export const updateConfig = async (newConfig: Config) => {
//   writeConfig(newConfig, 'config.yaml')
//   config = newConfig
// }

// TODO - Implement some type checking on parsed JSON as discussed in https://dev.to/codeprototype/safely-parsing-json-to-a-typescript-interface-3lkj
// {
//   "user": "pi",
//   "machine": "raspberrypi.local",
//   "password": "raspberry",
//   "engine": "127.0.0.1",
//   "network": "appnet",
//   "language": "en_ZW.UTF-8",
//   "keyboard": "us",
//   "timezone": "Europe/Brussels",
//   "update": false,
//   "upgrade": false,
//   "hdmi": false,
//   "temperature": true,
//   "argon": true,
//   "zerotier": false,
//   "raspap": false,
//   "gadget": true,
//   "gitAccount": "koenswings"
// }