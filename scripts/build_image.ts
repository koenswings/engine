import { $, argv, cd, chalk, fs, question } from 'zx';
import pack from '../package.json' assert { type: "json" };


function printError(error, errorMessage) {
    //console.error(`${errorMessage}\nError: ${error}`);
    console.error(chalk.red(`${errorMessage}\nError: ${error}`));
    process.exit(1);
}

// Custom function to execute commands with error handling
async function executeWithErrorHandler(commandMessage, command, errorMessage) {
    try {
        console.log(commandMessage)
        console.log(command)
        // See https://github.com/google/zx/issues/164 for some explanation of the following line
        // let res = await $`${command}`;
        // await $([command])
        //await $(command.split(" "))
        await $`${command.split(" ")}`
    } catch (error) {
        printError(error, errorMessage)
    }
}

// Some tests
// await $`cat ../package.json | grep name`

// let branch = await $`git branch --show-current`
// console.log(branch.stdout)

// let listls = await $`ls -l`
// console.log(listls.stdout)


// const argls = ["-l"]
// let ls2 = await $`ls -l`
// console.log(ls2.stdout)

// // Test the executeWithErrorHandler function with a simple command
// await executeWithErrorHandler(
//     `Testing the executeWithErrorHandler function with a simple command`,
//     `ls -l`,
//     "Failed to execute the command"
// );

// Check for the help flag and print usage if help is requested
if (argv.h || argv.help) {
    console.log(`Builds the boot image for a Raspberry Pi.`)
    console.log(`Usage: build_image.ts [options]`)
    console.log(`Options:`)
    console.log(`  -h, --help               display help for command`)
    console.log(`  -d, --date <string>      the date of the image to download (default: 2023-05-03)`)
    console.log(`  -n, --nickname <string>  the nickname of the image to download (default: bullseye)`)
    console.log(`  -m --machine <string>    the remote machine to build the image on (default: local machine)`)
    console.log(`  -u, --user <string>      the user account on the remote machine (default: current user)`)
    console.log(`  -f, --force              force downloading the image`)
    console.log(`  -v, --version            output the version number`)
    console.log(``)
    process.exit(0)
}

// Check for the version flag and print the version if requested
if (argv.v || argv.version) {
    console.log(`Version: ${pack.version}`)
    process.exit(0)
  }


// Cd into the build_image_assets folder
// TODO - We need to make our scripts more robust by using absolute paths
cd("build_image_assets")


// Given the following info
// - All 64bit images of Raspios Lite are in `https://downloads.raspberrypi.com/raspios_lite_arm64/images` 
// - Each image is in a folder called `raspios_lite_arm64-${DATE}`
// - Each image is named `${DATE}-raspios-${NICKNAME}-arm64-lite.img.xz`
// Write code that will download the image that is specified by the user using the commandline arguments --date and --nickname
// For example, if the user runs `ts-node scripts/build_image.ts --date 2021-05-28 --nackname bookworm` then the script should download the image `2021-05-28-raspios-bookworm-arm64-lite.img.xz`
// If no --date and --nickname are passed, then the script should download the image with date `2023-05-03` and nickname `bullseye`
// If the image is already downloaded, then the script should not download it again

// Check if --date and --nickname are passed
// Allow these arguments to be abbreviated as -d and -n
// Please make sure that they are both speicified or none of them
// If not specified, set them to default values
// If specified, set them to the values passed by the user
// Make use of the fact that the && operator returns the value of the last operand if they are all truthy
// Make use of the fact that the || operator returns the value of the first operand that is truthy
const date = argv.nickname && argv.date || argv.n && argv.d || "2023-05-03"
const nickname = argv.date && argv.nickname || argv.d && argv.n || "bullseye"

// Check if the date is in the form YYYY-MM-DD
// If not, print an error message and exit
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    console.log("The date must be in the form YYYY-MM-DD")
    process.exit()
}

// Check if the nickname is a single word
// If not, print an error message and exit
if (nickname.split(" ").length > 1) {
    console.log("The nickname must be a single word")
    process.exit()
}

// Check if the nickname is in the list of nicknames
// If not, print an error message and exit
const nicknames = ["bullseye", "bookworm", "buster", "stretch", "jessie", "wheezy", "squeeze", "lenny", "etch", "sarge", "woody", "potato", "slink", "hamm", "bo", "rex"]   
if (!nicknames.includes(nickname)) {
    console.log(`The nickname must be one of ${nicknames}`)
    process.exit()
}


// Create the name of the image and a download url using the date and nickname
const image = `${date}-raspios-${nickname}-arm64-lite.img.xz`
const uncompressedImage = `${date}-raspios-${nickname}-arm64-lite.img`
const url = `https://downloads.raspberrypi.com/raspios_lite_arm64/images/raspios_lite_arm64-${date}/${image}`

// Check if the file image.img exists and if not - or if the -f force command is given - download it and uncompress it
if (!fs.existsSync(uncompressedImage) && !argv.f) {
    // Download it
    await executeWithErrorHandler(
        `Downloading the Raspberry Pi base image from ${url}`,
        `wget ${url}`,
        "Failed to download image"
    );
    // Uncompressing image
    await executeWithErrorHandler(
        `Uncompressing the image`,
        `unxz ${image}`,
        "Failed to uncompress image"
    );
}



// Move both images to the assets folder
// await executeWithErrorHandler(
//     `Moving both images to the assets folder`,
//     `mv ${image} ${uncompressedImage} assets`,
//     "Failed to move both images to the assets folder"
// );


// Now check if a remote machine is specified using the commandline argument --user and --machine
// Allow these arguments to be abbreviated as -u and -m
const user = argv.user || argv.u
const machine = argv.machine || argv.m

// If both a user and a machine are specified, then you have to do three things
// 1. Sync the assets folder to the remote machine
// 2. Run the create_image.sh script on the remote machine
// 3. Copy the image from the remote machine to the local machine
// If no remote machine is specified, then you only have to run the create_image.sh script on the local machine
// Do it
if (user && machine) {
    //const PASSWORD = await question("Enter the password for the remote machine: ")
    const PASSWORD = "L3qdnxg666!"

    await executeWithErrorHandler(
        `Syncing the build_image_assets folder to the remote machine`,
        //`rsync -avz -e "ssh -o StrictHostKeyChecking=no" . ${user}@${machine}:~/tmp/build_image_assets`,
        `sshpass -p ${PASSWORD} rsync -av . ${user}@${machine}:~/tmp/build_image_assets`,
        "Failed to sync the build_image_assets folder to the remote machine"
    );

    // Make the create_image.sh script executable
    // await executeWithErrorHandler(
    //     `Making the create_image script executable`,
    //     `ssh -o StrictHostKeyChecking=no ${user}@${machine} 'chmod +x ~/tmp/build_image_assets/create_image'`,
    //     "Failed to make the create_image script executable"
    // );
    //await $`ssh -o StrictHostKeyChecking=no ${user}@${machine} 'chmod +x ~/tmp/build_image_assets/create_image'`

    // await executeWithErrorHandler(
    //     `Running the create_image.sh script on the remote machine`,
    //     //`ssh -o StrictHostKeyChecking=no ${user}@${machine} 'bash -s' < ~/tmp/build_image_assets/create_image.sh ~/tmp/build_image_assets/${uncompressedImage}`,
    //     `ssh -o StrictHostKeyChecking=no ${user}@${machine} ~/tmp/build_image_assets/create_image.sh ~/tmp/build_image_assets/${uncompressedImage}`,
    //     "Failed to run the create_image.sh script on the remote machine"
    // );
    await $`sshpass -p ${PASSWORD} ssh -o StrictHostKeyChecking=no ${user}@${machine} "cd ./tmp/build_image_assets; ./create_image ${uncompressedImage}"`

    await executeWithErrorHandler(
        `Copying the image from the remote machine to the local machine`,
        //`rsync -avz -e "ssh -o StrictHostKeyChecking=no" ${user}@${machine}:~/tmp/build_image_assets/${uncompressedImage} .`,
        `rsync -av ${user}@${machine}:~/tmp/build_image_assets/${uncompressedImage} .`,
        "Failed to copy the image from the remote machine to the local machine"
    );
} else {
    await executeWithErrorHandler(
        `Running the create_image.sh script on the local machine`,
        `./create_image ${uncompressedImage}`,
        "Failed to run the create_image.sh script on the local machine"
    );
    // try {
    //     console.log("Running the create_image.sh script on the local machine")
    //     await $`./create_image ${uncompressedImage}`
    // } catch (error) {
    //     printError(error, "Failed to run the create_image.sh script on the local machine")
    // }
}

// if (user && machine) {
//     // Sync the assets folder to the remote machine
//     await executeWithErrorHandler(
//         `Syncing the assets folder to the remote machine`,
//         `rsync -avz -e "ssh -o StrictHostKeyChecking=no" assets ${user}@${machine}:~/assets`,
//         "Failed to sync assets folder to the remote machine"
//     );

//     // Run the create_image.sh script on the remote machine
//     await executeWithErrorHandler(
//         `Running the create_image.sh script on the remote machine`,
//         `sshpass -p ${PASSWORD} ssh -o StrictHostKeyChecking=no 
//         ${user}@${machine} 'bash -s' < scripts/create_image.sh ${argv[1]} ${is64Bit ? "64" : "32"}`, // 2>&1
//         "Failed to create image"
//     );

//     // Copy the image from the remote machine to the local machine
//     await executeWithErrorHandler(
//         `Copying the image from the remote machine to the local machine`,
//         `rsync -avz -e "ssh -o StrictHostKeyChecking=no" ${user}@${machine}:~/image.img .`,
//         "Failed to copy the image from the remote machine to the local machine"
//     );
// }


// I want to connect to a remote machine that will build the image for me
// First I would like to sync all the content of the assets subfolder to the remote machine using the following command
// rsync -avz -e "ssh -o StrictHostKeyChecking=no" assets pi@${argv[2]}:~/assets
// rsync -ar test/ koenswings@Macbook-Pro-13.local:tmp





// // Check if the file image.img exists and if not, download it
// if (!fs.existsSync(image)) {
//     await executeWithErrorHandler(
//         `wget https://downloads.raspberrypi.org/raspios_lite_arm64/images/raspios_lite_arm64-2023-12-11/2023-12-11-raspios-bookworm-arm64-lite.img.xz`,
//         "Failed to download image"
//     );
// }

// // Uncompressing image
// await executeWithErrorHandler(
//     `unxz ${image}`,
//     "Failed to uncompress image"
// );

// // Remotely run docker-pi using the creat_image.sh script
// await executeWithErrorHandler(
//     `sshpass -p ${PASSWORD} ssh -o StrictHostKeyChecking=no 
//     pi@${argv[2]} 'bash -s' < scripts/create_image.sh ${argv[1]} ${is64Bit ? "64" : "32"}`, // 2>&1
//     "Failed to create image"
// );

