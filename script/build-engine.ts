import { $, ssh, argv, chalk, fs, question } from 'zx';

$.verbose = false;
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import pack from '../package.json' with { type: "json" };
import { generateHostName } from '../src/utils/nameGenerator.js';
import { config } from '../src/data/Config.js';
import { buildEngine, setHostname, addMeta, syncEngine } from '../src/data/Engine.js';

const defaults = config.defaults;



// Main execution logic
const main = async () => {
    // Command line argument parsing
    const user = argv.u || argv.user || defaults.user;
    const machine = argv.m || argv.machine || defaults.machine;
    const hostname = argv.hostname || generateHostName();
    const { version } = pack;

    // Help and version flags
    if (argv.v || argv.version) {
        console.log(`Version: ${version}`);
        process.exit(0);
    }
    if (argv.h || argv.help) {
        console.log(`Builds and provisions a new Raspberry Pi Engine.`)
        console.log(`Usage: ./script/build-engine [options]`)
        // You can add more detailed help text here if needed
        process.exit(0);
    }

    // Mode detection
    let exec: any;
    let enginePath: string;
    const isLocalMode = !argv.machine;

    if (isLocalMode) {
        console.log(chalk.green('Running in Local (Bootstrap) Mode...'));
        exec = $;
        const __filename = fileURLToPath(import.meta.url);
        enginePath = dirname(dirname(__filename)); // Resolves to the project root
    } else {
        console.log(chalk.green(`Running in Remote Mode for ${machine}...`));
        exec = ssh(`${user}@${machine}`);
        enginePath = "/home/pi/engine";
    }

    // Assemble arguments for the core buildEngine function
    const buildArgs = {
        exec,
        enginePath,
        isLocalMode,
        user,
        machine,
        hostname,
        language: argv.l || argv.language || defaults.language,
        keyboard: argv.k || argv.keyboard || defaults.keyboard,
        timezone: argv.t || argv.timezone || defaults.timezone,
        upgrade: argv.upgrade || defaults.upgrade,
        argon: argv.argon || defaults.argon,
        zerotier: argv.zerotier || defaults.zerotier,
        raspap: argv.raspap || defaults.raspap,
        gadget: argv.gadget || defaults.gadget,
        temperature: argv.temperature || defaults.temperature,
        version: version,
        productionMode: argv.prod || false,
    };

    // Execute the appropriate function based on flags
    if (argv.personalize) {
        await setHostname(exec, hostname);
        await addMeta(exec, hostname, version);
    } else {
        if (!isLocalMode) {
            await syncEngine(user, machine);
        }
        await buildEngine(buildArgs);
    }
    
    console.log(chalk.green(`Script completed successfully.`));
    process.exit(0);
}

await main();
