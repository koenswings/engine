import { engineApps, getEngine } from '../data/store.js'
import { subscribe } from 'valtio'
import { log, deepPrint } from '../utils/utils.js'
import { handleCommand } from '../utils/commandHandler.js'
import { Command } from '../data/dataTypes.js'
import { monitorNetwork, unmonitorNetwork } from './networkMonitor.js'
import { $, question, chalk, cd, YAML, fs } from 'zx';


const attachNetwork = (iface: string, networkName: string) => {
    monitorNetwork(iface, networkName)
}

const detachNetwork = (iface: string, networkName: string) => {
    unmonitorNetwork(iface, networkName)
}

const createDisk = async (disk: string) => {
    log(`Creating an internal disk ${disk} on engine ${getEngine().hostName}`)

    // Check if the supplied disk name does not start with sd
    if (disk.startsWith('sd')) {
        console.log(chalk.red('Disk name cannot start with "sd"'))
        return
    }

    try {
        await $`mkdir -p /disks/${disk}`
        console.log(chalk.green(`Internal disk ${disk} of engine ${getEngine().hostName} created`))
    } catch (e) {
        console.log(chalk.red('Error creating internal disk'))
        console.error(e)
    }
}


const createApp = async (instanceName: string, typeName: string, diskName: string, version: string) => {
    console.log(`Creating a '${typeName}' app named '${instanceName}' on disk '${diskName}' of engine '${getEngine().hostName}'.`)

    // CODING STYLE: only use absolute pathnames !
    // CODING STYLE: use try/catch for error handling

    try {

        // If version is "latest", clone the app from the repository at https://github.com/koenswings/
        // For example, https://github.com/koenswings/app-kolibri
        // Clone it into /tmp/apps/typeName, overwriting any existing files
        if (version === "latest") {

            // Create the app infrastructure if it does not exist
            // TODO: This should be done when creating the disk
            // TODO: Here we should only be checking if it is an apps disk! 
            await $`mkdir -p /disks/${diskName}/apps /disks/${diskName}/services /disks/${diskName}/instances`


            // **************************
            // STEP 1 - App Type creation
            // **************************

            // Clone the latest version of the app from the repository
            // Remove /tmp/apps/${typeName} if it exists
            await $`rm -rf /tmp/apps/${typeName}`
            await $`git clone https://github.com/koenswings/app-${typeName} /tmp/apps/${typeName}`

            // Open the compose.yaml file of the app and read its version 
            const composeFile = await $`cat /tmp/apps/${typeName}/compose.yaml`
            const compose = YAML.parse(composeFile.stdout)
            const appVersion = compose['x-meta'].version

            // Create the app type
            // Overwrite if it exists
            // We want to copy the content of a directory and rename the directory at the same time: 
            //   See https://unix.stackexchange.com/questions/412259/how-can-i-copy-a-directory-and-rename-it-in-the-same-command
            await $`cp -fr /tmp/apps/${typeName}/. /disks/${diskName}/apps/${typeName}-${appVersion}/`


            // **************************
            // STEP 2 - App Instance creation
            // **************************

            // Create the app instance
            // If there is already a instance with the name instanceName, try instanceName-1, instanceName-2, etc.
            let instanceNumber = 1
            while (true) {
                try {
                    await $`mkdir /disks/${diskName}/instances/${instanceName}`
                    break
                } catch (e) {
                    instanceNumber++
                    instanceName = `${instanceName}-${instanceNumber}`
                }
            }
            // Again use /. to specify the content of the dir, not the dir itself 
            await $`cp -fr /tmp/apps/${typeName}/. /disks/${diskName}/instances/${instanceName}/`

            // If the app has an init_data.tar.gz file, unpack it in the app folder
            if (fs.existsSync(`/disks/${diskName}/instances/${instanceName}/init_data.tar.gz`)) {
                await $`tar -xzf /disks/${diskName}/instances/${instanceName}/init_data.tar.gz -C /disks/${diskName}/instances/${instanceName}`
                // Rename the folder init_data to data
                await $`mv /disks/${diskName}/instances/${instanceName}/init_data /disks/${diskName}/instances/${instanceName}/data`
            }

            // Remove the temporary app folder
            await $`rm -rf /tmp/apps/${typeName}`

            // **************************
            // STEP 3 - Preloading of services
            // **************************

            // Extract the service images of the services from the compose file, and pull them
            const services = compose.services
            for (const serviceName in services) {
                const serviceImage = services[serviceName].image
                // Pull the sercice image
                await $`docker image pull ${serviceImage}`
            }

            // **************************
            // STEP 4 - Container creation
            // **************************

            await $`docker compose -f /disks/${diskName}/instances/${instanceName}/compose.yaml create`
        }
        console.log(chalk.green(`App ${instanceName} created`))
    } catch (e) {
        console.log(chalk.red('Error creating app instance'))
        console.error(e)
    }
}


const runApp = async (instanceName: string, diskName: string, version: string) => {
    console.log(`Running app '${instanceName}' on disk '${diskName}' of engine '${getEngine().hostName}'.`)

    // CODING STYLE: only use absolute pathnames !
    // CODING STYLE: use try/catch for error handling

    try {

        // Generate a port  number for the app  and assign it to the variable port
        // Start from port number 3000 and check if the port is already in use by another app
        // The port is in use by another app if an app can be found in networkdata with the same port
        let port = 3000
        const apps = engineApps(getEngine())
        while (true) {
            const app = apps.find(app => app.port === port)
            if (app) {
                port++
            } else {
                break
            }
        }
        console.log(`Port: ${port}`)

        // ALternative is to check the system for an occipied port
        // await $`netstat -tuln | grep ${port}`
        // But this prevents us from finding apps that are stopped by the user
        // let port = 3000
        // let portInUse = true
        // while (portInUse) {
        //     try {
        //         await $`nc -z localhost ${port}`
        //         port++
        //     } catch (e) {
        //         portInUse = false
        //     }
        // }

        // Write a .env file in which you define the port variable
        // Do it
        await $`echo "port=${port}" > /disks/${diskName}/instances/${instanceName}/.env`

        // Compose up the app
        // Do it
        await $`docker compose -f /disks/${diskName}/instances/${instanceName}/compose.yaml up -d`
        console.log(chalk.green(`App ${instanceName} running`))
    } catch (e) {
        console.log(chalk.red('Error running app instance'))
        console.error(e)
    }
}

const stopApp = async (instanceName: string, diskName: string, version: string) => {
    console.log(`Stopping app '${instanceName}' on disk '${diskName}' of engine '${getEngine().hostName}'.`)

    // CODING STYLE: only use absolute pathnames !
    // CODING STYLE: use try/catch for error handling

    try {
        // Compose stop the app
        // Do it
        await $`docker compose -f /disks/${diskName}/instances/${instanceName}/compose.yaml stop`
        console.log(chalk.green(`App ${instanceName} stopped`))
    } catch (e) {
        console.log(chalk.red('Error stopping app instance'))
        console.error(e)
    }
}


// Command registry with an example of the new object command
const commands: Command[] = [
    {
        name: "attachNetwork",
        execute: attachNetwork,
        args: [{ type: "string" }, { type: "string" }],
    },
    {
        name: "detachNetwork",
        execute: detachNetwork,
        args: [{ type: "string" }, { type: "string" }],
    },
    {
        name: "createDisk",
        execute: createDisk,
        args: [{ type: "string" }],
    },
    {
        name: "createApp",
        execute: createApp,
        args: [{ type: "string" }, { type: "string" }, { type: "string" }, { type: "string" }],
    },
    {
        name: "runApp",
        execute: runApp,
        args: [{ type: "string" }, { type: "string" }, { type: "string" }],
    },
    {
        name: "stopApp",
        execute: stopApp,
        args: [{ type: "string" }, { type: "string" }, { type: "string" }],
    },
    // {
    //     name: "addDisk",
    //     execute: addDisk,
    //     args: [{ type: "string" }, { type: "string" }],
    // },
    // {
    //     name: "startApp",
    //     execute: startApp,
    //     args: [{ type: "string" }, { type: "number" }],
    // },
    // {
    //     name: "addNetwork",
    //     execute: addNetwork,
    //     args: [{ type: "string" }, { type: "string" }, { type: "string" }, { type: "string" }],
    // },
    // {
    //     name: "addEngine",
    //     execute: addEngine,
    //     args: [{ type: "string" }],
    // },
];

export const enableEngineCommandsMonitor = () => {
    // Monitor our local engine for commands to be executed
    const localEngine = getEngine()
    subscribe(localEngine.commands, async (value) => {
        log(`LOCAL ENGINE ${localEngine.hostName} COMMANDS MONITOR: Engine ${localEngine.hostName} commands is modified as follows: ${deepPrint(value)}`)
        // Extract the command from the value and execute it
        const command = value[0][2] as string
        log(`Executing command: ${command}`)
        await handleCommand(commands, command)
    })
    log(`Added COMMANDS MONITOR for engine ${localEngine.hostName}`)
}

