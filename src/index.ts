import { log } from './utils/utils.js';
import { startEngine } from "./start.js";
import { chalk } from "zx";

const main = async () => {
    try {
        await startEngine();
        log('++++++++++++++++++++++++++++++++++', 1);
        log('+++++++++ Engine started +++++++++', 1);
        log('++++++++++++++++++++++++++++++++++', 1);        
    } catch (error) {
        log(chalk.red('Error starting engine'));
        console.error(error);
        process.exit(1); // Exit with an error code if startup fails
    }

    // Keep the process alive indefinitely so background services can run
    await new Promise(() => {});
};

main();