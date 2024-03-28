import { addInstance, engineApps, getDisk, getEngine } from '../data/store.js'
import { subscribe } from 'valtio'
import { log, deepPrint } from '../utils/utils.js'
import { handleCommand } from '../utils/commandHandler.js'
import { App, Instance, Command, Status } from '../data/dataTypes.js'
import { monitorNetwork, unmonitorNetwork } from './networkMonitor.js'
import { $, question, chalk, cd, YAML, fs, os } from 'zx';


const attachNetwork = (iface: string, networkName: string) => {
    monitorNetwork(iface, networkName)
}

const detachNetwork = (iface: string, networkName: string) => {
    unmonitorNetwork(iface, networkName)
}

// const createDisk = async (disk: string) => {
//     log(`Creating an internal disk ${disk} on engine ${getEngine().hostName}`)

//     // Check if the supplied disk name does not start with sd
//     if (disk.startsWith('sd')) {
//         console.log(chalk.red('Disk name cannot start with "sd"'))
//         return
//     }

//     try {
//         await $`mkdir -p /disks/${disk}`
//         console.log(chalk.green(`Internal disk ${disk} of engine ${getEngine().hostName} created`))
//     } catch (e) {
//         console.log(chalk.red('Error creating internal disk'))
//         console.error(e)
//     }
// }


const createApp = async (instanceName: string, typeName: string, version: string, diskName: string) => {
    console.log(`Creating instance '${instanceName}' from version ${version} of app '${typeName}' on disk '${diskName}' of engine '${getEngine().hostName}'.`)

    // CODING STYLE: only use absolute pathnames !
    // CODING STYLE: use try/catch for error handling

    const disk = getDisk(diskName)
    let device
    if (disk) {
        device = disk.device
    } else {
        console.log(chalk.red(`Disk ${diskName} not found on engine ${getEngine().hostName}`))
        return
    }

    try {

        // Create the app infrastructure if it does not exist
        // TODO: This should be done when creating the disk
        // TODO: Here we should only be checking if it is an apps disk! 
        await $`mkdir -p /disks/${device}/apps /disks/${device}/services /disks/${device}/instances`


        // **************************
        // STEP 1 - App Type creation
        // **************************

        // Clone the app from the repository
        // Remove /tmp/apps/${typeName} if it exists
        await $`rm -rf /tmp/apps/${typeName}`
        let appVersion = ""
        if (version === "latest_dev") {
            await $`git clone https://github.com/koenswings/app-${typeName} /tmp/apps/${typeName}`
            // Set appVersion to the latest commit hash
            const gitLog = await $`git log -n 1 --pretty=format:%H`
            appVersion = gitLog.stdout

        } else {
            await $`git clone -b ${version} https://github.com/koenswings/app-${typeName} /tmp/apps/${typeName}`
            appVersion = version
        }


        // Create the app type
        // Overwrite if it exists
        // We want to copy the content of a directory and rename the directory at the same time: 
        //   See https://unix.stackexchange.com/questions/412259/how-can-i-copy-a-directory-and-rename-it-in-the-same-command
        await $`cp -fr /tmp/apps/${typeName}/. /disks/${device}/apps/${typeName}-${appVersion}/`


        // **************************
        // STEP 2 - App Instance creation
        // **************************

        // Create the app instance
        // If there is already a instance with the name instanceName, try instanceName-1, instanceName-2, etc.
        let instanceNumber = 1
        while (true) {
            try {
                await $`mkdir /disks/${device}/instances/${instanceName}`
                break
            } catch (e) {
                instanceNumber++
                instanceName = `${instanceName}-${instanceNumber}`
            }
        }
        // Again use /. to specify the content of the dir, not the dir itself 
        await $`cp -fr /tmp/apps/${typeName}/. /disks/${device}/instances/${instanceName}/`

        // If the app has an init_data.tar.gz file, unpack it in the app folder
        if (fs.existsSync(`/disks/${device}/instances/${instanceName}/init_data.tar.gz`)) {
            await $`tar -xzf /disks/${device}/instances/${instanceName}/init_data.tar.gz -C /disks/${device}/instances/${instanceName}`
            // Rename the folder init_data to data
            await $`mv /disks/${device}/instances/${instanceName}/init_data /disks/${device}/instances/${instanceName}/data`
            // Remove the init_data.tar.gz file
            await $`rm /disks/${device}/instances/${instanceName}/init_data.tar.gz`
        }

        // Remove the temporary app folder
        await $`rm -rf /tmp/apps/${typeName}`

        // Open the compose.yaml file of the app and read its version 
        const composeFile = await $`cat /tmp/apps/${typeName}/compose.yaml`
        const compose = YAML.parse(composeFile.stdout)

        // Add the version info to the compose file
        compose['x-meta'].version = appVersion
        const composeYAML = YAML.stringify(compose)
        await $`echo ${composeYAML} > /disks/${device}/instances/${instanceName}/compose.yaml`

        const app:App = {
            name: typeName,
            version: appVersion,
            title: compose['x-meta'].title,
            description: compose['x-meta'].description,
            url: compose['x-meta'].url,
            category: compose['x-meta'].category,
            icon: compose['x-meta'].icon,
            author: compose['x-meta'].author
        }

        // Add the app to the local engine
        const instance:Instance = {
            instanceOf: app.name,
            name: instanceName,
            status: 'Stopped' as Status,
            port: 0,
            dockerMetrics: {
                memory: os.totalmem().toString(),
                cpu: os.loadavg().toString(),
                network: "",
                disk: ""
            },
            dockerLogs: { logs: [] },
            dockerEvents: { events: [] },
            created: new Date().getTime(),
            lastBackedUp: 0,
            lastStarted: 0,
            upgradable: false,
            backUpEnabled: false
        }
        
        addInstance(disk, app, instance)

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

        await $`docker compose -f /disks/${device}/instances/${instanceName}/compose.yaml create`
    
        console.log(chalk.green(`App ${instanceName} created`))
    } catch (e) {
        console.log(chalk.red('Error creating app instance'))
        console.error(e)
    }
}


const runApp = async (instanceName: string, diskName:string) => {
    console.log(`Running instance '${instanceName}' on disk ${diskName} of engine '${getEngine().hostName}'.`)

    // CODING STYLE: only use absolute pathnames !
    // CODING STYLE: use try/catch for error handling

    // Find out on which disk this app is running by finding the disk object that has this app instance in its instances array
    // const disk = getEngine().disks.find(disk => disk.instances.find(instance => instance.name === instanceName))
    
    // Check if disk exists
    const disk = getDisk(diskName)
    if (!disk) {
        console.log(chalk.red(`Disk ${diskName} not found on engine ${getEngine().hostName}`))
        return
    }
    const device = disk.device

    // Check if the instance exists
    const instance = disk.instances.find(instance => instance.name === instanceName)
    if (!instance) {
        console.log(chalk.red(`Instance ${instanceName} not found on disk ${diskName}`))
        return
    }

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
        await $`echo "port=${port}" > /disks/${device}/instances/${instanceName}/.env`

        // Compose up the app
        // Do it
        await $`docker compose -f /disks/${device}/instances/${instanceName}/compose.yaml up -d`
        console.log(chalk.green(`App ${instanceName} running`))
    } catch (e) {
        console.log(chalk.red('Error running app instance'))
        console.error(e)
    }
}

const stopApp = async (instanceName: string, diskName: string) => {
    console.log(`Stopping app '${instanceName}' on disk '${diskName}' of engine '${getEngine().hostName}'.`)

    // CODING STYLE: only use absolute pathnames !
    // CODING STYLE: use try/catch for error handling

    // Find out on which disk this app is running by finding the disk object that has this app instance in its instances array
    // const disk = getEngine().disks.find(disk => disk.instances.find(instance => instance.name === instanceName))

    // Check if disk exists
    const disk = getDisk(diskName)
    if (!disk) {
        console.log(chalk.red(`Disk ${diskName} not found on engine ${getEngine().hostName}`))
        return
    }
    const device = disk.device

    // Check if the instance exists
    const instance = disk.instances.find(instance => instance.name === instanceName)
    if (!instance) {
        console.log(chalk.red(`Instance ${instanceName} not found on disk ${diskName}`))
        return
    }

    try {
        // Compose stop the app
        // Do it
        await $`docker compose -f /disks/${device}/instances/${instanceName}/compose.yaml stop`
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
    // {
    //     name: "createDisk",
    //     execute: createDisk,
    //     args: [{ type: "string" }],
    // },
    {
        name: "createApp",
        execute: createApp,
        args: [{ type: "string" }, { type: "string" }, { type: "string" }, { type: "string" }],
    },
    {
        name: "runApp",
        execute: runApp,
        args: [{ type: "string" }, { type: "string" }],
    },
    {
        name: "stopApp",
        execute: stopApp,
        args: [{ type: "string" }, { type: "string" }],
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

