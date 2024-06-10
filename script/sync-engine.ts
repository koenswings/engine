import { $, ssh, argv, cd, chalk, fs, question } from 'zx'
import pack from '../package.json' assert { type: "json" }
import { config } from '../src/data/Config.js';
import { reset } from '../src/utils/utils.js'
import { log } from 'console';

// Add commandline option to print the version of the script
const { version } = pack
if (argv.v || argv.version) {
  console.log(`Version: ${version}`);
  process.exit(0);
}

// Add commandline option to print the help of the script
if (argv.h || argv.help) {
  console.log(`
  Usage: ./sync-engine.ts [options]
  
  Options:
    -u, --user <user>            Username to use for SSH connection
    -m, --machine <machine>      Machine to connect to
    -v, --version                Print the version
    -h, --help                   Print the help
  `);
  process.exit(0);
}

// const { defaults } = await readConfig('../config.yaml')
// log(`Config: ${JSON.stringify(config)}`)
const defaults = config.defaults

// Now override the default configuration using the command line
const user = argv.u || argv.user || defaults.user
const machine = argv.m || argv.machine || defaults.machine

const $$ = ssh(`${user}@${machine}`)

const enginePath = "/home/pi/engine"

// Sync the assets folder to the remote machine
const syncEngine = async () => {
    console.log(chalk.blue('Syncing the engine to the remote machine'));
    try {
        //await $`sshpass -p ${password} rsync -av build_image_assets/ ${user}@${machine}:~/tmp/build_image_assets`;
        await $`rsync -av --chmod=Du=rwx,Dg=rx,Do=rx,Fu=rw,Fg=r,Fo=r --perms --exclude='node_modules' --exclude='.git' --exclude='dist' --exclude='scratchpad' --exclude='.vscode' --exclude='.pnpm-store' --exclude='yjs-db' ./ ${user}@${machine}:${enginePath}`
        //await reset($$)
    } catch (e) {   
        console.log(chalk.red('Failed to sync the engine to the remote machine'));
        console.error(e);
        process.exit(1);
    }
}



await syncEngine()
