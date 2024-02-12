import { $, ssh, argv, cd, chalk, fs, question } from 'zx'
import pack from '../package.json' assert { type: "json" }
import YAML from 'yaml'

// TODO
// - Port raspap installation and configuration from the build_server Python script of the BerryIT project
// - Port zerotier installation and configuration from the build_server Python script of the BerryIT project
// - Port the configuration of system apps from the build_server Python script of the BerryIT project
// - Improve type checking of the defaults object. We are not detecting missing properties
// - Test HDMI power off on boot and remove it from here it is confirmed that this is something thatr MUST be done on every boot
// - Current code is for building a dev image - add a flag to build a production image
// - Fix issue with locale-gen which only accepts en_ZW.UTF-8 and not en_GB.UTF-8 or en_US.UTF-8
// - Cutting off HDMI power is not working
// - Add the ability to set the password of the pi user
// - print the version of the script
// - ensure boot.out does not grow indefinitely
// - Use the YAML lib from zx


// Add commandline option to print the version of the script
const { version } = pack
if (argv.v || argv.version) {
  console.log(`Version: ${version}`);
  process.exit(0);
}

// Add commandline option to print the help of the script
if (argv.h || argv.help) {
  console.log(`Builds a Raspberry Pi image with the specified configuration.`)
  console.log(`Usage: build_image.ts [options]` )
  console.log(`Options:`)
  console.log(`  -h, --help           display help for command`)  
  console.log(`  --version            output the version number`)
  console.log(`  -u, --user <string>  the user to use to connect to the remote host (default: pi)`)
  console.log(`  -m, --machine <string> the remote host to connect to (default: raspberrypi.local)`)
  console.log(`  -p, --password <string> the password to use to connect to the remote host (default: raspberry)`)
  console.log(`  -h, --hostname <string> the hostname to set on the remote host (default: raspberrypi)`)
  console.log(`  -l, --language <string> the language to set on the remote host (default: en_GB.UTF-8)`)
  console.log(`  -k, --keyboard <string> the keyboard layout to set on the remote host (default: us)`)
  console.log(`  -t, --timezone <string> the timezone to set on the remote host (default: Europe/Brussels)`)
  console.log(`  --update              wether to update the system (default: true)`)
  console.log(`  --upgrade             wether to upgrade the system (default: true)`)
  console.log(`  --hdmi                whether to switch off HDMI power (default: false)`)
  console.log(`  --temperature         wether to install temperature measurement (default: true)`)
  console.log(`  --argon               wether to install the Argon fan script (default: true)`)
  console.log(`  --zerotier            wether to install Zerotier (default: true)`)
  console.log(`  --raspap              wether to install RaspAP (default: true)`)
  console.log(``)
  process.exit(0)
}

// This is the list of configuration parameters for this script
// - the remote host to connect to
// - the user to use to connect to the remote host
// - the password to use to connect to the remote host
// - the hostname to set on the remote host
// - the language to set on the remote host
// - the keyboard layout to set on the remote host
// - the timezone to set on the remote host
// - wether to upadate the system
// - wether to upgrade the system 
// - whether to switch off HDMI power
// - wether to install temperature measurement
// - whether to install the Argon fan script
// - wether to install Zerotier
// - wether to install RaspAP
// The parameters must be read from the command line
// The defaults for these parameters (in case no value is provided on the commandline) must be read from a YAML file

// Please provide a sample YAML file here in comments
// user: pi
// machine: raspberrypi.local
// password: raspberry
// hostname: raspberrypi
// language: en_GB.UTF-8
// keyboard: us
// timezone: Europe/Brussels
// update: true
// upgrade: true
// hdmi: false
// temperature: true
// argon: true
// zerotier: true
// raspap: true

// Please define a TypeScript type for the object read from the YAML file
interface Defaults {
    user: string,
    machine: string,
    password: string,
    hostname: string,
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
const hostname = argv.h || argv.hostname || defaults.hostname
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

// Sync the assets folder to the remote host
const syncAssets = async () => {
    console.log(chalk.blue('Syncing the build_image_assets folder to the remote host'));
    try {
        // Check if the gh_token.txt file exists in the build_image_assets folder
        // If it does not exist, ask the user to provide the GitHub token and write it to the file
        // If it does exist, read the token from the file
        if (!fs.existsSync('./build_image_assets/gh_token.txt')) {
          githubToken = await question('Enter the GitHub token: ');
            fs.writeFileSync('./build_image_assets/gh_token.txt', githubToken);
        } else {
            githubToken = fs.readFileSync('./build_image_assets/gh_token.txt', 'utf8');
            // console.log(`The GitHub token is: ${githubToken}`);
        }
        //await $`sshpass -p ${password} rsync -av build_image_assets/ ${user}@${host}:~/tmp/build_image_assets`;
        await $`rsync -av build_image_assets/ ${user}@${host}:~/tmp/build_image_assets`;
    } catch (e) {   
        console.log(chalk.red('Failed to sync the build_image_assets folder to the remote host'));
        console.error(e);
        process.exit(1);
    }
}

// Create a function to copy a build asset to a specified folder and changing ownership and permissions on the fly
const copyAsset = async (asset: string, destination: string, executable: boolean = false, chmod: string | null = "0644", chown: string | null = "0:0") => {
    console.log(chalk.blue(`Copying asset ${asset} to ${destination}`));
    try {
        //await $$`sshpass -p ${password} ssh ${user}@${host} "sudo cp ~/tmp/build_image_assets/${asset} ${destination}"`;
        await $$`sudo cp ~/tmp/build_image_assets/${asset} ${destination}`;
        console.log(chalk.blue(`chmod to ${chmod} of ${destination}/${asset}`));
        // 644 means that the owner can read and write, and everyone else can read
        //await $`sshpass -p ${password} ssh ${user}@${host} "sudo chmod ${chmod} ${destination}/${asset}"`;
        await $$`sudo chmod ${chmod} ${destination}/${asset}`;
        console.log(chalk.blue(`chown to ${chown} of ${destination}/${asset}`));
        // 0:0 means that the owner and group are both root
        //await $`sshpass -p ${password} ssh ${user}@${host} "sudo chown ${chown} ${destination}/${asset}"`;
        await $$`sudo chown ${chown} ${destination}/${asset}`;
        console.log(chalk.blue(`Setting executable to ${executable} of ${destination}/${asset}`));
        if (executable) {
            //await $`sshpass -p ${password} ssh  ${user}@${host} "sudo chmod +x ${destination}/${asset}"`;
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

// Put the set hostname code inside build() in a named async function
const setHostname = async () => {
    console.log(chalk.blue('Setting hostname...'));
    try {
      await $$`sudo hostnamectl set-hostname ${hostname}`;
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
      await $$`gh auth login --with-token < ~/tmp/build_image_assets/gh_token.txt`;
      // If the repo already exists, remove it
      // Use the test function to check if the directory exists
      await $$`if [ -d /engine ]; then sudo rm -rf /engine; fi`;
      await $$`cd / && sudo git clone https://koenswings:${githubToken}@github.com/koenswings/engine.git`;
  } catch (e) {
    console.log(chalk.red('Error cloning the engine repo'));
    console.error(e);
    process.exit(1);
  }
  console.log(chalk.green('Engine repo cloned'));
}

// Write a function to compose up the engine using the compose-test.yml file
const composeUp = async () => {
  console.log(chalk.blue('Composing up the engine...'));
  try {
      await $$`cd /engine && docker compose -f compose-test.yaml up -d`;
  } catch (e) {
    console.log(chalk.red('Error composing up the engine'));
    console.error(e);
    process.exit(1);
  }
  console.log(chalk.green('Engine composed up'));
}




const build = async () => {

    // Update and upgrade the system
    if (update) {
        await updateSystem()
    }
    if (upgrade) {
        await upgradeSystem()
    }
    
    // Sync the assets folder to the remote host
    await syncAssets()

    // Set the hostname
    await setHostname()

    // Localise the system
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

    // Install the crontabs
    console.log(chalk.blue('Installing crontabs...'));
    try {
        // Copy boot.sh to /usr/local/bin
        await copyAsset('boot.sh', '/usr/local/bin', true)
        // Install the crontab defs in the crondefs asset
        await $$`sudo crontab ~/tmp/build_image_assets/crondefs`
        // Alternative Copy the crontabs to /etc/cron.d
        // await copyAsset('crondefs', '/etc/cron.d')
    } catch (e) {
      console.log(chalk.red('Error installing crontabs'));
      console.error(e);
      process.exit(1);
    }
    console.log(chalk.green('Crontabs installed'));

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

    // Run the install-docker.sh script
    console.log(chalk.blue('Installing Docker'))
    try {
        await $$`sudo ~/tmp/build_image_assets/install-docker.sh`;
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

    // Create the internal docker networks frontend and backend if they do not already exist
    console.log(chalk.blue('Creating the frontend network'))
    try {
        // Check if the frontend network already exists
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

    // Create the /apps, /apps/catalog, and /apps/instances directories 
    console.log(chalk.blue('Creating the /apps, /apps/catalog, and /apps/instances directories'))
    try {
        await createDir('/apps')
        await createDir('/apps/catalog')
        await createDir('/apps/instances')
    } catch (e) {
      console.log(chalk.red('Error creating the /apps, /apps/catalog, and /apps/instances directories'));
      console.error(e);
      process.exit(1);
    }   
    console.log(chalk.green('The /apps, /apps/catalog, and /apps/instances directories created'));


    // Install Zerotier
    // if (zerotier) {
    //     console.log(chalk.blue('Installing Zerotier'))
    //     try {
    //         await $$`sudo ~/tmp/build_image_assets/install-zerotier.sh`;
    //     } catch (e) {
    //       console.log(chalk.red('Error installing Zerotier'));
    //       console.error(e);
    //       process.exit(1);
    //     }   
    //     console.log(chalk.green('Zerotier installed'));
    // }

    // Install RaspAP
    // if (raspap) {
    //     console.log(chalk.blue('Installing RaspAP'))
    //     try {
    //         const raspap_version = "2.8.5"
    //         await $$`sudo ~/tmp/build_image_assets/install-raspap.sh -b ${raspap_version} -y -o 0 -a 0`;
    //     } catch (e) {
    //       console.log(chalk.red('Error installing RaspAP'));
    //       console.error(e);
    //       process.exit(1);
    //     }   
    //     console.log(chalk.green('RaspAP installed'));
    // }

    // Clone the engine repo
    await cloneRepo()

    // Compose up the engine
    await composeUp()

}

await build()
console.log(chalk.green('Build completed successfully'));
process.exit(0);

