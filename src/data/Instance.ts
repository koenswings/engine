import { $, YAML, chalk, os } from "zx";
import { log } from "../utils/utils.js";
import { DockerEvents, DockerMetrics, DockerLogs } from "./CommonTypes.js";
import { getLocalEngine } from "./Store.js";
import { Disk } from "./Disk.js";
import { getEngineInstances } from "./Engine.js";

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

export const createInstanceFromFile = async (instanceName: string, diskName: string, device: string): Promise<Instance> | undefined => {
    let instance: Instance
    try {
        const composeFile = await $`cat /disks/${device}/instances/${instanceName}/compose.yaml`
        const compose = YAML.parse(composeFile.stdout)
        const servicesImages = compose.services.map(service => service.image)
        const instance: Instance = {
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
    return instance
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
      await $`echo "port=${port}" > /disks/${disk.device}/instances/${instance.name}/.env`
  
  
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
  
      createInstanceContainers(instance, disk)
  
      // **************************
      // STEP 4 - run the Instance
      // **************************
  
      await runInstance(instance, disk)

      console.log(chalk.green(`App ${instance.name} started`))
    }
  
    catch (e) {
      console.log(chalk.red('Error starting app instance'))
      console.error(e)
    }
  }

  export const createInstanceContainers = async (instance: Instance, disk: Disk) => {
    try {
        await $`docker compose -f /disks/${disk.device}/instances/${instance.name}/compose.yaml create`
        instance.status = 'Pauzed'
    } catch (e) {
        console.log(chalk.red(`Error creating the containers of app instance ${instance.name}`))
        console.error(e)
    }   
  }

  export const runInstance = async (instance: Instance, disk: Disk) => {
    console.log(`Running instance '${instance.name}' on disk ${disk.name} of engine '${getLocalEngine().hostName}'.`)
  
    // CODING STYLE: only use absolute pathnames !
    // CODING STYLE: use try/catch for error handling
  
    try {
  
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
  