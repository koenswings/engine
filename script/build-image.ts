import { $, ssh, argv, cd, chalk, fs, question, YAML } from 'zx'
import pack from '../package.json' assert { type: "json" }
import { generateHostName } from '../src/utils/nameGenerator.js'
//import { Defaults, readDefaults } from '../src/utils/readDefaults.js'
import { config } from '../src/data/Config.js'

import { uuid } from '../src/utils/utils.js'
import { copy } from 'lib0/array.js'

// TODO
// - Port raspap installation and configuration from the build_server Python script of the BerryIT project
// - Port zerotier installation and configuration from the build_server Python script of the BerryIT project
// - Port the configuration of system apps from the build_server Python script of the BerryIT project
// - Improve type checking of the defaults object. We are not detecting missing properties
// - Test HDMI power off on boot and remove it from here it is confirmed that this is something thatr MUST be done on every boot
// - Current code is for building a dev image - add a flag to build a production image. This mght involve
//      Cloning a specified release of the engine to /engine (using sudo !) instead of syncing it from the development machine
// - Fix issue with locale-gen which only accepts en_ZW.UTF-8 and not en_GB.UTF-8 or en_US.UTF-8
// - Cutting off HDMI power is not working
// - Add the ability to set the password of the pi user
// - print the version of the script
// - ensure boot.out does not grow indefinitely
// - Use the YAML lib from zx
// - Remove the syncAssets function and start with cloning the repo
// - Add firewall rules to give network access to the gadget when it is connected to a machine
// - The Argon install script is ececuted from /usr/local/bin. It should be executed from the engine folder like all other install scripts



const defaults  = config.defaults

// Now override the default configuration using the command line
const user = argv.u || argv.user || defaults.user
const machine = argv.m || argv.machine || defaults.machine
const password = argv.p || argv.password || defaults.password
const hostname = argv.hostname || generateHostName()
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
const gadget = argv.gadget || defaults.gadget
const nodocker = argv.nodocker || defaults.nodocker


// ********************************************************************************************************************
// Process command line options
// ********************************************************************************************************************

// Add commandline option to print the version of the script
const { version } = pack
if (argv.v || argv.version) {
  console.log(`Version: ${version}`);
  process.exit(0);
}

// Add commandline option to read the build mode (dev or prod)
let productionMode = false
if (argv.prod) {
  productionMode = true
  console.log(`Building a production image`)
}

// Add commandline option to print the help of the script
if (argv.h || argv.help) {
  console.log(`Builds a Raspberry Pi image with the specified configuration.`)
  console.log(`Usage: ./build-image.ts [options]` )
  console.log(`Options:`)
  console.log(`  -h, --help              display help for command`)  
  console.log(`  -v, --version           output the version number`)
  console.log(`  -m, --machine <string>  the remote machine to connect to (default: raspberrypi.local)`)
  console.log(`  -u, --user <string>     the user to use to connect to the remote machine (default: ${defaults.user})`)
  console.log(`  -p, --password <string> the password to use to connect to the remote machine (default: ${defaults.password})`)
  console.log(`  --hostname <string>     the hostname to set on the remote machine (default: a name that is generated)`)
  console.log(`  -l, --language <string> the language to set on the remote machine (default: ${defaults.language})`)
  console.log(`  -k, --keyboard <string> the keyboard layout to set on the remote machine (default: ${defaults.keyboard})`)
  console.log(`  -t, --timezone <string> the timezone to set on the remote machine (default: ${defaults.timezone})`)
  console.log(`  --update                whether to update the system (default: ${defaults.update})`)
  console.log(`  --upgrade               whether to upgrade the system (default: ${defaults.upgrade})`)
  console.log(`  --hdmi                  whether to switch off HDMI power (default: ${defaults.hdmi})`)
  console.log(`  --temperature           whether to install temperature measurement (default: ${defaults.temperature})`)
  console.log(`  --argon                 whether to install the Argon fan script (default: ${defaults.argon})`)
  console.log(`  --zerotier              whether to install Zerotier (default: ${defaults.zerotier})`)
  console.log(`  --raspap                whether to install RaspAP (default: ${defaults.raspap})`)
  console.log(`  --gadget                whether to run the rpi4-usb script (default: ${defaults.gadget})`)
  console.log(`  --nodocker              whether the engine itself will be dockerized or not (default: ${defaults.nodocker})`)
  console.log(``)
  process.exit(0)
}

// ********************************************************************************************************************
// Installer Helper Functions
// ********************************************************************************************************************

// Globals
let githubToken = ""
const $$ = ssh(`${user}@${machine}`)
const enginePath = "/home/pi/engine"
const engineParentPath = enginePath.substring(0, enginePath.lastIndexOf("/"))


// Sync the assets folder to the remote machine
const syncEngine = async () => {
    console.log(chalk.blue('Syncing the engine to the remote machine'))
    try {
        // Check if the gh_token.txt file exists in the build_image_assets folder
        // If it does not exist, ask the user to provide the GitHub token and write it to the file
        // If it does exist, read the token from the file
        if (!fs.existsSync('./script/build_image_assets/gh_token.txt')) {
          githubToken = await question('Enter the GitHub token: ');
            fs.writeFileSync('./script/build_image_assets/gh_token.txt', githubToken);
        } else {
            githubToken = fs.readFileSync('./script/build_image_assets/gh_token.txt', 'utf8');
            // console.log(`The GitHub token is: ${githubToken}`);
        }
        //await $`sshpass -p ${password} rsync -av build_image_assets/ ${user}@${machine}:~/build_image_assets`;
        //await $`rsync -av build_image_assets/ ${user}@${machine}:~/build_image_assets`;
        // Call the sync-engine script
        await $`./script/sync-engine --user ${user} --machine ${machine}`;
        // await $`rsync -av --chmod=Du=rwx,Dg=rx,Do=rx,Fu=rw,Fg=r,Fo=r --perms --exclude='node_modules' --exclude='.git' --exclude='dist' --exclude='scratchpad' --exclude='.vscode' --exclude='.pnpm-store' ../ ${user}@${machine}:${enginePath}`
        // await $`rsync -av --exclude='node_modules' --exclude='.git' --exclude='dist' --exclude='scratchpad' --exclude='.vscode' --exclude='.pnpm-store' ../ ${user}@${machine}:${enginePath}`
        // await $`sudo rsync -v -r --exclude='node_modules' --exclude='.git' --exclude='dist' --exclude='scratchpad' --exclude='.vscode' --exclude='.pnpm-store' ../ ${user}@${machine}:${enginePath}`
    } catch (e) {   
        console.log(chalk.red('Failed to sync the engine to the remote machine'));
        console.error(e);
        process.exit(1);
    }
}

// Create a function to copy a build asset to a specified folder and changing ownership and permissions on the fly
const copyAsset = async (asset: string, destination: string, executable: boolean = false, chmod: string | null = "0644", chown: string | null = "0:0") => {
    console.log(chalk.blue(`Copying asset ${asset} to ${destination}`));
    try {
        //await $$`sshpass -p ${password} ssh ${user}@${machine} "sudo cp ${enginePath}/script/build_image_assets/${asset} ${destination}"`;
        await $$`sudo cp ${enginePath}/script/build_image_assets/${asset} ${destination}`;
        console.log(chalk.blue(`chmod to ${chmod} of ${destination}/${asset}`));
        // 644 means that the owner can read and write, and everyone else can read
        //await $`sshpass -p ${password} ssh ${user}@${machine} "sudo chmod ${chmod} ${destination}/${asset}"`;
        await $$`sudo chmod ${chmod} ${destination}/${asset}`;
        console.log(chalk.blue(`chown to ${chown} of ${destination}/${asset}`));
        // 0:0 means that the owner and group are both root
        //await $`sshpass -p ${password} ssh ${user}@${machine} "sudo chown ${chown} ${destination}/${asset}"`;
        await $$`sudo chown ${chown} ${destination}/${asset}`;
        console.log(chalk.blue(`Setting executable to ${executable} of ${destination}/${asset}`));
        if (executable) {
            //await $`sshpass -p ${password} ssh  ${user}@${machine} "sudo chmod +x ${destination}/${asset}"`;
            await $$`sudo chmod +x ${destination}/${asset}`;
        }
    } catch (e) {
        console.log(chalk.red(`Error copying asset ${asset} to ${destination}`));
        console.error(e);
        process.exit(1);
    }
}

// Create a function that creates a directory if it does not already exist and sets the user, group and persmissions
const createDir = async (dir: string, chmod: string | null = "0755", chown: string | null = "0:0") => {
    console.log(chalk.blue(`Creating directory ${dir}`));
    try {
        await $$`sudo mkdir -p ${dir}`;
        console.log(chalk.blue(`chmod to ${chmod} of ${dir}`));
        await $$`sudo chmod ${chmod} ${dir}`;
        console.log(chalk.blue(`chown to ${chown} of ${dir}`));
        await $$`sudo chown ${chown} ${dir}`;
    } catch (e) {
        console.log(chalk.red(`Error creating directory ${dir}`));
        console.error(e);
        process.exit(1);
    }
}

const updateSystem = async () => {

  // Update the package list
  // We need update to cover InRelease updates
  console.log(chalk.blue('Updating package list...'));
  try {
      //await $$`sudo apt update --allow-releaseinfo-change -y`;
      await $$`sudo apt update -y`;
  } catch (e) {
    console.log(chalk.red('Error updating package list'));
    console.error(e);
    process.exit(1);
  }
  console.log(chalk.green('Package list updated'));
}

const upgradeSystem = async () => {
  
  // Upgrade the packages
  console.log(chalk.blue('Upgrading packages...'));
  try {
    await $$`sudo apt upgrade -y`;
  } catch (e) {
    console.log(chalk.red('Error upgrading packages'));
    console.error(e);
    process.exit(1);
  }
}

// Write a function to localise the system
const localiseSystem = async () => {
  console.log(chalk.blue('Localising the system...'));
  try {
      // Copy the locale.gen asset to /etc. 
      // This is a file that contains the list of all available locales.
      await copyAsset('locale.gen', '/etc')
      // Generate the available locales
      await $$`sudo locale-gen`;
      // Change to one selected locale
      // TODO Check this chatgpt alternative: await $$`sudo update-locale LANG=${language} LC_ALL=${language} LANGUAGE=${language}`;
      await $$`sudo update-locale LANG=${language}`;
      // TODO - Alternative option suggested by ChatGPT
      // Reconfigure locales
      // await $$`sudo dpkg-reconfigure locales`;
      // Changing keyboard layout
      await $$`sudo raspi-config nonint do_configure_keyboard ${keyboard}`
      // Set timezone
      await $$`sudo timedatectl set-timezone ${timezone}`
  } catch (e) {
    console.log(chalk.red('Error localising the system'));
    console.error(e);
    process.exit(1);
  }
  console.log(chalk.green('System localised'));
}

// Write a function to install the crontabs
const installCrontabs = async () => {
  console.log(chalk.blue('Installing crontabs...'));
  try {
    // Copy boot.sh to /usr/local/bin
    await copyAsset('boot.sh', '/usr/local/bin', true)
    // Install the crontab defs in the crondefs asset
    await $$`sudo crontab ${enginePath}/script/build_image_assets/crondefs`
    // Alternative Copy the crontabs to /etc/cron.d
    // await copyAsset('crondefs', '/etc/cron.d')
  } catch (e) {
    console.log(chalk.red('Error installing crontabs'));
    console.error(e);
    process.exit(1);
  }
}

// Write a function to install temperature measurement
const installTemperature = async () => {
  console.log(chalk.blue('Installing lm-sensors...'));
  try {
      await $$`sudo apt install lm-sensors -y`;
  } catch (e) {
    console.log(chalk.red('Error installing lm-sensors'));
    console.error(e);
    process.exit(1);
  }
  console.log(chalk.green('lm-sensors installed'));
  
  // Run sensors to display the current temperature
  console.log(chalk.blue('Running sensors...'));
  try {
      const ret = await $$`sensors`
      console.log(ret.stdout)
  } catch (e) {
    console.log(chalk.red('Error running sensors'));
    console.error(e);
    process.exit(1);
  }
  console.log(chalk.green('Sensors run'));
}

// Put the set hostname code inside build() in a named async function
const setHostname = async () => {
    console.log(chalk.blue(`Setting hostname to ${hostname}`));
    try {
      await $$`sudo hostnamectl set-hostname ${hostname}`;
      // await $$`sudo hostname ${hostname}`
      // Now replace the hostname in the /etc/hosts file
      await $$`sudo sed -i "s/raspberrypi/${hostname}/g" /etc/hosts`
    }   catch (e) {
      console.log(chalk.red('Error setting hostname'));
      console.error(e);
      process.exit(1);
    } 
    console.log(chalk.green('Hostname set'));
}

// Put the argon fan script copy code and execute code that is inside build() in a named async function
const installArgonFanScript = async () => {
  // Copy argon_fan_script.sh asset to /usr/local/bin and make it executable
  console.log(chalk.blue('Installing argon_fan_script.sh...'));
  try {
      await copyAsset('argon_fan_script.sh', '/usr/local/bin', true, "0755")
  } catch (e) {
    console.log(chalk.red('Error installing argon_fan_script.sh'));
    console.error(e);
    process.exit(1);
  }   
  console.log(chalk.green('Argon fan script installed'));

  // Execute the argon_fan_script.sh
  console.log(chalk.blue('Executing argon_fan_script.sh...'));
  try {
      await $$`sudo /usr/local/bin/argon_fan_script.sh`;
  } catch (e) {
    console.log(chalk.red('Error executing argon_fan_script.sh'));
    console.error(e);
    process.exit(1);
  }
  console.log(chalk.green('Argon fan script executed'));
}

const installDocker = async () => {
  
  // Run the install-docker.sh script
  console.log(chalk.blue('Installing Docker'))
  try {
      // Make the script executable
      await $$`sudo chmod +x ${enginePath}/script/build_image_assets/install-docker.sh`;
      await $$`sudo ${enginePath}/script/build_image_assets/install-docker.sh`;
  } catch (e) {
    console.log(chalk.red('Error installing Docker'));
    console.error(e);
    process.exit(1);
  }   
  console.log(chalk.green('Docker installed'));

  // Add the docker group if it does not already exist
  console.log(chalk.blue('Adding the docker group'))
  try {
      // Check if the docker group already exists
      if (await $$`getent group docker`) {
          console.log(chalk.blue('The docker group already exists'));
      } else {
          await $$`sudo groupadd docker`;
      }
  } catch (e) {
    console.log(chalk.red('Error adding the docker group'));
    console.error(e);
    process.exit(1);
  }
  console.log(chalk.green('Docker group added'));


  // Add the ssh user to the docker group
  console.log(chalk.blue('Adding the ssh user to the docker group'))
  try {
      await $$`sudo usermod -aG docker ${user}`;
  } catch (e) {
    console.log(chalk.red('Error adding the ssh user to the docker group'));
    console.error(e);
    process.exit(1);
  }

  // Copy the daemon.json asset to /etc/docker
  console.log(chalk.blue('Configuring Docker'))
  try {
      await copyAsset('daemon.json', '/etc/docker', false, "0644")
  } catch (e) {
    console.log(chalk.red('Error configuring Docker'));
    console.error(e);
    process.exit(1);
  }
  console.log(chalk.green('Docker configured'));


  // Restart the Docker service
  console.log(chalk.blue('Restarting the Docker service'))
  try {
      await $$`sudo systemctl restart docker`;
  } catch (e) {
    console.log(chalk.red('Error restarting the Docker service'));
    console.error(e);
    process.exit(1);
  }
  console.log(chalk.green('Docker service restarted'));


  // Print the Docker Compose, the Docker version and the Docker info
  console.log(chalk.blue('Docker info'))
  try {
      // (use sudo because the docker group has not been added yet - requires a reboot)
      let ret = await $$`sudo docker compose version`
      console.log(ret.stdout)
      ret = await $$`sudo docker version`
      console.log(ret.stdout)
      ret = await $$`sudo docker info`
      console.log(ret.stdout)
  } catch (e) {
    console.log(chalk.red('Error printing the Docker info'));
    console.error(e);
    process.exit(1);
  }
  console.log(chalk.green('Docker info printed'));
}

// Write a function to build the required Docker Infrastructure
const buildDockerInfrastructure = async () => { 

  // Create the internal docker networks frontend and backend if they do not already exist
  console.log(chalk.blue('Creating the frontend network'))
  try {
      // Check if the frontend network already exists
      // (use sudo because the docker group has not been added yet - requires a reboot)
      if (await $$`sudo docker network ls --filter name=frontend`) {
          console.log(chalk.blue('The frontend network already exists'));
      } else {
          await $$`sudo docker network create --internal frontend`;
      }
      // Check if the backend network already exists
      if (await $$`sudo docker network ls --filter name=backend`) {
          console.log(chalk.blue('The backend network already exists'));
      } else {
          await $$`sudo docker network create --internal backend`;
      }
  } catch (e) {
    console.log(chalk.red('Error creating the frontend or backend network'));
    console.error(e);
    process.exit(1); 
  }
  console.log(chalk.green('Frontend and backend networks created'));
}

// Write a function to build the Apps Infrastructure
const buildAppsInfrastructure = async () => {
// Create the /apps, /apps/catalog, and /apps/instances directories 
  console.log(chalk.blue('Creating the /services, /apps, and /instances directories'))
  try {
      await createDir('/services')
      await createDir('/apps')
      await createDir('/instances')
  } catch (e) {
    console.log(chalk.red('Error creating the /services, /apps, and /instances directories'));
    console.error(e);
    process.exit(1);
  }   
  console.log(chalk.green('The /services, /apps, and /instances directories have been created'));
}

// Write a function to install gh
const installGh = async () => {
  console.log(chalk.blue('Installing gh...'));
  try {
      // Suggested by Copilot
      // await $$ `sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-key C99B11DEB97541F0`;
      // await $$ `sudo apt-add-repository https://cli.github.com/packages`;
      // await $$ `sudo apt update`;
      // await $$ `sudo apt install gh -y`;
      // This is the official installation method from the GitHub CLI website
      // curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
      // && sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg \
      // && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
      // && sudo apt update \
      // && sudo apt install gh -y
      await $$ `curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg`
      await $$ `sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg`
      await $$ `echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null`
      await $$ `sudo apt update`
      await $$ `sudo apt install gh -y`

  } catch (e) {
      console.log(chalk.red('Error installing gh'));
      console.error(e);
      process.exit(1);
  }
  console.log(chalk.green('gh installed'));
}

// Write a function to authenticate with git and clone the repo https://github.com/koenswings/engine.git
const cloneRepo = async () => {
  console.log(chalk.blue('Cloning the engine repo...'));
  try {
      await $$`git config --global user.email "koen@swings.be"`;
      await $$`git config --global user.name "Koen Swings"`;
      await $$`gh auth login --with-token < ${enginePath}/script/build_image_assets/gh_token.txt`;
      // If the repo already exists, remove it
      // Use the test function to check if the directory exists
      await $$`if [ -d ${enginePath} ]; then sudo rm -rf ${enginePath}; fi`;
      // Do not use sudo if you clone to a user folder !
      await $$`cd ${engineParentPath} && git clone https://koenswings:${githubToken}@github.com/koenswings/engine.git`;
  } catch (e) {
    console.log(chalk.red('Error cloning the engine repo'));
    console.error(e);
    process.exit(1);
  }
  console.log(chalk.green('Engine repo cloned'));
}

// Write a function to compose up the engine using the correct compose file
const startEngine = async (productionMode:boolean) => {
  // Build the engine image
  console.log(chalk.blue(`Building a ${productionMode ? "production" : "dev"} mode engine image...`))
  try {
      // Compose build
      // (use sudo because the docker group has not been added yet - requires a reboot)
      if (productionMode) {
        await $$`cd ${enginePath} && sudo docker compose -f compose-engine-prod.yaml build`;
      } else {
        await $$`cd ${enginePath} && sudo docker compose -f compose-engine-dev.yaml build`;
      }
  } catch (e) {
    console.log(chalk.red('Error building the engine image'));
    console.error(e);
    process.exit(1);
  }
  console.log(chalk.green('Engine image built'));

  // Start the engine
  console.log(chalk.blue('Composing up the engine...'));
  try {
      // Compose up 
      // (use sudo because the docker group has not been added yet - requires a reboot)
      if (productionMode) {
        await $$`cd ${enginePath} && sudo docker compose -f compose-engine-prod.yaml up -d`;
      } else {
        await $$`cd ${enginePath} && sudo docker compose -f compose-engine-dev.yaml up -d`;
      }
  } catch (e) {
    console.log(chalk.red('Error composing up the engine'));
    console.error(e);
    process.exit(1);
  }
  console.log(chalk.green('Engine composed up'));
}

// Write a function to install udev and the udev rules in 90-docking.rules
const installUdev = async () => {
  console.log(chalk.blue('Installing udev and udev rules...'));
  try {
      await $$`sudo apt install udev -y`;
      await copyAsset('90-docking.rules', '/etc/udev/rules.d')
  } catch (e) {
    console.log(chalk.red('Error installing udev and udev rules'));
    console.error(e);
    process.exit(1);
  }
  console.log(chalk.green('Udev and udev rules installed'));
} 

// Write a function to reboot the system
const rebootSystem = async () => {
  console.log(chalk.blue('Rebooting the system...'));
  try {
      await $$`sudo reboot`;
  } catch (e) {
    console.log(chalk.red('Error rebooting the system'));
    console.error(e);
    process.exit(1);
  }
}

// Write a function to run the rpi4-usb script that turns the Pi into a USB gadget
const usbGadget = async () => {
  console.log(chalk.blue('Running the rpi4-usb script...'));
  try {
      // Make the script executable
      await $$`sudo chmod +x ${enginePath}/script/build_image_assets/rpi4-usb.sh`;
      await $$`sudo ${enginePath}/script/build_image_assets/rpi4-usb.sh`;
  } catch (e) {
    console.log(chalk.red('Error running the rpi4-usb script'));
    console.error(e);
    process.exit(1);
  }
  console.log(chalk.green('rpi4-usb script run'));
}

// Write a function to install RaspAP
const installRaspAP = async () => {
  console.log(chalk.blue('Installing RaspAP...'));
  try {
    const raspap_version = "2.8.5"
    // Make the script executable
    await $$`sudo chmod +x ${enginePath}/script/build_image_assets/install-raspap.sh`;
    await $$`sudo ${enginePath}/script/build_image_assets/install-raspap.sh -b ${raspap_version} -y -o 0 -a 0`;  
  } catch (e) {
    console.log(chalk.red('Error installing RaspAP'));
    console.error(e);
    process.exit(1);
  }
  console.log(chalk.green('RaspAP installed'));
}

// Write a function to install Zerotier
const installZerotier = async () => {
  console.log(chalk.blue('Installing Zerotier...'));
  try {
    // Make the script executable
    await $$`sudo chmod +x ${enginePath}/script/build_image_assets/install-zerotier.sh`;
    await $$`sudo ${enginePath}/script/build_image_assets/install-zerotier.sh`;  
  } catch (e) {
    console.log(chalk.red('Error installing Zerotier'));
    console.error(e);
    process.exit(1);
  }
  console.log(chalk.green('Zerotier installed'));
}

const installRSync = async () => {
  console.log(chalk.blue('Installing rsync...'));
  try {
      await $$`sudo apt install rsync -y`;
  } catch (e) {
    console.log(chalk.red('Error installing rsync'));
    console.error(e);
    process.exit(1);
  }
  console.log(chalk.green('rsync installed'));
} 

const installNpm = async () => {
  console.log(chalk.blue('Installing node, n, npm and pnpm...'));
  try {
    await $$`sudo apt install npm -y`
    await $$`sudo npm install -g -y n pnpm`
    await $$`sudo n 19.6.0`
  } catch (e) {
    console.log(chalk.red('Error installing node, n, npm and pnpm...'));
    console.error(e);
    process.exit(1);
  }
  console.log(chalk.green('node, n, npm and pnpm installed'));
} 

const configurePnpm = async () => {
  console.log(chalk.blue('Setting up pnpm...'));
  try {
    await $$`SHELL=bash PNPM_HOME=/pnpm PATH="$PNPM_HOME:$PATH" sudo pnpm setup`
    // await $$`sudo source /home/pi/.bashrcm`
    await $$`sudo pnpm add -g ts-node"`
  } catch (e) {
    console.log(chalk.red('Error setting up pnpm...'));
    console.error(e);
    process.exit(1);
  }
  console.log(chalk.green('Pnpm set up'));
} 

// const installEnv = async () => {
//   console.log(chalk.blue('Setting the environment variables...'));
//   try {
//     await $$`sudo export SHELL=bash`
//     await $$`sudo export PNPM_HOME=/pnpm`
//     await $$`sudo export PATH="$PNPM_HOME:$PATH"`
//   } catch (e) {
//     console.log(chalk.red('Error setting the environment variables...'));
//     console.error(e);
//     process.exit(1);
//   }
//   console.log(chalk.green('Environment variables set'));
// } 

const addMetadata = async () => {
  const id = uuid()
  // const diskMetadata = {
  //   hostname: hostname,
  //   created: new Date().getTime(),
  //   version: version,
  //   engineId: id+"-engine",
  //   diskId: id+"-disk",
  // }
  // await $`sudo echo ${YAML.stringify(diskMetadata)} > /META.yaml`
  // Write the contents of the diskMetadata object to the /META.yaml file
  console.log(chalk.blue('Adding metadata...'));
  try {
      // Convert the diskMetadata object to a YAML string 
      // const diskMetadataYAML = YAML.stringify(diskMetadata)
      // fs.writeFileSync('./script/build_image_assets/META.yaml', diskMetadataYAML)
      // // Copy the META.yaml file to the remote machine using zx
      // await copyAsset('META.yaml', '/')
      // await $$`echo '${YAML.stringify(diskMetadata)}' | sudo tee /META.yaml`;

      await $$`sudo echo 'hostname: ${hostname}' >> ${enginePath}/META.yaml`
      await $$`sudo echo 'created: ${new Date().getTime()}' >> ${enginePath}/META.yaml`
      await $$`sudo echo 'version: ${version}' >> ${enginePath}/META.yaml`
      await $$`sudo echo 'engineId: ${id}-engine' >> ${enginePath}/META.yaml`
      await $$`sudo echo 'diskId: ${id}-disk' >> ${enginePath}/META.yaml`
      // Move the META.yaml file to the root directory
      await $$`sudo mv ${enginePath}/META.yaml /META.yaml`
  } catch (e) {
    console.log(chalk.red('Error adding metadata'));
    console.error(e);
    process.exit(1);
  }
}

const installPm2 = async () => {
  console.log(chalk.blue('Installing pm2...'));
  try {
      await $$`sudo npm install -g pm2`
      await $$`cd ${enginePath}`
      await $$`cd ${enginePath} && sudo pnpm tsc`
      await $$`cd ${enginePath} && sudo pm2 start dist/src/index.js`
      await $$`cd ${enginePath} && sudo pm2 save`
      await $$`cd ${enginePath} && sudo pm2 startup`
      await $$`cd ${enginePath} && sudo pm2 install pm2-logrotate`
  } catch (e) {
    console.log(chalk.red('Error installing pm2'));
    console.error(e);
    process.exit(1);
  }
  console.log(chalk.green('pm2 installed'));
}
    

const build = async () => {

    // Update and upgrade the system
    if (update) {
        await updateSystem()
    }
    if (upgrade) {
        await upgradeSystem()
    }
    
    // Sync the engine to the remote machine
    await syncEngine()

    // Set the hostname
    await setHostname()

    // Localise the system
    await localiseSystem()

    // Install the crontabs
    await installCrontabs()

    // Switch off HDMI power
    // This should be boot.sh
    // console.log(chalk.blue('Switching off HDMI power...'));
    // try {
    //     await $$`vcgencmd display_power 0`;
    // } catch (e) {
    //   console.log(chalk.red('Error switching off HDMI power'));
    //   console.error(e);
    //   process.exit(1);
    // }

    // Install the argon fan script
    if (argon) {
        await installArgonFanScript()
    }

    // Install temperature measurement
    if (temperature) {
        await installTemperature()
    }

    // Install udev and udev rules
    await installUdev()
    
    // Install the git, dnsutlis, tree, lshw and cloud-guest-utils packages
    console.log(chalk.blue('Installing lm-sensors, git, dnsutils, tree, lshw and cloud-guest-utils...'));
    try {
        await $$`sudo apt install git dnsutils tree lshw cloud-guest-utils -y`;
    } catch (e) {
      console.log(chalk.red('Error installing git, dnsutils, tree, lshw and cloud-guest-utils'));
      console.error(e);
      process.exit(1);
    }
    console.log(chalk.green('git, dnsutils, tree, lshw and cloud-guest-utils installed'));

    // Install the GitHub CLI (gh)
    await installGh();

    // Install Docker
    await installDocker()

    // Build the required Docker Infrastructure
    await buildDockerInfrastructure()

    // Build the Apps Infrastructure
    await buildAppsInfrastructure()

    
    // Install RaspAP
    if (raspap) {
        await installRaspAP()
    }

    // Install Zerotier
    if (zerotier) {
        await installZerotier()
    }

    if (nodocker) {
        // Install rsync
        await installRSync()
        // Install npm, n and pnpm
        await installNpm()
        // Configure pnpm
        await configurePnpm()
        // Install pm2
        await installPm2()
        // Install the engine
        await $$`cd ${enginePath} && sudo pnpm install`
        // Start the engine
        // await $$`cd ${enginePath} && sudo pnpm start`
    }
    
    // Clone the engine repo
    // Only required for production build - for dev build, we sync the engine from the development machine
    // await cloneRepo(releaseSpecified)


    // Add the metadata
    await addMetadata()

    // Start the engine
    await startEngine(productionMode)

    // Run the rpi4-usb script
    await usbGadget()

    // Reboot the system
    await rebootSystem()
}

await build()
console.log(chalk.green(`Build completed successfully. System renamed`));
process.exit(0);

