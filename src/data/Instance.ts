import { $, YAML, chalk, fs, os, sleep } from "zx";
import { addOrUpdateEnvVariable, deepPrint, log, randomPort, readEnvVariable, uuid } from "../utils/utils.js";
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
import { read } from "fs";
import { createMeta } from '../data/Meta.js'
import { get } from "http";
import { add } from "lib0/math.js";


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
  console.log(`Building new instance '${instanceName}' from version ${version} of app '${appName}' on device '${device}' of the local engine.`)

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
    log(`Instance ID: ${instanceId}`)


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
    console.log(`Cloning version ${version} of app ${appName} from git account ${gitAccount}`)
    if (version === "latest_dev") {
      console.log(`Cloning the latest development version of app ${appName} from git account ${gitAccount}`)
      await $`git clone https://github.com/${gitAccount}/app-${appName} /tmp/apps/${appName}`
      // Set appVersion to the latest commit hash
      const gitLog = await $`cd /tmp/apps/${appName} && git log -n 1 --pretty=format:%H`
      appVersion = gitLog.stdout.trim()
      console.log(`App version: ${appVersion}`)

    } else {
      console.log(`Cloning version ${version} of app ${appName} from git account ${gitAccount}`)
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
      console.log(`Unpacking the init_data.tar.gz file in the app folder`)
      await $`tar -xzf /disks/${device}/instances/${instanceId}/init_data.tar.gz -C /disks/${device}/instances/${instanceId}`
      // Rename the folder init_data to data
      await $`mv /disks/${device}/instances/${instanceId}/init_data /disks/${device}/instances/${instanceId}/data`
      // Remove the init_data.tar.gz file
      await $`rm /disks/${device}/instances/${instanceId}/init_data.tar.gz`
    }
    // Not needed as Docker will auto-create any data folder we specify in the compose
    // } else {
    //   // Create an empty data folder
    //   await $`mkdir /disks/${device}/instances/${instanceId}/data`
    // }

    // Open the compose.yaml file of the app instance and add the version info to the compose file and the instance name
    console.log(`Opening the compose.yaml file of the app instance and adding the version info to the compose file (${appVersion}) and the instance name (${instanceName})`)
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
      console.log(`Pulling service image ${serviceImage}`)
      await $`docker image pull ${serviceImage}`
      // Save the sercice image
      await $`docker save ${serviceImage} > /disks/${device}/services/${serviceImage.replace(/\//g, '_')}.tar`
    }

    // **************************
    // STEP 4 - Create the META.yaml file if it is not already there
    // **************************

    if (!fs.existsSync(`/META.yaml`)) {
      createMeta(device)
    }

    // OBSOLETE 
    // Create the META.yaml file
    // Do it
    // await addMetadata(instanceId)
    // console.log(chalk.blue('Adding metadata...'));
    // try {
    //     // Convert the diskMetadata object to a YAML string 
    //     // const diskMetadataYAML = YAML.stringify(diskMetadata)
    //     // fs.writeFileSync('./script/build_image_assets/META.yaml', diskMetadataYAML)
    //     // // Copy the META.yaml file to the remote machine using zx
    //     // await copyAsset('META.yaml', '/')
    //     // await $$`echo '${YAML.stringify(diskMetadata)}' | sudo tee /META.yaml`;

    //     const metaPath = ''

    //     // Read the hardware ID if the disk


    //     await $`sudo echo 'created: ${new Date().getTime()}' >> ${metaPath}/META.yaml`
    //     await $`sudo echo 'diskId: ${name}-disk' >> ${metaPath}/META.yaml`
    //     // Move the META.yaml file to the root directory
    //     await $`sudo mv ${metaPath}/META.yaml /META.yaml`
    // } catch (e) {
    //   console.log(chalk.red('Error adding metadata'));
    //   console.error(e);
    //   process.exit(1);
    // }



    console.log(chalk.green(`Instance ${instanceId} built`))
  } catch (e) {
    console.log(chalk.red('Error building app instance'))
    console.error(e)
  }
}

export const createInstanceId = (appName: AppName): InstanceID => {
  const id = uuid()
  // return instanceName + "_on_" + diskId as InstanceID
  return appName + "-" + id as InstanceID
}

export const extractAppName = (instanceId: InstanceID): InstanceName => {
  // return instanceId.split('_on_')[0] as InstanceName
  return instanceId.split('-')[0] as InstanceName
}


export const createOrUpdateInstance = async (store: Store, instanceId: InstanceID, disk: Disk): Promise<Instance | undefined> => {
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

export const bindInstance = ($instance: Instance, networks: Network[]): void => {
  networks.forEach((network) => {
    // Bind the $engine proxy to the network
    const yEngine = network.doc.getMap($instance.id)
    network.unbind = bind($instance as Record<string, any>, yEngine)
    log(`Bound instance ${$instance.id} to network ${network.appnet.name}`)
  })
}

export const createPortNumber = async ():Promise<PortNumber> => {
    let port = randomPort()
    let portInUse = true
    let portInUseResult
    const instances = getEngineInstances(store, getLocalEngine(store))

    // Check if the port is already in use on the system
    while (portInUse) {
      log(`Checking if port ${port} is in use`)
      try {
        portInUseResult = await $`netstat -tuln | grep ${port}`
        log(`Port ${port} is in use`)
        port = randomPort()
      } catch (e) {
        log(`Port ${port} is not in use. Checking if it is reserved by another instance`)
        const inst = instances.find(instance => instance && instance.port == port)
        if (inst) {
          log(`Port ${port} is reserved by another instance. Generating a new one.`)
          //port++
          port = randomPort()
        } else {
          log(`Port ${port} is not reserved by another instance`)
          portInUse = false
        }
      }
    }
  return port
}

export const startInstance = async (store: Store, instance: Instance, disk: Disk): Promise<void> => {
  console.log(`Starting instance '${instance.id}' on disk ${disk.id} of engine '${getLocalEngine(store).hostname}'.`)

  try {

    // Create an empty .env file if it does not yet exist
    if (!fs.existsSync(`/disks/${disk.device}/instances/${instance.id}/.env`)) {
      await $`touch /disks/${disk.device}/instances/${instance.id}/.env`
    }

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

    let port:PortNumber = 0 as PortNumber

    // Check if the port is defined in the .env file
    try {
      log(`Trying to find a port number for instance ${instance.id} in the .env file`)
      // const envContent = (await $`cat /disks/${disk.device}/instances/${instance.id}/.env`).stdout
      // port = parseInt(envContent.split('=')[1].slice(0, -1)) as PortNumber
      port = parseInt(await readEnvVariable(`/disks/${disk.device}/instances/${instance.id}/.env`, 'port') as string) as PortNumber 
    } catch (e) {
      log(`No .env file found for instance ${instance.id}`)
    }
    // Check if port is undefined or NaN
    if (!(port == 0) && !isNaN(port)) {
      log(`Found a port number for instance ${instance.id} in the .env file: ${port}`)
    } else {
      log(`No port number has previously been generated. Generating a new port number.`)
      port = await createPortNumber()
      // Write a .env file in which you define the port variable
      // await $`echo "port=${port}" > /disks/${disk.device}/instances/${instance.id}/.env`  
      await addOrUpdateEnvVariable(`/disks/${disk.device}/instances/${instance.id}/.env`, 'port', port.toString())  
    }

    console.log(`Found a port number for instance ${instance.id}: ${port}`)
    instance.port = port as PortNumber

    // **************************
    // STEP 1b - Generate a password for the app
    // **************************

    let pass:string = ""

    // Check if the pass is already defined in the .env file
    try {
      log(`Trying to find a pass for instance ${instance.id} in the .env file`)
      pass = await readEnvVariable(`/disks/${disk.device}/instances/${instance.id}/.env`, 'pass') as string
    } catch (e) {
      log(`No .env file found for instance ${instance.id}`)
    }
    // Check if port is undefined or NaN
    if (pass && !(pass == "")) {
      log(`Found a pass for instance ${instance.id} in the .env file: ${pass}`)
    } else {
      log(`No pass has previously been generated. Generating a new pass.`)
      pass = await uuid()
      log(`Generated pass: ${pass}`)
      // Write the password to the .env file
      await addOrUpdateEnvVariable(`/disks/${disk.device}/instances/${instance.id}/.env`, 'pass', pass) 
}
    

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
}


// export const oldStartInstance = async (store: Store, instance: Instance, disk: Disk): Promise<void> => {
//   console.log(`Starting instance '${instance.id}' on disk ${disk.id} of engine '${getLocalEngine(store).hostname}'.`)

//   try {



//     // **************************
//     // STEP 1 - Port generation
//     // **************************

//     // Generate a port  number for the app  and assign it to the variable port
//     // Start from port number 3000 and check if the port is already in use by another app
//     // The port is in use by another app if an app can be found in networkdata with the same port
//     // let port = 3000
//     // const instances = getEngineInstances(store, getLocalEngine(store))
//     // console.log(`Searching for an available port number for instance ${instance.id}. Current instances: ${deepPrint(instances)}.`)
//     // while (true) {
//     //   const inst = instances.find(instance => instance && instance.port == port)
//     //   if (inst) {
//     //     port++
//     //   } else {
//     //     break
//     //   }
//     // }

//     let port

//     // Find the container
//     log(`Trying to find a running container with the same instance id amongst the following running containers:`)
//     const docker = new Docker({ socketPath: '/var/run/docker.sock' });
//     const containers = await docker.container.list()
//     containers.forEach(container => {
//       console.log(container.data['Names'][0])
//     })
//     const container = containers.find(container => container.data['Names'][0].includes(instance.id))
//     if (container) {
//       port = parseInt(container.data['Ports'][0]['PublicPort'])
//       log(`Found a container for instance ${instance.id} running on port ${port}`)
//     } else {
//       // Check if the port is defined in the .env file
//       try {
//         log(`Trying to find a port number for instance ${instance.id} in the .env file`)
//         const envContent = (await $`cat /disks/${disk.device}/instances/${instance.id}/.env`).stdout
//         port = envContent.split('=')[1].slice(0, -1)
//       } catch (e) {
//         log(`No .env file found for instance ${instance.id}`)
//       }
//       if (port) {
//         log(`Found a port number for instance ${instance.id} in the .env file: ${port}`)
//       } else {
//         log(`No container found for instance ${instance.id} and no port number has previously been generated. Generating a new port number.`)
//         // Alternative is to check the system for an occupied port
//         // await $`netstat -tuln | grep ${port}`
//         // port = 3000
//         port = randomPort()
//       }
//     }

//     // Check if the port is already in use on the system
//     let portInUse = true
//     let portInUseResult
//     const instances = getEngineInstances(store, getLocalEngine(store))
//     while (portInUse) {
//       log(`Checking if port ${port} is in use`)
//       try {
//         portInUseResult = await $`netstat -tuln | grep ${port}`
//         log(`Port ${port} is in use`)
//         port++
//       } catch (e) {
//         log(`Port ${port} is not in use. Checking if it is reserved by another instance`)
//         const inst = instances.find(instance => instance && instance.port == port)
//         if (inst) {
//           log(`Port ${port} is reserved by another instance. Generating a new one.`)
//           //port++
//           port = randomPort()
//         } else {
//           log(`Port ${port} is not reserved by another instance`)
//           portInUse = false
//         }
//       }
//     }

//     console.log(`Found a port number for instance ${instance.id}: ${port}`)
//     instance.port = port as PortNumber

//     // Update the .env file
//     await addOrUpdateEnvVariable(`/disks/${disk.device}/instances/${instance.id}/.env`, 'port', port.toString())  
//     // await $`echo "port=${port}" > /disks/${disk.device}/instances/${instance.id}/.env`
//     // Do not set the instance port member here - only set it when running the app

//     // **************************
//     // STEP 2 - Preloading of services
//     // **************************

//     // Extract the service images of the services from the compose file, and pull them
//     // Open the compose.yaml file of the app instance
//     const composeFile = await $`cat /disks/${disk.device}/instances/${instance.id}/compose.yaml`
//     const compose = YAML.parse(composeFile.stdout)
//     const services = compose.services
//     for (const serviceName in services) {
//       const serviceImage = services[serviceName].image
//       // Load the service image from the saved tar file
//       await $`docker image load < /disks/${disk.device}/services/${serviceImage.replace(/\//g, '_')}.tar`
//     }

//     // **************************
//     // STEP 3 - Container creation
//     // **************************

//     await createInstanceContainers(store, instance, disk)

//     // **************************
//     // STEP 4 - run the Instance
//     // **************************

//     await runInstance(store, instance, disk)
//   }

//   catch (e) {
//     console.log(chalk.red('Error starting app instance'))
//     console.error(e)
//   }
// }

export const createInstanceContainers = async (store: Store, instance: Instance, disk: Disk) => {
  try {

    // App-specific pre-processing commands
    const app = store.appDB[instance.instanceOf]
    if (app && app.name === 'nextcloud') {

      // Pass the hostname to the compose file via .env
      const hostname = getLocalEngine(store).hostname
      if (hostname) {
        await addOrUpdateEnvVariable(`/disks/${disk.device}/instances/${instance.id}/.env`, 'hostname', hostname)
      }

      // Pass the ip address to the compose file via .env
      // TODO - We hardcoded eth0 as the interface to use, but we should be using an ip of one of the allowed interface !!
      const interfaces = getLocalEngine(store).connectedInterfaces
      if (interfaces && interfaces["eth0"]) {
        const ip = interfaces["eth0"].ip4
        // Write the ip address to the .env file
        // await $`echo "ip=${ip}" >> /disks/${disk.device}/instances/${instance.id}/.env`
        await addOrUpdateEnvVariable(`/disks/${disk.device}/instances/${instance.id}/.env`, 'ip', ip)
      } 

    }

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
  try {

    log(`Running instance '${instance.id}' on disk ${disk.id} of engine '${getLocalEngine(store).hostname}'.`)

    // Extract the port number from the .env file containing "port=<portNumber>"
    // const envContent = (await $`cat /disks/${disk.device}/instances/${instance.id}/.env`).stdout
    // Look for a line with port=<portNumber> and extract the portNumber
    // const ports = envContent.match(/port=(\d+)/g)
    // Split using '=' and take the second element
    // Also remove the newline at the end
    //const port = envContent.split('=')[1].slice(0, -1)
    const port = await readEnvVariable(`/disks/${disk.device}/instances/${instance.id}/.env`, 'port')
    console.log(`Ports: ${deepPrint(port)}`)
    if (port) {
      const parsedPort = parseInt(port)
      // If parsedPort is not NaN, assign it to the instance port
      if (!isNaN(parsedPort)) {
        log(`Port number extracted from .env file for instance ${instance.id}: ${parsedPort}`)
        instance.port = parsedPort as PortNumber
      } else {
        log(chalk.red(`Error parsing port number from .env file for instance ${instance.id}. Got ${parsedPort} from ${port}`))
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

    // App-specific post-processing commands
    // If the app on which the instance is based is nextcloud, 
    //    find the IP address of the server and store it in IPADDRESS
    //    issue the following command: runuser --user www-data -- php occ config:app:set --value=http://<${PADDRESS}:9980 richdocuments wopi_url
    const app = store.appDB[instance.instanceOf]
    const ip = await readEnvVariable(`/disks/${disk.device}/instances/${instance.id}/.env`, 'ip')
    if (app && app.name === 'nextcloud') {
      if (ip) {
        try {
          // For unclear reasons, the occ command sometimes does not work, preventing the start of the container
          // So we catch the error so that the container can still start
          log(`Configuring nextcloud office to use the Collabora server at ${ip}:9980`)
          log('Sleeping for 10 seconds to allow the app to start')
          await sleep(10000)
          log('Running the occ command')
          await $`sudo docker exec ${instance.id}-nextcloud-app-1 runuser --user www-data -- php occ config:app:set --value=http://${ip}:9980 richdocuments wopi_url`
          log(`occ command executed`)
        } catch (e) {
          log(chalk.red(`Error configuring nextcloud office to use the Collabora server at ${ip}:9980`))
          console.error(e)
        }
      }
    }


  } catch (e) {

    console.log(chalk.red(`Error running app instance ${instance.id}`))
    console.error(e)
    instance.status = 'Error'

  }
}

export const stopInstance = async (store: Store, instance: Instance, disk: Disk): Promise<void> => {
  console.log(`Stopping app '${instance.id}' on disk '${disk.id}' of engine '${getLocalEngine(store).hostname}'.`)

  // Old implementation using Docker Compose
  // Problem with this approach: stopping an instance is not possible when its disk has already been removed
  // try {
  //   // Compose stop the app
  //   // Do it
  //   // await $`docker compose -f /disks/${disk.device}/instances/${instance.id}/compose.yaml stop`
  //   await $`cd /disks/${disk.device}/instances/${instance.id} && docker compose down`
  //   console.log(chalk.green(`App ${instance.id} stopped`))
  // } catch (e) {
  //   console.log(chalk.red(`Error stopping app instance ${instance.id}`))
  //   console.error(e)
  // }

  // New implementation using Docker API
  try {
    // Find all containers running in the compose started by the instance
    // NOTE: this implementation requires all containers of an instance to be namespaced with the instance id
    log(`Filter for all running containers whose names start with the instance id`)
    const docker = new Docker({ socketPath: '/var/run/docker.sock' });
    const containers = await docker.container.list()
    const instanceContainers = containers.filter(container => container.data['Names'][0].includes(instance.id))
    // Log the containers
    log(`Found the following containers:`)
    instanceContainers.forEach(container => {
      log(container.data['Names'][0])
    })
    for (let container of instanceContainers) {
      // First try to stop the container gracefully  If that does not work, kill it  
      try {
        log(`Stopping container ${container.data['Names'][0]} for instance ${instance.id}`)
        await container.stop()
        log(`Stopped container for instance ${instance.id}`)
      } catch (e) {
        log(`Error stopping container for instance ${instance.id}. Killing it instead.`)
        await container.kill()
        log(`Killed container for instance ${instance.id}`)
      }
    } 
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

