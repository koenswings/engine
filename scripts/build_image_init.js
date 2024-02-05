#! ../../node_modules/.bin/tsx
import { $, argv, chalk, fs, question } from 'zx';
function printError(error, errorMessage) {
    //console.error(`${errorMessage}\nError: ${error}`);
    console.error(chalk.red(`${errorMessage}\nError: ${error}`));
    process.exit(1);
}
// Custom function to execute commands with error handling
async function executeWithErrorHandler(command, errorMessage) {
    try {
        await $ `${command}`;
    }
    catch (error) {
        printError(error, errorMessage);
    }
}
// Checking if an image file argument is passed
if (argv.length <= 1) {
    console.log("You must pass an image file");
    process.exit();
}
// Checking for a second argument to set 64-bit mode
let is64Bit = argv.length === 3;
// Getting the offset
const OFFSET = await executeWithErrorHandler(`fdisk -l ${argv[1]} | grep W95 | awk '/^[^ ]*1/{ print $2*512 }'`, "Failed to get disk offset");
// Creating and mounting boot directory
await executeWithErrorHandler(`mkdir -p boot`, "Failed to create boot directory");
await executeWithErrorHandler(`sudo mount -o loop,offset=${OFFSET} ${argv[1]} boot`, "Failed to mount the boot directory");
// Reading password for the 'pi' user
//   const PASSWORD = await executeWithErrorHandler(
//     question('Please enter password for pi user: ', { hideEchoBack: true }),
//     "Failed to read password for pi user"
//   );
//   console.log();
let PASSWORD = "";
try {
    PASSWORD = await question('Please enter password for pi user: ');
}
catch (error) {
    printError(error, "Failed to read password for pi user");
}
// Generating encrypted password
const PASS = await executeWithErrorHandler(`echo ${PASSWORD} | openssl passwd -6 -stdin`, "Failed to encrypt password");
// Writing to userconf.txt and copying it to the boot directory
await fs.writeFile('userconf.txt', `pi:${PASS}`);
await executeWithErrorHandler(`sudo cp userconf.txt boot/userconf.txt`, "Failed to copy userconf.txt to boot directory");
await executeWithErrorHandler(`sudo sync`, "Failed to synchronize file systems");
// Unmounting and removing the boot directory
await executeWithErrorHandler(`sudo umount boot`, "Failed to unmount the boot directory");
await executeWithErrorHandler(`rmdir boot`, "Failed to remove the boot directory");
// Exporting PASSWORD environment variable (optional, depends on your use case)
//process.env.PASSWORD = PASSWORD;
// Running the create-image script
if (is64Bit) {
    await executeWithErrorHandler(`./create-image -64 ${argv[1]}`, "Failed to execute the create-image script in 64-bit mode");
}
else {
    await executeWithErrorHandler(`./create-image ${argv[1]}`, "Failed to execute the create-image script");
}
