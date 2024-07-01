import { $, YAML, chalk, fs, os } from "zx";
import { log } from "../utils/utils.js";
import { DockerEvents, DockerMetrics, DockerLogs } from "./CommonTypes.js";
import { getLocalEngine } from "./Store.js";
import { Disk } from "./Disk.js";
import { findDiskByName, getEngineInstances } from "./Engine.js";
import { proxy } from "valtio";

export interface Instance {
  instanceOf: string;   // Reference by name since we can store the AppMaster object only once in Yjs
  name: string;
  status: Status;
  port: number;
  serviceImages: string[];
  dockerMetrics: DockerMetrics;
  dockerLogs: DockerLogs;
  dockerEvents: DockerEvents;
  created: number; // We must use a timestamp number as Date objects are not supported in YJS
  lastBackedUp: number; // We must use a timestamp number as Date objects are not supported in YJS
  lastStarted: number; // We must use a timestamp number as Date objects are not supported in YJS
  upgradable: boolean;
  backUpEnabled: boolean;
  //disk: Disk;
}

export type Status = 'Initializing' | 'Running' | 'Pauzed' | 'Error';


export const buildInstance = async (instanceName: string, typeName: string, gitAccount: string, version: string, device: string) => {
  console.log(`Building instance '${instanceName}' from version ${version} of app '${typeName}' on device '${device}' of the local engine.`)

  // CODING STYLE: only use absolute pathnames !
  // CODING STYLE: use try/catch for error handling

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
      await $`git clone https://github.com/${gitAccount}/app-${typeName} /tmp/apps/${typeName}`
      // Set appVersion to the latest commit hash
      const gitLog = await $`cd /tmp/apps/${typeName} && git log -n 1 --pretty=format:%H`
      appVersion = gitLog.stdout.trim()
      log(`App version: ${appVersion}`)

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
    let baseInstanceName = instanceName
    while (true) {
      try {
        await $`mkdir /disks/${device}/instances/${instanceName}`
        break
      } catch (e) {
        instanceNumber++
        instanceName = `${baseInstanceName}-${instanceNumber}`
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

    // Open the compose.yaml file of the app instance and add the version info to the compose file
    const composeFile = await $`cat /disks/${device}/instances/${instanceName}/compose.yaml`
    const compose = YAML.parse(composeFile.stdout)
    compose['x-app'].version = appVersion
    const composeYAML = YAML.stringify(compose)
    await $`echo ${composeYAML} > /disks/${device}/instances/${instanceName}/compose.yaml`

    // Remove the temporary app folder
    await $`rm -rf /tmp/apps/${typeName}`

    // **************************
    // STEP 3 - Persist the services
    // **************************

    // Extract the service images of the services from the compose file, and then pull them and save them in /services
    const services = compose.services
    for (const serviceName in services) {
      const serviceImage = services[serviceName].image
      // Pull the sercice image
      await $`docker image pull ${serviceImage}`
      // Save the sercice image
      await $`docker save ${serviceImage} > /disks/${device}/services/${serviceImage.replace(/\//g, '_')}.tar`
    }


    console.log(chalk.green(`App ${instanceName} built`))
  } catch (e) {
    console.log(chalk.red('Error building app instance'))
    console.error(e)
  }
}


export const createInstanceFromFile = async (instanceName: string, diskName: string, device: string): Promise<Instance> | undefined => {
  let instance: Instance
  try {
    const composeFile = await $`cat /disks/${device}/instances/${instanceName}/compose.yaml`
    const compose = YAML.parse(composeFile.stdout)
    const services = Object.keys(compose.services)
    const servicesImages = services.map(service => compose.services[service].image)
    instance = {
      instanceOf: compose['x-app'].name,
      name: instanceName,
      status: 'Initializing',
      port: 0,
      serviceImages: servicesImages,
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
  } catch (e) {
    log(chalk.red(`Error initializing instance ${instanceName} on disk ${diskName}`))
    console.error(e)
  }
  const $instance = proxy<Instance>(instance)
  return $instance
}


export const startInstance = async (instance: Instance, disk: Disk) => {
  console.log(`Starting instance '${instance.name}' on disk ${disk.name} of engine '${getLocalEngine().hostName}'.`)

  try {

    // **************************
    // STEP 1 - Port generation
    // **************************

    // Generate a port  number for the app  and assign it to the variable port
    // Start from port number 3000 and check if the port is already in use by another app
    // The port is in use by another app if an app can be found in networkdata with the same port
    let port = 3000
    const instances = getEngineInstances(getLocalEngine())
    while (true) {
      const inst = instances.find(instance => instance.port == port)
      if (inst) {
        port++
      } else {
        break
      }
    }
    console.log(`Port: ${port}`)

    // ALternative is to check the system for an occupied port
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
    await $`echo "port=${port}" > /disks/${disk.device}/instances/${instance.name}/.env`
    // Do not set the instance port member here - only set it when running the app

    // **************************
    // STEP 2 - Preloading of services
    // **************************

    // Extract the service images of the services from the compose file, and pull them
    // Open the compose.yaml file of the app instance
    const composeFile = await $`cat /disks/${disk.device}/instances/${instance.name}/compose.yaml`
    const compose = YAML.parse(composeFile.stdout)
    const services = compose.services
    for (const serviceName in services) {
      const serviceImage = services[serviceName].image
      // Load the service image from the saved tar file
      await $`docker image load < /disks/${disk.device}/services/${serviceImage.replace(/\//g, '_')}.tar`
    }

    // **************************
    // STEP 3 - Container creation
    // **************************

    await createInstanceContainers(instance, disk)

    // **************************
    // STEP 4 - run the Instance
    // **************************

    await runInstance(instance, disk)
  }

  catch (e) {
    console.log(chalk.red('Error starting app instance'))
    console.error(e)
  }
}

export const createInstanceContainers = async (instance: Instance, disk: Disk) => {
  try {
    log(`Creating containers of app instance '${instance.name}' on disk ${disk.name} of engine '${getLocalEngine().hostName}'.`)
    await $`docker compose -f /disks/${disk.device}/instances/${instance.name}/compose.yaml create`
    instance.status = 'Pauzed'
  } catch (e) {
    console.log(chalk.red(`Error creating the containers of app instance ${instance.name}`))
    console.error(e)
  }
}

export const runInstance = async (instance: Instance, disk: Disk) => {
  // CODING STYLE: only use absolute pathnames !
  // CODING STYLE: use try/catch for error handling
  try {

    log(`Running instance '${instance.name}' on disk ${disk.name} of engine '${getLocalEngine().hostName}'.`)

    // Extract the port number from the .env file containing "port=<portNumber>"
    const envContent = (await $`cat /disks/${disk.device}/instances/${instance.name}/.env`).stdout
    // Look for a line with port=<portNumber> and extract the portNumber
    const ports = envContent.match(/port=(\d+)/)
    if (ports && ports.length >= 1) {
      if (ports.length > 1) {
        log(chalk.yellowBright(`Warning: multiple port numbers found in .env file for instance ${instance.name}. Using the first one.`))
      }
      const parsedPort = parseInt(ports[0])
      // If parsedPort is not NaN, assign it to the instance port
      if (!isNaN(parsedPort)) {
        log(`Port number extracted from .env file for instance ${instance.name}: ${parsedPort}`)
        instance.port = parsedPort
      } else {
        log(chalk.red(`Error parsing port number from .env file for instance ${instance.name}. Got ${parsedPort} from ${envContent} and ${ports}`))
      }
    } else {
      log(chalk.red(`Error extracting port number from .env file for instance ${instance.name}`))
    }


    // Compose up the app
    await $`docker compose -f /disks/${disk.device}/instances/${instance.name}/compose.yaml up -d`

    // Modify the status of the instance
    instance.status = 'Running'
    // Modify the lastStarted time of the instance
    instance.lastStarted = new Date().getTime()
    // Modify the dockerMetrics of the instance
    instance.dockerMetrics = {
      memory: os.totalmem().toString(),
      cpu: os.loadavg().toString(),
      network: "",
      disk: ""
    }

    // Modify the dockerLogs of the instance
    // instance.dockerLogs = { logs: await $`docker logs ${instanceName}` }  // This is not correct, we need to use the right container name
    // Modify the dockerEvents of the instance
    // instance.dockerEvents = { events: await $`docker events ${instanceName}` }  // This is not correct, we need to use the right container name

    console.log(chalk.green(`App ${instance.name} running`))

  } catch (e) {

    console.log(chalk.red(`Error running app instance ${instance.name}`))
    console.error(e)

  }
}

export const stopInstance = async (instance: Instance, disk: Disk) => {
  console.log(`Stopping app '${instance.name}' on disk '${disk.name}' of engine '${getLocalEngine().hostName}'.`)

  // CODING STYLE: only use absolute pathnames !
  // CODING STYLE: use try/catch for error handling

  try {
    // Compose stop the app
    // Do it
    await $`docker compose -f /disks/${disk.device}/instances/${instance.name}/compose.yaml stop`
    console.log(chalk.green(`App ${instance.name} stopped`))
  } catch (e) {
    console.log(chalk.red(`Error stopping app instance ${instance.name}`))
    console.error(e)
  }
}
