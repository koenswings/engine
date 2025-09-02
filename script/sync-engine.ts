import { $, ssh, argv, cd, chalk, fs, question } from 'zx'
import pack from '../package.json' with { type: "json" }
import { config } from '../src/data/Config.js';

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
const syncEngine = async (storeDataFolder:string) => {
    try {
        //await $`sshpass -p ${password} rsync -av build_image_assets/ ${user}@${machine}:~/tmp/build_image_assets`;
        // Stop the remote engine
        //console.log(chalk.blue(`Stopping the remote engine on machine ${machine}`));
        //await $$`pm2 stop engine || true`
        // Warn the user he should stop the engine manually if it is running
        console.log(chalk.yellow(`Make sure that the engine is not running on the remote machine ${machine} before proceeding!`));

        console.log(chalk.blue(`Syncing the engine to user ${user} on remote machine ${machine}`))
        //console.log(chalk.blue(`Using command rsync -av --chmod=Du=rwx,Dg=rx,Do=rx,Fu=rw,Fg=r,Fo=r --perms --exclude='node_modules' --exclude='.git' --exclude='dist' --exclude='scratchpad' --exclude='.vscode' --exclude='.pnpm-store' --exclude='yjs-db' --exclude='${storeDataFolder}' ./ ${user}@${machine}:${enginePath}`))
        await $`rsync -av --chmod=Du=rwx,Dg=rx,Do=rx,Fu=rw,Fg=r,Fo=r --perms --exclude='node_modules' --exclude='.git' --exclude='dist' --exclude='scratchpad' --exclude='.vscode' --exclude='.pnpm-store' --exclude='yjs-db' --exclude='${storeDataFolder}' ./ ${user}@${machine}:${enginePath}`
        //await $`rsync -av --chmod=Du=rwx,Dg=rx,Do=rx,Fu=rw,Fg=r,Fo=r --perms --exclude='node_modules' --exclude='.git' --exclude='dist' --exclude='scratchpad' --exclude='.vscode' --exclude='.pnpm-store' --exclude='yjs-db' ./ ${user}@${machine}:${enginePath}`
        // Install the dependencies on the remote machine 
        //console.log(chalk.blue(`Installing dependencies on remote machine`));
        //await $$`cd ${enginePath} && pnpm install`
        // Set isDev to false in config.yaml on the remote machine
        console.log(chalk.blue(`Setting isDev to false in config.yaml on remote machine`));
        await $$`sed -i 's/isDev: true/isDev: false/' ${enginePath}/config.yaml`
        // Remove the store database on the remote machine
        const storeDataPath = "./" + storeDataFolder
        //console.log(chalk.blue(`Removing the store data folder ${storeDataPath} on remote machine`));
        //await $$`cd ${enginePath} && rm -rf ${storeDataPath}`
        console.log(chalk.green('Engine synced successfully'))
        // Now pnpm build and pm2 start engine 
        //await $$`cd ${enginePath} && pnpm build`
        //await $$`cd ${enginePath} && pm2 start engine`

    } catch (e) {   
        console.log(chalk.red('Failed to sync the engine to the remote machine'));
        console.error(e);
        process.exit(1);
    }
}


const storeDataFolder = config.settings.storeDataFolder
await syncEngine(storeDataFolder)
