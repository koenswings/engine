import { $, ssh, argv, chalk } from 'zx';
import { config } from '../src/data/Config.js';
import pack from '../package.json' with { type: "json" };
import { is } from 'lib0/function.js';

// 1. Handle help and version flags
if (argv.h || argv.help) {
    console.log(`
  Usage: ./reset-engine [options] [engineName1] [engineName2] ...
  
  Resets the data store for one or more engines.

  Arguments:
    engineName      The logical name of the engine to reset (e.g., "engine-1"). 
                    The script will connect to "<engineName>.local".
                    If no engine names are provided, it resets the local machine.

  Options:
    -m, --reset-meta    Also delete the META.yaml file to reset the engine's identity.
    -v, --version       Print the version
    -h, --help          Print this help message
  `);
    process.exit(0);
}

if (argv.v || argv.version) {
    console.log(`Version: ${pack.version}`);
    process.exit(0);
}

// 2. Get targets and options
const targets = argv._;
const resetMetaFlag = argv.m || argv['reset-meta'];

// The actual cleanup logic, for a real engine, either local or remote
const cleanup = async (exec: any, target: string, storePath: string, metaPath: string, enginePath: string, doMetaReset: boolean) => {
    try {
        console.log(chalk.blue(`  - Stopping engine on ${target}...`));
        await exec`sudo pm2 stop engine || true`;
        console.log(chalk.blue(`  - Clearing store data at ${target}:${storePath}...`));
        await exec`sudo rm -rf ${storePath}/*`;
        if (doMetaReset) {
            console.log(chalk.yellow(`  - Clearing META file at ${target}:${metaPath}...`));
            await exec`sudo rm -f ${metaPath}`;
        }
        console.log(chalk.blue(`  - Rebuilding engine on ${target}...`));
        await exec`cd ${enginePath} && sudo pnpm build`;

        console.log(chalk.blue(`  - Flushing logs on ${target}...`));
        await exec`sudo pm2 flush engine`;
    } catch (e: any) {
        console.error(chalk.red(`Cleanup failed for ${target}: ${e.message}`));
    }
}

const cleanupDev = async (exec: any, target: string, storePath: string, doMetaReset: boolean) => {
    try {
        console.log(chalk.blue(`  - Clearing store data on the local development machine...`));
        await exec`rm -rf ${storePath}/*`;
        if (doMetaReset) {
            console.log(chalk.yellow(`  - Ignoring --reset-meta flag for local development machine.`));
        }
        console.log(chalk.blue(`  - Rebuilding engine on ${target}...`));
        await exec`pnpm build`;
    } catch (e: any) {
        console.error(chalk.red(`Cleanup failed for local development machine: ${e.message}`));
    }
}


const startRemoteEngine = async (exec: any, target: string) => {
    console.log(chalk.blue(`  - Restarting engine on ${target}...`));
    const enginePath = config.defaults.enginePath;
    await exec`cd ${enginePath} && sudo pm2 start pm2.config.cjs`;
}

const stopRemoteEngine = async (exec: any, target: string) => {
    console.log(chalk.blue(`  - Stopping engine on ${target}...`));
    await exec`sudo pm2 stop engine`;
}

// Main execution logic
const main = async () => {
    const isDev = config.settings.isDev; // Get isDev from config

    if (targets.length === 0) {
        // Local reset
        // For a local dev machine, NEVER delete the META file.
        // For a local real engine, respect the flag.
        if (isDev) {
            console.log(chalk.green('Performing reset on local development machine...'));
            await cleanupDev($, 'localhost', './store-data', resetMetaFlag);
        } else {
            console.log(chalk.green('Performing reset on local engine...'));
            const machine = 'local dev machine';
            const enginePath = config.defaults.enginePath;
            await cleanup($, machine, `${enginePath}/store-data`, '/META.yaml', enginePath, resetMetaFlag);
        }
    } else {
        // Stop all amchines first
        for (const targetName of targets) {
            const machine = `${targetName}.local`;
            console.log(chalk.green(`Stopping engine on ${machine}...`));
            const user = config.defaults.user;
            const exec = ssh(`${user}@${machine}`);
            await stopRemoteEngine(exec, machine);
        }
        // Then perform cleanup
        for (const targetName of targets) {
            const machine = `${targetName}.local`;
            console.log(chalk.green(`Performing remote reset on ${machine}...`));
            const user = config.defaults.user;
            const exec = ssh(`${user}@${machine}`);
            const enginePath = config.defaults.enginePath;
            await cleanup(exec, machine, `${enginePath}/store-data`, '/META.yaml', enginePath, resetMetaFlag);
        }
        // Finally start all machines
        for (const targetName of targets) {
            const machine = `${targetName}.local`;
            console.log(chalk.green(`Starting engine on ${machine}...`));
            const user = config.defaults.user;
            const exec = ssh(`${user}@${machine}`);
            await startRemoteEngine(exec, machine);
        }
    }
    console.log(chalk.green('\nReset script finished.'));
}

main();