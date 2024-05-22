#! ../../node_modules/.bin/tsx

import { strict as assert } from 'assert';
import { $, argv, chalk, cd } from 'zx'
import pack from '../package.json' assert { type: "json" }
import path from 'path'

// Define the defaults for the registry, the registry user and the git account
const defaultGitAccount = "koenswings"

// Configure zx
//$.verbose = false;

// Check for the help flag and print usage if help is requested
if (argv.h || argv.help) {
  console.log(`Builds an instance of an app in the specified folder.`)
  console.log(`Usage: build_app_instance.ts [options] <app>` )
  console.log(`with ` )
  console.log(`  <app> = <appName> | <gitAccount>/<appName>`)
  console.log(`  <gitAccount> is the name of the account on github that contains the app`)
  console.log(`  <appName> is the name of the repository on github that contains the app`)
  console.log(`Options:`)
  console.log(`  -h, --help           display help for command`)  
  console.log(`  --version            output the version number`)
  console.log(`  --instance <string>  the name of the instance (default: <appName>)`)
  console.log(`  --folder <string>    the folder in which the instance will be created (default: the current folder)`)
  console.log(`  --git <string>       the git account to pull the service from (default: ${defaultGitAccount})`)
  console.log(`  --tag <string>       the git tag to pull the service from (default: main)`)
  console.log(``)
  process.exit(0)
}

// Check for the version flag and print the version if requested
if (argv.v || argv.version) {
  console.log(`Version: ${pack.version}`)
  process.exit(0)
}


// Check app argument
const apps = argv._
// if (apps.length == 0) {
//   exitWithError("Error: You must specify one app");
// }
assert(apps.length == 1, "Error: You must specify the app that you want to create an instance of")
const app = apps[0]

// Check name argument
let name = argv.instance
if (name == undefined) {
  name = app
}

// Check git account argument
let gitAccount = argv.git
if (gitAccount == undefined) {
  gitAccount = defaultGitAccount
}

// Check git tag argument
let gitTag = argv.tag
if (gitTag == undefined) {
  gitTag = "main"
}

// Check disk argument
let folder = argv.folder
if (folder == undefined) {
  folder = "."
}

console.log(`Building an instance of ${app} named ${name}`)

// Parse the app name and extract the git account and the app name
const appSplit = app.split("/")
let appName
if (appSplit.length == 1) {
  appName = appSplit[0]
  gitAccount = defaultGitAccount
} else if (appSplit.length == 2) {
  [gitAccount, appName] = appSplit
} else {
  exitWithError(`Error: App name must be in the form <appName> or <gitAccount>/<appName>`)
} 

// Parse the disk folder
try {
  const parsedDisk = path.parse(folder)
} catch (error) {
  exitWithError(`Error when parsing ${folder}\n${error.message}`);
}

try {
   // Check the app name
   checkServiceName(app)

  // Change directory to the app folder
  cd(`${folder}`)

  // Clone the App repository
  await $`git clone -b ${gitTag} https://github.com/${gitAccount}/${app}.git`

  // Create an instance of the compose template file of the app passing the name of the instance
  




  // Execute the docker command to build the service
  //await $`sudo docker build --platform linux/arm64 -t ${user}/${service} .`

  // Execute the docker command to push the service
  //await $`sudo docker push ${user}/${service}`

} catch (error) {
  exitWithError(`Error when building ${app}\n${error.message}`);
}

// Log into your favorite registry
// try {
//   // await $`sudo docker login --username ${user} ${registry}`
//   await $`sudo docker login ${registry}`
// } catch (error) {
//     exitWithError(`\nError when logging into ${registry} as user ${user}\n${error.message}`);
//   } 





function checkServiceName(service) {
  const serviceSplit = service.split(":")
  assert(serviceSplit.length == 2, `Error: Service name must be in the form <service>:<tag>`)
  //const serviceName = serviceSplit[0]
  const serviceTag = serviceSplit[1]
  const serviceTagSplit = serviceTag.split("-")
  assert(serviceTagSplit.length >= 2, `Error: Service tag must be in the form <appVersion>-<offwebVersion>`)
  const [offwebVersion] = serviceTagSplit.slice(-1)
  const offwebVersionSplit = offwebVersion.split(".")
  assert(offwebVersionSplit.length == 2, `Error: Offweb version must be in the form <major>.<minor>`)
}


function exitWithError(errorMessage) {
    console.error(chalk.red(errorMessage));
    process.exit(1);
  }

// void (async function () {
//     const { $ } = await import('zx')
//     await $`ls`;
//   })();
