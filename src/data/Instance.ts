import { $, YAML, chalk, fs, os } from "zx";
import { deepPrint, log, uuid } from "../utils/utils.js";
import { DockerEvents, DockerMetrics, DockerLogs, InstanceID, AppID, PortNumber, ServiceImage, Timestamp, Version, DeviceName, InstanceName, AppName, Hostname, DiskID } from "./CommonTypes.js";
import { Store, getDisk, getEngine, getLocalEngine, store } from "./Store.js";
import { Disk, addInstance } from "./Disk.js";
import { Engine, findDiskByDevice, findDiskByName, getEngineInstances } from "./Engine.js";
import { proxy } from "valtio";
import { Network, getEngines } from "./Network.js";
import { bind } from "../valtio-yjs/index.js";
import { create } from "domain";
import { createAppId } from "./App.js";
import { Docker } from "node-docker-api";

export interface Instance {
  id: InstanceID;
  instanceOf: AppID;   // Reference by name since we can store the AppMaster object only once in Yjs
  name: InstanceName;
  status: Status;
  port: PortNumber;
  serviceImages: ServiceImage[];
  dockerMetrics: DockerMetrics;
  dockerLogs: DockerLogs;
  dockerEvents: DockerEvents;
  created: Timestamp; // We must use a timestamp number as Date objects are not supported in YJS
  lastBackedUp: Timestamp; // We must use a timestamp number as Date objects are not supported in YJS
  lastStarted: Timestamp; // We must use a timestamp number as Date objects are not supported in YJS
  upgradable: boolean;
  backUpEnabled: boolean;
  diskId: DiskID;
}

export type Status = 'Initializing' | 'Running' | 'Pauzed' | 'Error';


export const buildInstance = async (instanceName: InstanceName, appName: AppName, gitAccount: string, version: Version, device: DeviceName): Promise<void> => {
  console.log(`Building instance '${instanceName}' from version ${version} of app '${appName}' on device '${device}' of the local engine.`)

  // CODING STYLE: only use absolute pathnames !
  // CODING STYLE: use try/catch for error handling

  let instanceId

  try {

    // Read the meta file on the disk and extract the disk id
    // Do it
    // const disk = findDiskByDevice(store, getLocalEngine(store), device)
    // if (!disk) {
    //   console.log(chalk.red(`Disk ${device} not found on engine ${getLocalEngine(store).hostname}`))
    //   return
    // } else {
    //   instanceId = createInstanceId(instanceName, appName, disk.id).toString() as InstanceID
    //   log(`Instance ID: ${instanceId}`)
    // } 
    const instanceId = createInstanceId(appName).toString() as InstanceID


    // Create the app infrastructure if it does not exist
    // TODO: This should be done when creating the disk
    // TODO: Here we should only be checking if it is an apps disk! 
    await $`mkdir -p /disks/${device}/apps /disks/${device}/services /disks/${device}/instances`

    // **************************
    // STEP 1 - App Type creation
    // **************************

    // Clone the app from the repository
    // Remove /tmp/apps/${typeName} if it exists
    await $`rm -rf /tmp/apps/${appName}`
    let appVersion = ""
    if (version === "latest_dev") {
      await $`git clone https://github.com/${gitAccount}/app-${appName} /tmp/apps/${appName}`
      // Set appVersion to the latest commit hash
      const gitLog = await $`cd /tmp/apps/${appName} && git log -n 1 --pretty=format:%H`
      appVersion = gitLog.stdout.trim()
      log(`App version: ${appVersion}`)

    } else {
      await $`git clone -b ${version} https://github.com/koenswings/app-${appName} /tmp/apps/${appName}`
      appVersion = version
    }


    // Create the app type
    // Overwrite if it exists
    // We want to copy the content of a directory and rename the directory at the same time: 
    //   See https://unix.stackexchange.com/questions/412259/how-can-i-copy-a-directory-and-rename-it-in-the-same-command
    await $`cp -fr /tmp/apps/${appName}/. /disks/${device}/apps/${appName}-${appVersion}/`


    // **************************
    // STEP 2 - App Instance creation
    // **************************

    // OLD
    // Create the app instance
    // If there is already a instance with the name instanceName, try instanceName-1, instanceName-2, etc.
    // let instanceNumber = 1
    // let baseInstanceName = instanceName 
    // while (true) {
    //   try {
    //     await $`mkdir /disks/${device}/instances/${instanceName}`
    //     break
    //   } catch (e) {
    //     instanceNumber++
    //     instanceName = `${baseInstanceName}-${instanceNumber}` as InstanceName
    //   }
    // }
    // Again use /. to specify the content of the dir, not the dir itself 
    await $`cp -fr /tmp/apps/${appName}/. /disks/${device}/instances/${instanceId}/`

    // If the app has an init_data.tar.gz file, unpack it in the app folder
    if (fs.existsSync(`/disks/${device}/instances/${instanceId}/init_data.tar.gz`)) {
      await $`tar -xzf /disks/${device}/instances/${instanceId}/init_data.tar.gz -C /disks/${device}/instances/${instanceId}`
      // Rename the folder init_data to data
      await $`mv /disks/${device}/instances/${instanceId}/init_data /disks/${device}/instances/${instanceId}/data`
      // Remove the init_data.tar.gz file
      await $`rm /disks/${device}/instances/${instanceId}/init_data.tar.gz`
    }

    // Open the compose.yaml file of the app instance and add the version info to the compose file and the instance name
    const composeFile = await $`cat /disks/${device}/instances/${instanceId}/compose.yaml`
    const compose = YAML.parse(composeFile.stdout)
    compose['x-app'].version = appVersion
    compose['x-app'].instanceName = instanceName
    const composeYAML = YAML.stringify(compose)
    await $`echo ${composeYAML} > /disks/${device}/instances/${instanceId}/compose.yaml`

    // Remove the temporary app folder
    await $`rm -rf /tmp/apps/${appName}`

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


    console.log(chalk.green(`Instance ${instanceId} built`))
  } catch (e) {
    console.log(chalk.red('Error building app instance'))
    console.error(e)
  }
}

export const createInstanceId = (appName:AppName): InstanceID => {
  const id = uuid()
  // return instanceName + "_on_" + diskId as InstanceID
  return appName + "-" + id as InstanceID
}

export const extractAppName = (instanceId: InstanceID): InstanceName => {
  // return instanceId.split('_on_')[0] as InstanceName
  return instanceId.split('-')[0] as InstanceName
}


export const createOrUpdateInstance = async (store: Store, instanceId: InstanceID, disk:Disk): Promise<Instance | undefined> => {
  let instance: Instance
  try {
    const composeFile = await $`cat /disks/${disk.device}/instances/${instanceId}/compose.yaml`
    const compose = YAML.parse(composeFile.stdout)
    const services = Object.keys(compose.services)
    const servicesImages = services.map(service => compose.services[service].image)
    // const instanceId = createInstanceId(instanceName, disk.id)  
    const instanceName = compose['x-app'].instanceName as InstanceName
    instance = {
      id: instanceId,
      instanceOf: createAppId(compose['x-app'].name, compose['x-app'].version) as AppID,
      name: instanceName,
      diskId: disk.id,
      status: 'Initializing',
      port: 0 as PortNumber,
      serviceImages: servicesImages,
      dockerMetrics: {
        memory: os.totalmem().toString(),
        cpu: os.loadavg().toString(),
        network: "",
        disk: ""
      },
      dockerLogs: { logs: [] },
      dockerEvents: { events: [] },
      created: new Date().getTime() as Timestamp,
      lastBackedUp: 0 as Timestamp,
      lastStarted: 0 as Timestamp,
      upgradable: false,
      backUpEnabled: false
    }
  } catch (e) {
    log(chalk.red(`Error initializing instance ${instanceId} on disk ${disk.id}`))
    console.error(e)
    return undefined
  }

  let $instance: Instance
  if (store.instanceDB[instance.id]) {
    // Update the app
    log(chalk.green(`Updating instance ${instanceId} on disk ${disk.id}`))
    $instance = store.instanceDB[instance.id]
  } else {
    // Create the app
    log(chalk.green(`Creating new instance ${instanceId} on disk ${disk.id}`))
    // @ts-ignore
    $instance = proxy<Instance>({
      id: instance.id
    })
    // Bind it to all networks
    bindInstance($instance, store.networks)
    // Add the app to the store
    store.instanceDB[instance.id] = $instance
  }

  $instance.instanceOf = instance.instanceOf
  $instance.name = instance.name
  $instance.diskId = instance.diskId
  $instance.status = instance.status
  $instance.port = instance.port
  $instance.serviceImages = instance.serviceImages
  $instance.dockerMetrics = instance.dockerMetrics
  $instance.dockerLogs = instance.dockerLogs
  $instance.dockerEvents = instance.dockerEvents
  $instance.created = instance.created
  $instance.lastBackedUp = instance.lastBackedUp
  $instance.lastStarted = instance.lastStarted
  $instance.upgradable = instance.upgradable
  $instance.backUpEnabled = instance.backUpEnabled

  return $instance
}

export const bindInstance = ($instance:Instance, networks:Network[]):void => {
  networks.forEach((network) => {
      // Bind the $engine proxy to the network
      const yEngine = network.doc.getMap($instance.id)
      network.unbind = bind($instance as Record<string, any>, yEngine)
      log(`Bound instance ${$instance.id} to network ${network.appnet.name}`)
  })
}


export const startAndAddInstance = async (store: Store, instance: Instance, disk: Disk): Promise<void> => {
  console.log(`Starting instance '${instance.id}' on disk ${disk.id} of engine '${getLocalEngine(store).hostname}'.`)

  try {

    // **************************
    // STEP 1 - Port generation
    // **************************

    // Generate a port  number for the app  and assign it to the variable port
    // Start from port number 3000 and check if the port is already in use by another app
    // The port is in use by another app if an app can be found in networkdata with the same port
    // let port = 3000
    // const instances = getEngineInstances(store, getLocalEngine(store))
    // console.log(`Searching for an available port number for instance ${instance.id}. Current instances: ${deepPrint(instances)}.`)
    // while (true) {
    //   const inst = instances.find(instance => instance && instance.port == port)
    //   if (inst) {
    //     port++
    //   } else {
    //     break
    //   }
    // }


    // Find the container
    const docker = new Docker({ socketPath: '/var/run/docker.sock' });
    const containers = await docker.container.list()
    containers.forEach(container => {
      console.log(container.data['Names'][0])
    })
    const container = containers.find(container => container.data['Names'][0].includes(instance.id))
    let port
    if (container) {
      port = parseInt(container.data['Ports'][0]['PublicPort'])
      log(`Found a container for instance ${instance.id} running on port ${port}`)
    } else {
      log(`No container found for instance ${instance.id}. Generating a new port number.`)
      // Alternative is to check the system for an occupied port
      // await $`netstat -tuln | grep ${port}`
      port = 3000
      let portInUse = true
      let portInUseResult
      const instances = getEngineInstances(store, getLocalEngine(store))
      while (portInUse) {
          log(`Checking if port ${port} is in use`)
          try {
            portInUseResult = await $`netstat -tuln | grep ${port}`
            log(`Port ${port} is in use`)
            port++
          } catch (e) {
            log(`Port ${port} is not in use. Checking if it is used by another instance`)
            const inst = instances.find(instance => instance && instance.port == port)
            if (inst) {
              log(`Port ${port} is used by another instance`)
              port++
            } else {
              log(`Port ${port} is not used by another instance`)
              portInUse = false
            }
          }
      }
    }

    console.log(`Found a port number for instance ${instance.id}: ${port}`)
    instance.port = port as PortNumber

    // Write a .env file in which you define the port variable
    // Do it
    await $`echo "port=${port}" > /disks/${disk.device}/instances/${instance.id}/.env`
    // Do not set the instance port member here - only set it when running the app

    // **************************
    // STEP 2 - Preloading of services
    // **************************

    // Extract the service images of the services from the compose file, and pull them
    // Open the compose.yaml file of the app instance
    const composeFile = await $`cat /disks/${disk.device}/instances/${instance.id}/compose.yaml`
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

    await createInstanceContainers(store, instance, disk)

    // **************************
    // STEP 4 - run the Instance
    // **************************

    await runInstance(store, instance, disk)
  }

  catch (e) {
    console.log(chalk.red('Error starting app instance'))
    console.error(e)
  }

  addInstance(store, disk, instance)

}

export const createInstanceContainers = async (store: Store, instance: Instance, disk: Disk) => {
  try {
    log(`Creating containers of app instance '${instance.id}' on disk ${disk.id} of engine '${getLocalEngine(store).hostname}'.`)
    // await $`docker compose -f /disks/${disk.device}/instances/${instance.id}/compose.yaml create`
    await $`cd /disks/${disk.device}/instances/${instance.id} && docker compose create`
    instance.status = 'Pauzed'
  } catch (e) {
    console.log(chalk.red(`Error creating the containers of app instance ${instance.id}`))
    console.error(e)
  }
}

export const runInstance = async (store: Store, instance: Instance, disk: Disk): Promise<void> => {
  // CODING STYLE: only use absolute pathnames !
  // CODING STYLE: use try/catch for error handling
  try {

    log(`Running instance '${instance.id}' on disk ${disk.id} of engine '${getLocalEngine(store).hostname}'.`)

    // Extract the port number from the .env file containing "port=<portNumber>"
    const envContent = (await $`cat /disks/${disk.device}/instances/${instance.id}/.env`).stdout
    // Look for a line with port=<portNumber> and extract the portNumber
    // const ports = envContent.match(/port=(\d+)/g)
    // Split using '=' and take the second element
    // Also remove the newline at the end
    const port = envContent.split('=')[1].slice(0, -1)
    console.log(`Ports: ${deepPrint(port)}`)
    if (port) {
      const parsedPort = parseInt(port)
      // If parsedPort is not NaN, assign it to the instance port
      if (!isNaN(parsedPort)) {
        log(`Port number extracted from .env file for instance ${instance.id}: ${parsedPort}`)
        instance.port = parsedPort as PortNumber
      } else {
        log(chalk.red(`Error parsing port number from .env file for instance ${instance.id}. Got ${parsedPort} from ${envContent} and ${port}`))
      }
    } else {
      log(chalk.red(`Error extracting port number from .env file for instance ${instance.id}`))
    }


    // Compose up the app
    //await $`docker compose -f /disks/${disk.device}/instances/${instance.id}/compose.yaml up -d`
    await $`cd /disks/${disk.device}/instances/${instance.id} && docker compose up -d`

    // Modify the status of the instance
    instance.status = 'Running'
    // Modify the lastStarted time of the instance
    instance.lastStarted = new Date().getTime() as Timestamp
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

    console.log(chalk.green(`App ${instance.id} running`))

  } catch (e) {

    console.log(chalk.red(`Error running app instance ${instance.id}`))
    console.error(e)
    instance.status = 'Error'

  }
}

export const stopInstance = async (store: Store, instance: Instance, disk: Disk): Promise<void> => {
  console.log(`Stopping app '${instance.id}' on disk '${disk.id}' of engine '${getLocalEngine(store).hostname}'.`)

  // CODING STYLE: only use absolute pathnames !
  // CODING STYLE: use try/catch for error handling

  try {
    // Compose stop the app
    // Do it
    // await $`docker compose -f /disks/${disk.device}/instances/${instance.id}/compose.yaml stop`
    await $`cd /disks/${disk.device}/instances/${instance.id} && docker compose stop`
    console.log(chalk.green(`App ${instance.id} stopped`))
  } catch (e) {
    console.log(chalk.red(`Error stopping app instance ${instance.id}`))
    console.error(e)
  }
}


export const getEngineOfInstance = (store: Store, instance: Instance): Engine => {
  const disk = getDisk(store, instance.diskId)
  const engine = getEngine(store, disk.engineId)
  return engine 
}