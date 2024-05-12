import { $, ssh, argv, cd, chalk, fs, question } from 'zx'
import pack from '../package.json' assert { type: "json" }
import YAML from 'yaml'

// Add commandline option to print the version of the script
const { version } = pack
if (argv.v || argv.version) {
  console.log(`Version: ${version}`);
  process.exit(0);
}

// Add commandline option to print the help of the script
if (argv.h || argv.help) {
  console.log(`
  Usage: $0 [options]
  
  Options:
    -u, --user <user>            Username to use for SSH connection
    -m, --machine <machine>      Machine to connect to
    -v, --version                Print the version
    -h, --help                   Print the help
  `);
  process.exit(0);
}

// Please define a TypeScript type for the object read from the YAML file
interface Defaults {
    user: string,
    machine: string,
    password: string,
    language: string,
    keyboard: string,
    timezone: string,
    update: boolean,
    upgrade: boolean,
    hdmi: boolean,
    temperature: boolean,
    argon: boolean,
    zerotier: boolean,
    raspap: boolean
}

// Now read the defaults from the YAML file and verify that it has the correct type using typeof.  
let defaults: Defaults
try {
  const file = fs.readFileSync('./build_image_assets/build_image_defaults.yaml', 'utf8')
  const readDefaults = YAML.parse(file)
  console.log(readDefaults)
  console.log(typeof readDefaults)
  defaults = readDefaults as Defaults
} catch (e) {
  console.log(chalk.red('Error reading defaults'));
  console.error(e);
  process.exit(1);
}
console.log(chalk.green('Defaults read'));

// Now override the default configuration using the command line
const user = argv.u || argv.user || defaults.user
const host = argv.m || argv.machine || defaults.machine
const password = argv.p || argv.password || defaults.password
const hostname = argv.h || argv.hostname 
const language = argv.l || argv.language || defaults.language
const keyboard = argv.k || argv.keyboard || defaults.keyboard
const timezone = argv.t || argv.timezone || defaults.timezone
const update = argv.update || defaults.update
const upgrade = argv.upgrade || defaults.upgrade
const hdmi = argv.hdmi || defaults.hdmi
const temperature = argv.temperature || defaults.temperature
const argon = argv.argon || defaults.argon
const zerotier = argv.zerotier || defaults.zerotier
const raspap = argv.raspap || defaults.raspap
let githubToken = ""

// // Read --user (abbrevyated as -u), --host (abbreviated as -m) and password arguments. Default to pi, raspberrypi and raspberry if not provided  
// const user = argv.u || argv.user || 'pi'
// const host = argv.m || argv.host || 'raspberrypi.local'
// const password = argv.p || argv.password || 'raspberry'

const $$ = ssh(`${user}@${host}`)

const enginePath = "/home/pi/engine"

// Sync the assets folder to the remote host
const syncEngine = async () => {
    console.log(chalk.blue('Syncing the engine to the remote host'));
    try {
        //await $`sshpass -p ${password} rsync -av build_image_assets/ ${user}@${host}:~/tmp/build_image_assets`;
        await $`rsync -av --chmod=Du=rwx,Dg=rx,Do=rx,Fu=rw,Fg=r,Fo=r --perms --exclude='node_modules' --exclude='.git' --exclude='dist' --exclude='scratchpad' --exclude='.vscode' --exclude='.pnpm-store' ../ ${user}@${host}:${enginePath}`;
    } catch (e) {   
        console.log(chalk.red('Failed to sync the engine to the remote host'));
        console.error(e);
        process.exit(1);
    }
}

await syncEngine()
