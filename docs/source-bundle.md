# Project Source Code Context
Generated on 2026-02-18T11:47:32.753Z

## File: package.json
```typescript
{
  "name": "engine",
  "version": "1.0",
  "description": "",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "install_packages": "pnpm install --no-frozen-lockfile",
    "start": "tsc && node dist/src/index.js",
    "startDB": "tsc && YPERSISTENCE=./yjs-db node dist/src/index.js",
    "dev": "nodemon --watch 'src/**/*' -e ts,tsx --exec 'tsc && VERBOSITY=3 node dist/src/index.js'",
    "devDB": "nodemon --watch 'src/**/*' -e ts,tsx --exec 'tsc && YPERSISTENCE=./yjs-db VERBOSITY=3 node dist/src/index.js'",
    "devreset": "pnpm reset && nodemon --watch 'src/**/*' -e ts,tsx --exec 'tsc && YPERSISTENCE=./yjs-db node dist/src/index.js'",
    "devtest": "tsc --build --clean && tsc && mocha --bail --reporter list 'dist/test/*.js' --exit",
    "pm2start": "tsc && VERBOSITY=3 pm2 start dist/src/index.js --watch",
    "tsc": "tsc",
    "sync": "rsync -av --exclude='node_modules' --exclude='.git' --exclude='dist' --exclude='scratchpad' --exclude='.vscode' --exclude='.pnpm-store' ./ pi@raspberrypi.local:/home/pi/engine",
    "reset": "chmod +x script/reset && script/reset",
    "ptest": "tsc && YPERSISTENCE=./yjs-db node dist/src/test.js",
    "test3": "mocha --config x.mocharc.json --es-module-specifier-resolution=node --reporter list 'test/*.ts'",
    "test2": "mocha --config x.mocharc.json --import=tsx --reporter list 'test/*.ts'",
    "test1": "mocha --require ts-node/register --extensions ts,tsx --loader ts-node/esm --reporter list 'test/*.ts' --exit",
    "cleanOld": "tsc --build --clean",
    "clean": "rm -fr dist/*",
    "build": "pnpm clean && tsc",
    "testold": "tsc --build --clean && tsc && mocha 'dist/test/*.js' --exit",
    "testdev": "tsc --build --clean && tsc && VERBOSITY=3 mocha --reporter list 'dist/test/*.js' --exit",
    "testDB": "tsc --build --clean && tsc && YPERSISTENCE=./yjs-db mocha 'dist/test/*.js' --exit",
    "testdevDB": "tsc --build --clean && tsc && YPERSISTENCE=./yjs-db VERBOSITY=3 mocha --reporter list 'dist/test/*.js' --exit",
    "test": "pnpm test:full",
    "test:full": "pnpm build && mocha 'dist/test/0*.test.js' --exit",
    "test:auto": "TEST_MODE=automated pnpm build && mocha 'dist/test/01-e2e-execution.test.js' --exit",
    "test:config": "pnpm build && mocha 'dist/test/00-config.test.js' --exit",
    "bundle-context": "tsx script/bundle-context.ts"
  },
  "keywords": [],
  "author": "Koen Swings",
  "license": "MIT",
  "devDependencies": {
    "@ts-morph/common": "^0.24.0",
    "@types/chai": "^4.3.20",
    "@types/mocha": "^10.0.10",
    "@types/netmask": "^2.0.5",
    "@types/node": "^20.19.10",
    "chai": "^5.2.1",
    "mocha": "^10.8.2",
    "netmask": "^2.0.2",
    "nodemon": "^3.1.10",
    "ts-morph": "^23.0.0",
    "ts-node": "^10.9.2",
    "typescript": "^5.9.2"
  },
  "dependencies": {
    "@automerge/automerge": "3.1.1-alpha.0",
    "@automerge/automerge-repo": "2.3.0-alpha.0",
    "@automerge/automerge-repo-network-websocket": "2.3.0-alpha.0",
    "@automerge/automerge-repo-storage-nodefs": "^2.2.0",
    "@homebridge/ciao": "^1.3.4",
    "automerge-repo-storage-node�efs@2.3.0-alpha.0": "link:@automerge/automerge-repo-storage-node�efs@2.3.0-alpha.0",
    "chokidar": "^3.6.0",
    "fast-deep-equal": "^3.1.3",
    "lib0": "^0.2.114",
    "lodash": "^4.17.21",
    "network-interfaces-listener": "^1.0.1",
    "node-dns-sd": "^1.0.1",
    "node-docker-api": "^1.1.22",
    "p-event": "^6.0.1",
    "rimraf": "^6.0.1",
    "tsx": "^4.20.4",
    "valtio": "^1.13.2",
    "ws": "^8.18.3",
    "yaml": "^2.8.1",
    "zx": "^7.2.4"
  }
}

```

## File: tsconfig.json
```typescript
{
  "compilerOptions": {
    "moduleResolution": "nodenext",
    "module": "NodeNext",
    // "target": "esnext",
    "target": "ES2022",
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "outDir": "./dist",
    "allowJs": true,
    "strictNullChecks": true,
    "esModuleInterop": true,
    "skipLibCheck": true,  // Added by Gemini to solve type errors in the automerge modules
  },
  "include": [
    "src",
    "script",
    "test"  
, "script/client.ts"] 
}
```

## File: src/callback.ts
```typescript
// const http = require('http')
import http from 'http'

const CALLBACK_URL = process.env.CALLBACK_URL ? new URL(process.env.CALLBACK_URL) : null
const CALLBACK_TIMEOUT = process.env.CALLBACK_TIMEOUT || 5000
const CALLBACK_OBJECTS = process.env.CALLBACK_OBJECTS ? JSON.parse(process.env.CALLBACK_OBJECTS) : {}

export const isCallbackSet = !!CALLBACK_URL

/**
 * @param {Uint8Array} update
 * @param {any} origin
 * @param {WSSharedDoc} doc
 */
export const callbackHandler = (update, origin, doc) => {
  const room = doc.name
  const dataToSend = {
    room,
    data: {}
  }
  const sharedObjectList = Object.keys(CALLBACK_OBJECTS)
  sharedObjectList.forEach(sharedObjectName => {
    const sharedObjectType = CALLBACK_OBJECTS[sharedObjectName]
    dataToSend.data[sharedObjectName] = {
      type: sharedObjectType,
      content: getContent(sharedObjectName, sharedObjectType, doc).toJSON()
    }
  })
  callbackRequest(CALLBACK_URL, CALLBACK_TIMEOUT, dataToSend)
}

/**
 * @param {URL} url
 * @param {number} timeout
 * @param {Object} data
 */
const callbackRequest = (url, timeout, data) => {
  data = JSON.stringify(data)
  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    timeout,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  }
  const req = http.request(options)
  req.on('timeout', () => {
    console.warn('Callback request timed out.')
    req.abort()
  })
  req.on('error', (e) => {
    console.error('Callback request error.', e)
    req.abort()
  })
  req.write(data)
  req.end()
}

/**
 * @param {string} objName
 * @param {string} objType
 * @param {WSSharedDoc} doc
 */
const getContent = (objName, objType, doc) => {
  switch (objType) {
    case 'Array': return doc.getArray(objName)
    case 'Map': return doc.getMap(objName)
    case 'Text': return doc.getText(objName)
    case 'XmlFragment': return doc.getXmlFragment(objName)
    case 'XmlElement': return doc.getXmlElement(objName)
    default : return {}
  }
}
```

## File: src/index.ts
```typescript
import { log } from './utils/utils.js';
import { startEngine } from "./start.js";
import { chalk } from "zx";

const main = async () => {
    try {
        await startEngine();
        log('++++++++++++++++++++++++++++++++++', 1);
        log('+++++++++ Engine started +++++++++', 1);
        log('++++++++++++++++++++++++++++++++++', 1);        
    } catch (error) {
        log(chalk.red('Error starting engine'));
        console.error(error);
        process.exit(1); // Exit with an error code if startup fails
    }

    // Keep the process alive indefinitely so background services can run
    await new Promise(() => {});
};

main();
```

## File: src/repo.ts
```typescript
import { Repo } from "@automerge/automerge-repo";
import { NodeFSStorageAdapter } from "@automerge/automerge-repo-storage-nodefs";
import { WebSocketServer } from "ws";
import { WebSocketServerAdapter } from "@automerge/automerge-repo-network-websocket";
import { PortNumber } from "./data/CommonTypes.js";
import { deepPrint, log, error } from './utils/utils.js'


export const startAutomergeServer = async (dataDir:string, port:PortNumber):Promise<Repo> => {
    log(`Using data directory: ${dataDir}`);

    // 1. Create a storage adapter for the server to persist data.
    const storage = new NodeFSStorageAdapter(dataDir);

    // 2. Create a WebSocket server.
    const ws = new WebSocketServer({ port: port });
    ws.on('error', (err) => {
        error(`WebSocket server error on port ${port}: ${err.message}`)
    })
    const network = new WebSocketServerAdapter(ws);

    // 3. Create the Automerge repo.
    const repo = new Repo({
        storage: storage,
        network: [network],
        sharePolicy: async (peerId) => true // Allow all peers to sync
    });

    log(`Automerge server is running on port ${port}`);

    // --------- 
    // Some Tests
    // ---------

    // const handle = repo.create({ appDB: { koen: 1 }, engineDB: {}, instanceDB: {}, connections: {} });

    // handle.on("change", ({ doc, patches }) => {
    //     log(`repo.ts: Document received with handle.on: ${deepPrint(doc, 2)}`);
    //     console.log(`Changes received with handle.on: ${JSON.stringify(patches)}`);
    // })

    // handle.change(doc => {
    //     log(`repo.ts: Document received with handle.change: ${deepPrint(doc, 3)}`)
    //     log(`repo.ts: Changing appDB.koen from ${doc.appDB["koen"]} to 2`)
    //     doc.appDB["foo"] = "baz";
    //     doc.appDB["koen"] = 2;
    // })



    // Set up the `cards` array in doc1
    // let doc1 = Automerge.change(Automerge.init(), (doc) => {
    //   doc.cards = [];
    // });

    // // Add a card to the `cards` array in doc1
    // doc1 = Automerge.change(doc1, (doc) => {
    //   doc.cards.push({ id: 1, title: "Card 1" });
    // });

    // // Subscribe to changes in the `cards` array
    // Automerge.subscribe(doc1, (changes) => {
    //   console.log("Changes in doc1:", changes);
    // });

    return repo;

}

```

## File: src/start.ts
```typescript
import os from 'os'
import { enableUsbDeviceMonitor } from './monitors/usbDeviceMonitor.js'
import { enableTimeMonitor, generateHeartBeat } from './monitors/timeMonitor.js'
import { $, chalk, fs, sleep } from 'zx'
import { deepPrint, log } from './utils/utils.js'
import { config } from './data/Config.js'
import { createOrUpdateEngine, localEngineId } from './data/Engine.js'
import { PortNumber } from './data/CommonTypes.js'
import { enableIndexServer } from './monitors/instancesMonitor.js'
import { DocumentId, Repo, DocHandle } from '@automerge/automerge-repo'
import { startAutomergeServer } from './repo.js'
import { enableMulticastDNSEngineMonitor } from './monitors/mdnsMonitor.js'
import { createServerStore, initialiseServerStore } from './data/Store.js'
import { enableStoreMonitor } from './monitors/storeMonitor.js'
import { InstanceID } from './data/CommonTypes.js'
import { Status } from './data/Instance.js'
import { Store } from './data/Store.js'




export const startEngine = async (disableMDNS?:boolean):Promise<void> => {

    log(`Hello from ${os.hostname()}!`)
    log(`The current time is ${new Date()}`)
    log('Here is some information about the system:')
    log(`  Interfaces: ${JSON.stringify(os.networkInterfaces())}`)
    log(`  Platform: ${os.platform()}`)
    log(`  Architecture: ${os.arch()}`)
    log(`  OS Type: ${os.type()}`)
    log(`  OS Release: ${os.release()}`)
    log(`  OS Uptime: ${os.uptime()}`)
    log(`  OS Load Average: ${os.loadavg()}`)
    log(`  Total Memory: ${os.totalmem()}`)
    log(`  Free Memory: ${os.freemem()}`)
    log(`  CPU Cores: ${os.cpus().length}`)
    log(`  User Info: ${JSON.stringify(os.userInfo())}`)
    log(`  Home Directory: ${os.homedir()}`)
    log(`  Temp Directory: ${os.tmpdir()}`)
    log(`  Endianness: ${os.endianness()}`)
    log(`  Network Hostname: ${os.hostname()}`)

    // Process the config
    const settings = config.settings
    const STORE_DATA_PATH = "./"+config.settings.storeDataFolder
    const STORE_IDENTITY_PATH = "./"+config.settings.storeIdentityFolder
    const STORE_URL_PATH = STORE_IDENTITY_PATH + "/store-url.txt"
    const STORE_TEMPLATE_PATH = STORE_IDENTITY_PATH + "/store-template.json" 

    // Create the store data directory if it does not yet exist
    if (!fs.existsSync(STORE_DATA_PATH)) {
        log(`Creating the store data folder at ${STORE_DATA_PATH}`)
        await $`mkdir -p ${STORE_DATA_PATH}`
    }

    // Create the store identity directory if it does not yet exist
    if (!fs.existsSync(STORE_IDENTITY_PATH)) {
        log(`Creating the store identity folder at ${STORE_IDENTITY_PATH}`)
        await $`mkdir -p ${STORE_IDENTITY_PATH}`
    }

    log(`Starting Automerge server...`)
    const repo = await startAutomergeServer(STORE_DATA_PATH, settings.port as PortNumber || 1234 as PortNumber)

    // If the store URL file does not exist, create it and an initial store document
    // This should only happen if we change the structure of the store document
    // and we want to force the creation of a new initial store document by deleting the old one
    if (!fs.existsSync(STORE_URL_PATH) || !fs.existsSync(STORE_TEMPLATE_PATH)) {
        log(`No URL file found at ${STORE_URL_PATH} or template file found at ${STORE_TEMPLATE_PATH}. Recreating them.`);
        await initialiseServerStore(repo, STORE_TEMPLATE_PATH, STORE_URL_PATH);
    }

    const storeDocUrlStr = fs.readFileSync(STORE_URL_PATH, 'utf-8');
    const storeDocId = storeDocUrlStr.replace('automerge:', '') as DocumentId;
    log(`Using document ID: ${storeDocId}`)

    // HACK: Force save on remote changes
    // The repo doesn't persist changes that come in from a remote peer automatically.
    // This is a workaround to force a save by listening for the sync-state event and then
    // calling the throttled save function that the repo uses internally.
    // const throttledSave = throttle(() => {
    //     if (repo.storageSubsystem) {
    //         repo.storageSubsystem.saveDoc(storeHandle.documentId, storeHandle.doc())
    //     }
    // }, 100)
    
    // repo.synchronizer.on('sync-state', () => {
    //     throttledSave()
    // })

    log(`Initialising store`)
    const storeHandle = await createServerStore(repo, storeDocId, STORE_DATA_PATH, STORE_TEMPLATE_PATH)

    // Create or update the local engine object
    const engine = await createOrUpdateEngine(storeHandle, localEngineId)
    await storeHandle.whenReady()
    const store = storeHandle.doc()

    // Check for undocked apps after restart
    await checkAndSetUndockedApps(storeHandle)

    // Start the app index server
    log(chalk.bgMagenta('STARTING THE INDEX SERVER'))
    await enableIndexServer(storeHandle)

    // Start the instances monitor
    // log(chalk.bgMagenta('STARTING INSTANCES MONITOR'))
    // await enableInstanceStatusMonitor(storeHandle)
    
    // If this process is killed, shut down automerge
    process.on('SIGINT', async () => {
        // this will be fired when you kill the app with ctrl + c.
        log('Shutting down automerge')
        log('*** SIGINT received ****');
        await shutdownProcedure(repo)
        process.exit(0)
    })
    process.on('SIGTERM', async () => {
        // this will be fired by the Linux shutdown command
        log('Shutting down automerge')
        log('*** SIGTERM received ****');
        await shutdownProcedure(repo)
        process.exit(0)
    })

    await sleep(1000)
    log(chalk.bgMagenta('STARTING STORE MONITOR'))
    enableStoreMonitor(storeHandle)

    const configMDNS = config.settings.mdns
    if (!disableMDNS && configMDNS) {
        await sleep(1000)
        log(chalk.bgMagenta('STARTING MULTICAST DNS MONITOR'))
        enableMulticastDNSEngineMonitor(storeHandle, repo)
    }


    await sleep(1000)
    log(chalk.bgMagenta('STARTING MONITORING OF USB DEVICES'))
    enableUsbDeviceMonitor(storeHandle)

    await sleep(1000)
    log(chalk.bgMagenta('STARTING HEARTBEAT GENERATION'))
    generateHeartBeat(storeHandle)
    enableTimeMonitor(50000, () => generateHeartBeat(storeHandle))


}


export const checkAndSetUndockedApps = async (storeHandle: DocHandle<Store>): Promise<void> => {
    const { instanceDB } = storeHandle.doc();
    const promises = Object.keys(instanceDB).map(async (instanceId) => {
        const instance = instanceDB[instanceId];
        if (instance.status !== "Undocked") {
            try {
                const result = await $`docker ps -q -f name=${instance.id}`;
                if (result.stdout.trim() === "") {
                    // No container running, set to undocked
                    log(`Setting status of instance ${instanceId} to Undocked`)
                    storeHandle.change(doc => {
                          const inst = doc.instanceDB[instanceId]
                          inst.status = 'Undocked' as Status 
                        })
                }
            } catch (error) {
                console.error(`Error checking docker status for ${instance.name}: ${error}`);
            }
        }
    });
    await Promise.all(promises);
};

async function shutdownProcedure(repo:Repo):Promise<void> {
    console.log('*** Engine is now closing ***');
    if (repo) await repo.shutdown()
}
```

## File: src/test.ts
```typescript
import { Suite, Runner } from 'mocha'
import Mocha from 'mocha';

// First, you need to instantiate a Mocha instance

var mocha = new Mocha({
    reporter: 'list'
});

//mocha.reporter('xunit', { output: './test/testspec.xunit.xml' });

var suite = new Suite('JSON suite');
var runner = new Runner(suite);
//var xunit = new XUnit(runner);
//var mochaReporter = new mocha._reporter(runner);

mocha.addFile(
    './dist/test/01 - index.js'
);

mocha.addFile(
    './dist/test/02 - local-engine.js'
);

runner.run(function(failures) {
    // the json reporter gets a testResults JSON object on end
    //var testResults = mochaReporter.testResults;

    //console.log(testResults);
    // send your email here
    console.log('done')
});
```

## File: src/data/App.ts
```typescript
import { $, YAML, chalk } from 'zx';
import { Version, URL, AppID, AppName, Hostname, DeviceName, DiskName, DiskID } from './CommonTypes.js';
import { log } from '../utils/utils.js';
import { Store } from './Store.js';
import { Disk } from './Disk.js';
import { DocHandle } from '@automerge/automerge-repo';

export interface App {
    id: AppID;
    name: AppName;
    version: Version;
    title: string;
    description: string;
    url: URL
    category: AppCategory;
    icon: URL;
    author: string;
}

type AppCategory = 'Productivity' | 'Utilities' | 'Games';

export const createAppId = (appName: AppName, version: Version): AppID => {
    return appName + "-" + version as AppID
}

export const extractAppName = (appId: AppID): AppName => {
    return appId.split('-')[0] as AppName
}

export const extractAppVersion = (appId: AppID): Version => {
    return appId.split('-')[1] as Version
}

export const createOrUpdateApp = async (storeHandle: DocHandle<Store>, appId: AppID, disk: Disk) => {
    const store: Store = storeHandle.doc()
    const device: DeviceName = disk.device as DeviceName;
    const diskID: DiskID = disk.id as DiskID;
    let app: App;
    try {
        // The full name of the app is <appName>-<version>
        const appName = extractAppName(appId)
        const appVersion = extractAppVersion(appId)

        // Read the compose.yaml file in the app folder
        const appComposeFile = await $`cat /disks/${device}/apps/${appId}/compose.yaml`
        const appCompose = YAML.parse(appComposeFile.stdout)
        storeHandle.change(doc => {
            const storedApp: App | undefined = doc.appDB[appId]
            if (!storedApp) {
                // Create a new app object
                log(chalk.green(`Creating new app ${appId} on disk ${diskID}`))
                app = {
                    id: appId as AppID,
                    name: appName,
                    version: appVersion,
                    title: appCompose['x-app'].title,
                    description: appCompose['x-app'].description,
                    url: appCompose['x-app'].url,
                    category: appCompose['x-app'].category,
                    icon: appCompose['x-app'].icon,
                    author: appCompose['x-app'].author
                }
                // Store the new app object in the store
                doc.appDB[appId] = app
            } else {
                // Granularly update the existing app object
                log(chalk.green(`Granularly updating existing app ${appId} on disk ${diskID}`))
                app = storedApp
                app.name = appName
                app.version = appVersion
                app.title = appCompose['x-app'].title
                app.description = appCompose['x-app'].description
                app.url = appCompose['x-app'].url
                app.category = appCompose['x-app'].category
                app.icon = appCompose['x-app'].icon
                app.author = appCompose['x-app'].author
            }
        })
    return app!
    } catch (e) {
        log(chalk.red(`Error initializing instance ${appId} on disk ${disk.id}`))
        console.error(e)
        return undefined
    }
}

```

## File: src/data/Appnet.ts
```typescript
// import { proxy } from "valtio"
// import { AppnetName, EngineID, InstanceID } from "./CommonTypes.js"
// import { Engine, initialiseLocalEngine } from "./Engine.js"
// import { Doc } from "yjs"
// import { bind } from "../valtio-yjs/index.js"
// import { log } from "console"
// import { Instance, stopInstance } from "./Instance.js"
// import crypto from "crypto"
// import { dummyKey, getKeys } from "../utils/utils.js"
// import { store } from "./Store.js"
// import { Disk } from "./Disk.js"

// /**
//  * Appnet is the root object for all data distributed over the network
//  */
// export interface Appnet {
//         // name is also the unique identifier of the Appnet
//     name: AppnetName

//     // The set of ids for all engines in the network
//     engines: {[key: EngineID]: boolean}

//     // The set of ids for all running instances in the network
//     instances: {[key: InstanceID]: string}
// }

// export const initialiseAppnetData = async (name: AppnetName, doc:Doc): Promise<Appnet> => {
//     // We need to initialise with at least one key so that the other keys can be synced from the network
//     const dummy = {}
//     dummy[dummyKey] = true
//     const dummy2 = {}
//     dummy2[dummyKey] = "x"
//     const $appnet = proxy<Appnet>({
//         name: name,
//         engines: proxy<{[key:EngineID]:boolean}>(dummy),
//         instances: proxy<{[key:InstanceID]:string}>(dummy2)
//     })
    
//     // Bind the proxy for the engine Ids array to a corresponding Yjs Map
//     bind($appnet.engines, doc.getMap(`APPNET_${$appnet.name}_engineSet`))
//     bind($appnet.instances, doc.getMap(`APPNET_${$appnet.name}_instanceSet`))

//     return $appnet
// }

// export const addEngineToAppnet = (appNet: Appnet, engineId: EngineID):void => {
//     appNet.engines[engineId] = true
// }

// export const removeEngineFromAppnet = (appNet: Appnet, engineId: EngineID):void => {
//     delete appNet.engines[engineId]
// }

// export const getAppnetEngineIds = (appNet: Appnet): EngineID[] => {
//     return getKeys(appNet.engines) as EngineID[]
// }

// export const getAppnetEngineCount = (appNet: Appnet): number => {
//     return getKeys(appNet.engines).length
// }

// export const addInstanceToAppnet = (appNet: Appnet, instance: Instance):void => {
//     log(`Adding instance ${instance.id} to appnet ${appNet.name}`)
//     // Hash the instance object
//     const instanceHash = crypto.createHash('md5').update(JSON.stringify(instance)).digest('hex');
//     log(`Instance hash: ${instanceHash}`)
//     appNet.instances[instance.id] = instanceHash
// }

// export const removeInstanceFromAppnet = (appNet: Appnet, instanceId: InstanceID):void => {
//     log(`Removing instance ${instanceId} from appnet ${appNet.name}`)
//     delete appNet.instances[instanceId]
// }

// export const getAppnetInstanceIds = (appNet: Appnet): InstanceID[] => {
//     return getKeys(appNet.instances) as InstanceID[]
// }

// export const getAppnetInstanceCount = (appNet: Appnet): number => {
//     return getKeys(appNet.instances).length
// }




```

## File: src/data/CommandDefinition.ts
```typescript
import { DocHandle } from "@automerge/automerge-repo";
import { Store } from "./Store.js";

// Generalized argument types
type ArgumentType = 'string' | 'number' | 'object';

// Updated FieldSpec to support multiple types
interface FieldSpec {
    type: 'number' | 'string'; // Extend this as needed
}

interface ObjectSpec {
    [key: string]: FieldSpec;
}

// Updated ArgumentDescriptor to include ObjectSpec
export interface ArgumentDescriptor {
    type: ArgumentType;
    objectSpec?: ObjectSpec;
}

// Interface for commands
export interface CommandDefinition {
    name: string;
    execute: (storeHandle: DocHandle<Store> | null, ...args: any[]) => void;
    args: ArgumentDescriptor[];
    scope: 'engine' | 'console' | 'any';
}
```

## File: src/data/Commands.ts
```typescript
import { CommandDefinition } from "./CommandDefinition.js";
import { Store, getApps, getDisks, getRunningEngines, getInstances, getEngine, findDiskByName, findInstanceByName, getLocalEngine, createClientStore } from "./Store.js";
import { deepPrint } from "../utils/utils.js";
import { buildInstance, startInstance, runInstance, stopInstance } from "./Instance.js";
import { buildEngine, syncEngine, clearKnownHost, rebootEngine } from "./Engine.js";
import { AppName, Command, DiskName, EngineID, Hostname, InstanceName, Version } from "./CommonTypes.js";
import { localEngineId } from "./Engine.js";
import { chalk, ssh, fs, $ } from "zx";

$.verbose = false;
import { DocHandle, Repo } from "@automerge/automerge-repo";
import { config } from "./Config.js";
import { generateHostName } from "../utils/nameGenerator.js";
import pack from '../../package.json' with { type: "json" };
import { sendCommand } from "../utils/commandUtils.js";
import { testContext } from "../../test/testContext.js";


import { BrowserWebSocketClientAdapter } from "@automerge/automerge-repo-network-websocket";

import { lookup } from 'dns/promises';

const connect = async (storeHandle: DocHandle<Store> | null, args: string) => {
    // Basic parser to separate engine names from a potential --timeout flag
    const parts = args.split(' ');
    const engineNames = parts.filter(p => !p.startsWith('--'));
    const timeoutFlagIndex = parts.findIndex(p => p === '--timeout');
    const timeoutSeconds = timeoutFlagIndex !== -1 && parts[timeoutFlagIndex + 1] 
        ? parseInt(parts[timeoutFlagIndex + 1], 10) 
        : undefined;

    // Look up the actual hostnames from the config based on the logical names
    const hostnames = engineNames.map(name => {
        return name+'.local' as Hostname;
    });

    const peerId = 'testrunner-' + Math.random().toString(36).substring(2);
    const storeDocUrlStr = fs.readFileSync("./store-identity/store-url.txt", 'utf-8');
    const DOCUMENT_ID = storeDocUrlStr.trim() as any;

    // createClientStore now handles DNS resolution and timeouts
    const { handle, repo } = await createClientStore(hostnames, peerId as any, DOCUMENT_ID, timeoutSeconds);
    
    testContext.storeHandle = handle;
    testContext.repo = repo;
};

// Command to disconnect the test runner
const disconnect = () => {
    if (testContext.repo) {
        console.log(chalk.blue("Disconnecting test runner..."));
        const repo = testContext.repo as Repo;
        // This is a bit of a hack to get the adapters, as they are not exposed.
        // It assumes the adapters are stored on the repo object by createClientStore, which they are not.
        // This will need to be fixed.
        // [...repo.networkSubsystem.networkAdapters].forEach(adapter => repo.networkSubsystem.removeNetworkAdapter(adapter));
        testContext.repo = undefined;
        testContext.storeHandle = undefined;
    }
};


const buildEngineWrapper = async (storeHandle: DocHandle<Store> | null, argsString: string) => {
    console.log(chalk.blue(`Executing remote buildEngine command with args: ${argsString}`));

    // Basic parser for a string of command-line args
    const parseArgs = (str: string): any => {
        const output: { [key: string]: any } = {};
        const parts = str.match(/--(\w+)(?:[= ]([^\s"'\[\]]+|"[^"]*"|'[^']*'))?/g) || [];
        parts.forEach(part => {
            const match = part.match(/--(\w+)(?:[= ](.+))?/);
            if (match) {
                const key = match[1];
                const value = match[2] ? match[2].replace(/["']/g, '') : true;
                output[key] = value;
            }
        });
        return output;
    };

    const parsedArgs = parseArgs(argsString);
    const defaults = config.defaults;

    const machine = parsedArgs.machine;
    if (!machine) {
        console.error(chalk.red('buildEngine command requires a --machine argument.'));
        return;
    }

    // Clear the known_hosts entry for the target machine before attempting to connect
    await clearKnownHost(machine);

    const user = parsedArgs.user || defaults.user;
    const exec = ssh(`${user}@${machine}`);
    const buildArgs = {
        exec,
        isLocalMode: false,
        machine: machine,
        user: user,
        hostname: parsedArgs.hostname || generateHostName(),
        language: parsedArgs.language || defaults.language,
        keyboard: parsedArgs.keyboard || defaults.keyboard,
        timezone: parsedArgs.timezone || defaults.timezone,
        upgrade: parsedArgs.upgrade !== undefined ? parsedArgs.upgrade : defaults.upgrade,
        argon: parsedArgs.argon !== undefined ? parsedArgs.argon : defaults.argon,
        zerotier: parsedArgs.zerotier !== undefined ? parsedArgs.zerotier : defaults.zerotier,
        raspap: parsedArgs.raspap !== undefined ? parsedArgs.raspap : defaults.raspap,
        gadget: parsedArgs.gadget !== undefined ? parsedArgs.gadget : defaults.gadget,
        temperature: parsedArgs.temperature !== undefined ? parsedArgs.temperature : defaults.temperature,
        version: pack.version,
        productionMode: parsedArgs.prod || false,
        enginePath: config.defaults.enginePath,
    };
    try {
        await syncEngine(user, machine);
        await buildEngine(buildArgs);
        console.log(chalk.green('buildEngine command finished successfully.'));
    } catch (e: any) {
        console.error(chalk.red(`buildEngine command failed: ${e.message}`));
    }
}

const ls = (storeHandle: DocHandle<Store> | null): void => {
    if (!storeHandle) { console.error(chalk.red("Store is not available. Please connect first.")); return; }
    console.log('NetworkData on this engine:');
    console.log(deepPrint(storeHandle.doc()), 3);
}

const lsEngines = (storeHandle: DocHandle<Store> | null): void => {
    if (!storeHandle) { console.error(chalk.red("Store is not available. Please connect first.")); return; }
    console.log('Engines:');
    const engines = getRunningEngines(storeHandle.doc());
    console.log(`Total engines: ${engines.length}`);
    console.log(deepPrint(engines, 2));
}

const lsDisks = (storeHandle: DocHandle<Store> | null): void => {
    if (!storeHandle) { console.error(chalk.red("Store is not available. Please connect first.")); return; }
    console.log('Disks:');
    const disks = getDisks(storeHandle.doc());
    console.log(`Total disks: ${disks.length}`);
    console.log(deepPrint(disks, 2));
}

const lsApps = (storeHandle: DocHandle<Store> | null): void => {
    if (!storeHandle) { console.error(chalk.red("Store is not available. Please connect first.")); return; }
    console.log('Apps:');
    const apps = getApps(storeHandle.doc());
    console.log(`Total apps: ${apps.length}`);
    console.log(deepPrint(apps, 2));
}

const lsInstances = (storeHandle: DocHandle<Store> | null): void => {
    if (!storeHandle) { console.error(chalk.red("Store is not available. Please connect first.")); return; }
    console.log('Instances:');
    const instances = getInstances(storeHandle.doc());
    console.log(`Total instances: ${instances.length}`);
    console.log(deepPrint(instances, 2));
}

const buildInstanceWrapper = async (storeHandle: DocHandle<Store>, instanceName: InstanceName, appName: AppName, gitAccount: string, gitTag: string, diskName: DiskName) => {
    const store = storeHandle.doc()
    if (!store) {
        console.error(chalk.red("Store is not available to create instance."));
        return;
    }
    const disk = findDiskByName(store, diskName)
    if (!disk || !disk.device) {
        console.log(chalk.red(`Disk '${diskName}' not found or has no device on engine ${localEngineId}`))
        return
    }
    await buildInstance(instanceName, appName, gitAccount, gitTag as Version, disk.device)
}

const startInstanceWrapper = async (storeHandle: DocHandle<Store> | null, instanceName: InstanceName, diskName: DiskName) => {
    if (!storeHandle) { console.error(chalk.red("Store is not available.")); return; }
    const store = storeHandle.doc()
    const instance = findInstanceByName(store, instanceName)
    const disk = findDiskByName(store, diskName)
    if (!instance) {
        console.log(chalk.red(`Instance ${instanceName} not found`))
        return
    }
    if (!disk) {
        console.log(chalk.red(`Disk ${diskName} not found`))
        return
    }
    startInstance(storeHandle, instance, disk)
}

const runInstanceWrapper = async (storeHandle: DocHandle<Store> | null, instanceName: InstanceName, diskName: DiskName) => {
    if (!storeHandle) { console.error(chalk.red("Store is not available.")); return; }
    const store = storeHandle.doc()
    const instance = findInstanceByName(store, instanceName)
    const disk = findDiskByName(store, diskName)
    if (!instance) {
        console.log(chalk.red(`Instance ${instanceName} not found`))
        return
    }
    if (!disk) {
        console.log(chalk.red(`Disk ${diskName} not found`))
        return
    }
    runInstance(storeHandle, instance, disk)
}

const stopInstanceWrapper = async (storeHandle: DocHandle<Store> | null, instanceName: InstanceName, diskName: DiskName) => {
    if (!storeHandle) { console.error(chalk.red("Store is not available.")); return; }
    const store = storeHandle.doc()
    const instance = findInstanceByName(store, instanceName)
    const disk = findDiskByName(store, diskName)
    if (!instance) {
        console.log(chalk.red(`Instance ${instanceName} not found`))
        return
    }
    if (!disk) {
        console.log(chalk.red(`Disk ${diskName} not found`))
        return
    }
    stopInstance(storeHandle, instance, disk)
}

const sendWrapper = (storeHandle: DocHandle<Store> | null, args: string) => {
    if (!storeHandle) { console.error(chalk.red("Store is not available. Please connect first.")); return; }
    const firstSpaceIndex = args.indexOf(' ');
    if (firstSpaceIndex === -1) {
        console.error(chalk.red("Send command requires at least two arguments: <engineId> <command>"));
        return;
    }
    const engineId = args.substring(0, firstSpaceIndex);
    const command = args.substring(firstSpaceIndex + 1);
    sendCommand(storeHandle, engineId as EngineID, command as Command);
}

const rebootWrapper = async (storeHandle: DocHandle<Store> | null) => {
    if (!storeHandle) { console.error(chalk.red("Store is not available. Please connect first.")); return; }
    const localEngine = getLocalEngine(storeHandle.doc());
    await rebootEngine(storeHandle, localEngine);
}

export const commands: CommandDefinition[] = [
    { name: "ls", execute: ls, args: [], scope: 'any' },
    { name: "engines", execute: lsEngines, args: [], scope: 'any' },
    { name: "disks", execute: lsDisks, args: [], scope: 'any' },
    { name: "apps", execute: lsApps, args: [], scope: 'any' },
    { name: "instances", execute: lsInstances, args: [], scope: 'any' },
    {
        name: "send",
        execute: sendWrapper,
        args: [{ type: "string" }],
        scope: 'any'
    },
    { name: "createInstance", execute: buildInstanceWrapper, args: [{ type: "string" }, { type: "string" }, { type: "string" }, { type: "string" }, { type: "string" }], scope: 'engine' },
    { name: "startInstance", execute: startInstanceWrapper, args: [{ type: "string" }, { type: "string" }], scope: 'engine' },
    { name: "runInstance", execute: runInstanceWrapper, args: [{ type: "string" }, { type: "string" }], scope: 'engine' },
    { name: "stopInstance", execute: stopInstanceWrapper, args: [{ type: "string" }, { type: "string" }], scope: 'engine' },
    {
        name: "reboot",
        execute: rebootWrapper,
        args: [],
        scope: 'engine'
    },
    {
        name: "buildEngine",
        execute: buildEngineWrapper,
        args: [{ type: "string" }],
        scope: 'engine'
    },
    { name: "connect", execute: connect, args: [{ type: "string" }], scope: 'any' },
    { name: "disconnect", execute: disconnect, args: [], scope: 'any' },
];

```

## File: src/data/CommonTypes.ts
```typescript
declare const __brand__type__: unique symbol;
type Brand<BaseType, BrandName> = BaseType & {
  readonly [__brand__type__]: BrandName;
}



export type Version = Brand<string, "VERSION"> // Can be major.minor or a commit hash

export type EngineID = Brand<string, "DISKID">
export type DiskID = Brand<string, "DISKID">
export type AppID = Brand<string, "APPID">
export type InstanceID = Brand<string, "INSTANCEID">

export type AppnetName = Brand<string, "APPNETNAME">
export type AppName = Brand<string, "APPNETNAME">
export type InstanceName = Brand<string, "INSTANCENAME">

export type URL = Brand<string, "URL">

export type IPAddress = Brand<string, "IPADRESS">
export type NetMask = Brand<string, "NETMASK">
export type CIDR = Brand<string, "CIDR">
export type PortNumber = Brand<number, "PORTNUMBER">

export type InterfaceName = Brand<string, "INTERFACENAME">
export type DeviceName = Brand<string, "DEVICENAME">

export type Hostname = Brand<string, "HOSTNAME">
export type DiskName = Brand<string, "DISKNAME">
export type ServiceImage = Brand<string, "SERVICEIMAGE">

export type Timestamp = Brand<number, "TIMESTAMP">

export type Command = Brand<string, "COMMAND">

// References to top-level YMaps and YArrays in the Yjs document
// export type YMapRef = string
// export type YArrayRef = string

export interface DockerMetrics {
  cpu: string;
  memory: string;
  network: string;
  disk: string;
}

export interface DockerLogs {
  logs: string[]; // Assuming logs are strings, but this could be more complex
}

export interface DockerEvents {
  events: string[]; // Similarly, assuming simple string descriptions
}

// interface DockerConfiguration {
//   // Define the structure according to the Docker configuration specifics
//   [key: string]: any; // Placeholder, adjust as needed
// }

```

## File: src/data/Config.ts
```typescript
import { $, YAML, chalk, fs } from "zx";
import { log } from "../utils/utils.js";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ##################################################################################################
// Type Definitions
// ##################################################################################################

export interface Settings {
    mdns: boolean;
    isDev: boolean;
    port: number;
    storeDataFolder: string;
    storeIdentityFolder: string;
}

export interface Defaults {
    user: string;
    machine: string;
    password: string;
    engine: string;
    network: string;
    language: string;
    keyboard: string;
    timezone: string;
    upgrade: boolean;
    hdmi: boolean;
    temperature: boolean;
    argon: boolean;
    zerotier: boolean;
    raspap: boolean;
    gadget: boolean;
    nodocker: boolean;
    gitAccount: string;
    enginePath: string;
}

export interface InstanceConfig {
    instanceName: string;
    appName: string;
    version: string;
    title: string;
}

export interface DiskConfig {
    diskId: string;
    type: "AppDisk";
    instances: InstanceConfig[];
}

export interface EngineConfig {
    name: string;
    hostname: string;
}

export type TestAction = 
    | { type: "runCommand"; command: string; }
    | { type: "sendCommand"; targetEngineName: string; command: string; };

export interface TestAssertion {
    description: string;
    path: string;
    should: string;
}

export interface TestSequenceItem {
    stage: number;
    description: string;
    manualInstruction: string | null;
    action: TestAction | null;
    assert: TestAssertion[];
}

export interface TestSetup {
    resetBeforeTest: boolean;
    engines: EngineConfig[];
    disks: DiskConfig[];
    interactiveTestSequence: TestSequenceItem[];
    automatedTestSequence: TestSequenceItem[];
}

export interface Config {
    settings: Settings;
    defaults: Defaults;
    testSetup: TestSetup;
}

// ##################################################################################################
// Validation Logic
// ##################################################################################################

function validate<T>(obj: any, validator: (obj: any, path: string) => string[]): string[] {
    return validator(obj, '');
}

function validateSettings(obj: any, path: string): string[] {
    const errors: string[] = [];
    if (typeof obj.mdns !== 'boolean') errors.push(`'${path}mdns' must be a boolean.`);
    if (typeof obj.isDev !== 'boolean') errors.push(`'${path}isDev' must be a boolean.`);
    if (typeof obj.port !== 'number') errors.push(`'${path}port' must be a number.`);
    if (typeof obj.storeDataFolder !== 'string') errors.push(`'${path}storeDataFolder' must be a string.`);
    if (typeof obj.storeIdentityFolder !== 'string') errors.push(`'${path}storeIdentityFolder' must be a string.`);
    return errors;
}

function validateDefaults(obj: any, path: string): string[] {
    const errors: string[] = [];
    if (typeof obj.user !== 'string') errors.push(`'${path}user' must be a string.`);
    if (typeof obj.enginePath !== 'string') errors.push(`'${path}enginePath' must be a string.`);
    // Add other default checks here as needed for completeness
    return errors;
}

function validateTestAction(obj: any, path: string): string[] {
    if (obj === null) return [];
    const errors: string[] = [];
    if (typeof obj !== 'object') return [`'${path}' must be an object or null.`];
    
    switch (obj.type) {
        case 'runCommand':
            if (typeof obj.command !== 'string') errors.push(`'${path}command' must be a string for runCommand.`);
            break;
        case 'sendCommand':
            if (typeof obj.targetEngineName !== 'string') errors.push(`'${path}targetEngineName' must be a string for sendCommand.`);
            if (typeof obj.command !== 'string') errors.push(`'${path}command' must be a string for sendCommand.`);
            break;
        default:
            errors.push(`'${path}type' has an unknown value: ${obj.type}.`);
    }
    return errors;
}

function validateTestSequenceItem(obj: any, path: string): string[] {
    const errors: string[] = [];
    if (typeof obj.stage !== 'number') errors.push(`'${path}stage' must be a number.`);
    if (typeof obj.description !== 'string') errors.push(`'${path}description' must be a string.`);
    if (typeof obj.manualInstruction !== 'string' && obj.manualInstruction !== null) errors.push(`'${path}manualInstruction' must be a string or null.`);
    errors.push(...validateTestAction(obj.action, `${path}action.`));
    if (!Array.isArray(obj.assert)) errors.push(`'${path}assert' must be an array.`);
    return errors;
}

function validateTestSetup(obj: any, path: string): string[] {
    const errors: string[] = [];
    if (typeof obj.resetBeforeTest !== 'boolean') errors.push(`'${path}resetBeforeTest' must be a boolean.`);
    if (!Array.isArray(obj.engines)) errors.push(`'${path}engines' must be an array.`);
    if (!Array.isArray(obj.disks)) errors.push(`'${path}disks' must be an array.`);
    if (!Array.isArray(obj.interactiveTestSequence)) errors.push(`'${path}interactiveTestSequence' must be an array.`);
    else errors.push(...obj.interactiveTestSequence.flatMap((item, i) => validateTestSequenceItem(item, `${path}interactiveTestSequence[${i}].`)));
    if (!Array.isArray(obj.automatedTestSequence)) errors.push(`'${path}automatedTestSequence' must be an array.`);
    else errors.push(...obj.automatedTestSequence.flatMap((item, i) => validateTestSequenceItem(item, `${path}automatedTestSequence[${i}].`)));
    return errors;
}

function validateConfig(obj: any): string[] {
    const errors: string[] = [];
    if (!obj) return ["Config object is null or undefined."];
    errors.push(...validateSettings(obj.settings, 'settings.'));
    errors.push(...validateDefaults(obj.defaults, 'defaults.'));
    errors.push(...validateTestSetup(obj.testSetup, 'testSetup.'));
    return errors.filter(e => e); // Filter out empty strings/nulls
}

// ##################################################################################################
// Configuration Loading
// ##################################################################################################

const readConfig = (path: string): Config => {
  try {
    const configFile = fs.readFileSync(path, 'utf8');
    const parsedConfig = YAML.parse(configFile);

    const validationErrors = validateConfig(parsedConfig);
    if (validationErrors.length > 0) {
        console.error(chalk.red('Config file validation failed!'));
        validationErrors.forEach(error => console.error(chalk.red(`  - ${error}`)));
        process.exit(1);
    }

    log(chalk.green('Config file is valid.'));
    return parsedConfig as Config;

  } catch (e) {
    log(chalk.red('Error reading or parsing config.yaml!'));
    console.error(e);
    process.exit(1);
  }
}

export const config = readConfig('./config.yaml');
```

## File: src/data/Disk.ts
```typescript
import { $, YAML, chalk, fs, os } from 'zx';
import { deepPrint, log } from '../utils/utils.js';
import { App, createOrUpdateApp } from './App.js'
import { Instance, Status, createOrUpdateInstance, startInstance } from './Instance.js'
import { AppID, DeviceName, DiskID, EngineID, DiskName, InstanceID, Timestamp } from './CommonTypes.js';
import { Store, getAppsOfDisk, getInstance, getInstancesOfDisk } from './Store.js';
import { DocHandle } from '@automerge/automerge-repo';



// Disks are multi-purpose  - they can be used for engines, apps, backups, etc.

export interface Disk {
    id: DiskID;                   // The serial number of the disk, or a user-defined id if the disk has no serial number
    name: DiskName;               // The user-defined name of the disk.  Not necessarily unique  
    device: DeviceName | null;    // The device under /disks where this disk is mounted. null if the disk is not mounted
    created: Timestamp;           // We must use a timestamp number as Date objects are not supported in YJS
    lastDocked: Timestamp;        // We must use a timestamp number as Date objects are not supported in YJS
    dockedTo: EngineID | null;    // The engine to which this disk is currently docked. null if it is not docked to an engine
    // apps: { [key: AppID]: boolean };
    // instances: { [key: InstanceID]: boolean };
}


// export const getApps = (store: Store, disk: Disk): App[] => {
//     const appIds = getKeys(disk.apps) as AppID[]
//     return appIds.map(appId => getApp(store, appId))
// }


// export const findApp = (store: Store, disk: Disk, appId: AppID): App | undefined => {
//     return getApps(store, disk).find(app => app.id === appId)
// }

// Function findApp that searches for an app with the specified name and version on the specified disk
// export const findAppByNameAndVersion = (store: Store, disk: Disk, appName: AppName, version: Version): App | undefined => {
//     const appIds = Object.keys(disk.apps) as AppID[]
//     const appId = appIds.find(appId => {
//         const app = store.appDB[appId]
//         app.name === appName && app.version === version
//     })
//     if (appId) {
//         return store.appDB[appId]
//     } else {
//         return undefined
//     }
// }

// export const getInstances = (store: Store, disk: Disk): Instance[] => {
//     const instanceIds = getKeys(disk.instances) as InstanceID[]
//     return instanceIds.map(instanceId => getInstance(store, instanceId))
// }

// export const findInstance = (store: Store, disk: Disk, instanceId: InstanceID): Instance | undefined => {
//     return getInstances(store, disk).find(instance => instance.id === instanceId)
// }

// export const findInstanceOfApp = (store: Store, disk: Disk, appId: AppID): Instance | undefined => {
//     return getInstances(store, disk).find(instance => instance.instanceOf === appId)
// }
// export const findInstanceByName = (store: Store, disk: Disk, instanceName: InstanceName): Instance | undefined => {
//     const instanceIds = Object.keys(disk.instances) as InstanceID[]
//     const instanceId = instanceIds.find(instanceId => store.instanceDB[instanceId].name === instanceName)
//     if (instanceId) {
//         return store.instanceDB[instanceId]
//     } else {
//         return undefined
//     }
// }

// export const addInstance = (store: Store, disk: Disk, instance: Instance): void => {
//     log(`Updating instance ${instance.name} of disk ${disk.name}:`)
//     const existingInstance = findInstanceByName(store, disk, instance.name)
//     if (existingInstance) {
//         log(`Disk ${disk.name} already has an instance ${instance.name}. Merging the new instance with the existing instance.`)
//         Object.assign(existingInstance, instance)
//     } else {
//         //log(deepPrint(disk))
//         log(`Pushing a new instance ${instance.name} to engine ${disk.name}`)
//         disk.instances[instance.id] = true
//     }
// }




export const createOrUpdateDisk = (storeHandle: DocHandle<Store>, engineId: EngineID, device: DeviceName, diskId: DiskID, diskName: DiskName, created: Timestamp): Disk => {
    let disk: Disk
    storeHandle.change(doc => {
        let storedDisk = doc.diskDB[diskId];
        if (!storedDisk) {
            log(`Creating disk ${diskId} on engine ${engineId}`);
            disk = {
                id: diskId,
                name: diskName,
                device: device,
                dockedTo: engineId,
                created: created,
                lastDocked: new Date().getTime() as Timestamp
            };
            doc.diskDB[diskId] = disk;
        } else {
            log(`Granularly updating disk ${diskId} on engine ${engineId}`);
            disk = storedDisk;
            disk.dockedTo = engineId;
            disk.name = diskName;
            disk.device = device;
            disk.created = created;
            disk.lastDocked = new Date().getTime() as Timestamp;
        }
    });
    return disk!; // Non-null assertion
}   

export const OLDcreateOrUpdateDisk = (storeHandle: DocHandle<Store>, engineId: EngineID, device: DeviceName, diskId: DiskID, diskName: DiskName, created: Timestamp): Disk => {
    const store: Store = storeHandle.doc()
    let storedDisk: Disk | undefined = store.diskDB[diskId]
    if (!storedDisk) {
        log(`Creating disk ${diskId} on engine ${engineId}`)
        // Create a new disk object
        const disk: Disk = {
            id: diskId,
            name: diskName,
            device: device,
            dockedTo: engineId,
            created: created,
            lastDocked: new Date().getTime() as Timestamp
        }
        storeHandle.change(doc => {
            doc.diskDB[diskId] = disk
        })
        // enableDiskMonitor(disk)
        return disk
    } else {
        log(`Granularly updating disk ${diskId} on engine ${engineId}`)
        storeHandle.change(doc => {
            const disk = doc.diskDB[diskId]
            disk.dockedTo = engineId
            disk.name = diskName
            disk.device = device
            disk.created = created
            disk.lastDocked = new Date().getTime() as Timestamp
        })
        return store.diskDB[diskId]
    }
}   


export const processDisk = async (storeHandle: DocHandle<Store>, disk: Disk): Promise<void> => {
    log(`Processing disk ${disk.id} on engine ${disk.dockedTo}`)

    const store: Store = storeHandle.doc()
    // Check if the disk is an app disk, backup disk, upgrade disk, or files disk and perform the necessary actions
    // NOTE: we currently allow Disks to be multi-purpose and be used for apps, backups, upgrades, etc. This might change in the 
    // future towards a model in which Disks are only used for one purpose
    
    // Check if the disk is an app disk
    if (await isAppDisk(disk)) {
        log(`Disk ${disk.id} is an app disk`)   
        await processAppDisk(storeHandle, disk)
    }

    // Check if the disk is a backup disk
    if (await isBackupDisk(disk)) {
        log(`Disk ${disk.id} is a backup disk`)
        // TODO: Implement backup disk processing
        // -  Read the backup configuration from the disk
        // -  Perform the backup if the backup type is IMMEDIATE
        // -  Schedule the backup if the backup type is SCHEDULED
    }

    // Check if the disk is an upgrade disk
    if (await isUpgradeDisk(disk)) {
        log(`Disk ${disk.id} is an upgrade disk`)
        // TODO: Implement upgrade disk processing
        // - Execute the upgrade script if the disk is an upgrade disk
    }

    // Check if the disk is a files disk
    if (await isFilesDisk(disk)) {
        log(`Disk ${disk.id} is a files disk`)
        // TODO: Implement files disk processing
        // - Do a network mount of the files on the disk
    }

    // If the disk is not an app disk, backup disk, upgrade disk, or files disk, itis a freshly created empty disk
    // Just log it
    if (!(await isAppDisk(disk) || await isBackupDisk(disk) || await isUpgradeDisk(disk) || await isFilesDisk(disk))) {
        log(`Disk ${disk.id} is an empty disk`)
    }
}

export const isAppDisk = async (disk: Disk): Promise<boolean> => {
    // Check if the disk has an apps folder
    try {
        await $`test -d /disks/${disk.device}/apps`;
        return true;
    } catch {
        return false;
    }
}

export const isBackupDisk = async (disk: Disk): Promise<boolean> => {
    // Create dummy code that always returns false
    // To be updated later
    return false
}

export const isUpgradeDisk = async (disk: Disk): Promise<boolean> => {
    // Create dummy code that always returns false
    // To be updated later
    return false
}

export const isFilesDisk = async (disk: Disk): Promise<boolean> => {
    // Create dummy code that always returns false
    // To be updated later
    return false
}

export const processAppDisk = async (storeHandle: DocHandle<Store>, disk: Disk): Promise<void> => {
    log(`Processing the apps and instances of App Disk ${disk.id} on device ${disk.device}`)

    const store: Store = storeHandle.doc()

    // Apps
    const storedApps = getAppsOfDisk(store, disk)
    const actualApps: App[] = []

    // Call processApp for each folder found in /disks/diskName/apps
    // First check if it has an apps folder
    if (await $`test -d /disks/${disk.device}/apps`.then(() => true).catch(() => false)) {
        log(`Apps folder found on disk ${disk.id}`)
        const appIds = (await $`ls /disks/${disk.device}/apps`).stdout.split('\n')
        log(`App ids found on disk ${disk.id}: ${appIds}`)
        for (let appId of appIds) {
            if (!(appId === "") && !(disk.device == null)) {
                const app = await processApp(storeHandle, disk, appId as AppID)
                if (app) {
                    actualApps.push(app)
                }
            }
        }
    }

    log(`Actual apps: ${actualApps.map(app => app.id)}`)
    log(`Stored apps: ${storedApps.map(app => app.id)}`)

    // Remove apps that are no longer on disk
    storedApps.forEach((storedApp) => {
        // if (!actualApps.includes(storedApp)) {
        //     removeApp(store, disk, storedApp.id)
        // }
        if (!actualApps.some(actualApp => actualApp.id === storedApp.id)) {
            removeApp(store, disk, storedApp.id)
        }
    })

    // Instances
    const storedInstances = getInstancesOfDisk(store, disk)
    const actualInstances: Instance[] = []

    // Call processInstance for each folder found in /instances
    if (await $`test -d /disks/${disk.device}/instances`.then(() => true).catch(() => false)) {
        const instanceIds = (await $`ls /disks/${disk.device}/instances`).stdout.split('\n')
        log(`Instance Ids found on disk ${disk.id}: ${instanceIds}`)
        for (let instanceId of instanceIds) {
            if (!(instanceId === "")) {
                const instance = await processInstance(storeHandle, disk, instanceId as InstanceID)
                if (instance) {
                    actualInstances.push(instance)
                }
            }
        }
    }

    log(`Actual instances: ${actualInstances.map(instance => instance.id)}`)
    log(`Stored instances: ${storedInstances.map(instance => instance.id)}`)

    // Remove instances that are no longer on disk
    storedInstances.forEach((storedInstance) => {
        // if (!actualInstances.includes(storedInstance)) {
        //     removeInstance(storeHandle, disk, storedInstance.id)
        // }
        if (!actualInstances.some(actualInstance => actualInstance.id === storedInstance.id)) {
            removeInstance(storeHandle, disk, storedInstance.id)
        }
    })
}

export const processApp = async (storeHandle: DocHandle<Store>, disk: Disk, appID: AppID): Promise<App | undefined> => {
    const app: App | undefined = await createOrUpdateApp(storeHandle, appID, disk)
    // There is nothing else that we need to do so return the app
    return app
}


export const removeApp = (store: Store, disk: Disk, appId: AppID): void => {
    log(`App ${appId} no longer found on disk ${disk.id}`)
    // There is nothing that we need to do as we do not record on which disks Apps are stored
    // However,  we need to check if there are instances of this app on the disk and signal an error if this is the case
    //   Find the instance of this app on the disk and check if it is still physically on the disk
    //   If it is, then this is an error and we should log an error message as the Instance will fail to start
    const instance = getInstancesOfDisk(store, disk).find(instance => instance.instanceOf === appId)
    // Check if the instance is still physically on the file system of the disk and signal an error
    if (instance && fs.existsSync(`/disks/${disk.device}/instances/${instance.id}`)) {
        log(`Error: Instance ${instance.id} of app ${appId} is still physically on the disk ${disk.id} but the app is being removed. This is an error and should not happen.`)
    }
}

export const processInstance = async (storeHandle: DocHandle<Store>, disk: Disk, instanceId: InstanceID): Promise<Instance | undefined> => {
    const instance = await createOrUpdateInstance(storeHandle, instanceId, disk)
    if (instance) {
        await startInstance(storeHandle, instance, disk)
    }
    return instance
}

export const removeInstance = (storeHandle: DocHandle<Store>, disk: Disk, instanceId: InstanceID): void => {
    log(`Instance ${instanceId} no longer found on disk ${disk.id}`)
    storeHandle.change(doc => {
        const instance = getInstance(doc, instanceId)
        if (instance) {
            instance.status = 'Undocked' as Status // Set the status to Undocked when the instance is removed
            instance.storedOn = null // Clear the storedOn property
            // Remove the instance from the instanceDB
            delete doc.instanceDB[instanceId]
        }
    })
}






```

## File: src/data/Engine.ts
```typescript
import { $, chalk, os, question, YAML, fs, path, sleep } from 'zx';

$.verbose = false;
import { deepPrint, log, uuid } from '../utils/utils.js';
import { readMetaUpdateId, DiskMeta } from './Meta.js';
import { Version, Command, Hostname, Timestamp, DiskID, EngineID } from './CommonTypes.js';
import { Store, getAppsOfEngine, getDisksOfEngine, getInstancesOfEngine } from './Store.js';
import { DocHandle } from '@automerge/automerge-repo';

export interface Engine {
  id: EngineID,
  hostname: Hostname;
  version: Version;
  hostOS: string;
  created: Timestamp;
  lastBooted: Timestamp;
  lastRun: Timestamp;
  lastHalted: Timestamp | null;
  commands: Command[];
}

import { config } from './Config.js';

const getLocalEngineId = async (): Promise<EngineID> => {
  log(`Getting local engine id`)
  try {
    const meta: DiskMeta = await readMetaUpdateId()
    return createEngineIdFromDiskId(meta.diskId)
  } catch (error) {
    console.error(`Error getting local engine id: ${error}`)
    process.exit(1)
  }
}

export const createEngineIdFromDiskId = (diskId: DiskID): EngineID => {
  return "ENGINE_" + diskId as EngineID
}

export const initialiseLocalEngine = async (): Promise<Engine> => {
  try {
    const meta: DiskMeta = await readMetaUpdateId()
    const localEngine: Engine = {
      id: createEngineIdFromDiskId(meta.diskId),
      hostname: os.hostname() as Hostname,
      version: meta.version ? meta.version : "0.0.1" as Version,
      hostOS: os.type(),
      created: meta.created,
      lastBooted: (new Date()).getTime() as Timestamp,
      lastRun: (new Date()).getTime() as Timestamp,
      lastHalted: null,
      commands: []
    }
    return localEngine
  } catch (e) {
    console.error(`Error initializing local engine: ${e}`)
    process.exit(1)
  }
}

export const createOrUpdateEngine = async (storeHandle: DocHandle<Store>, engineId: EngineID): Promise<Engine | undefined> => {
  const newEngine: Engine = await initialiseLocalEngine()
  let engine: Engine
  try {
    storeHandle.change(doc => {
      const storedEngine: Engine | undefined = doc.engineDB[engineId]
      if (!storedEngine) {
        log(`Creating new engine object for local engine ${engineId}`)
        engine = newEngine
        doc.engineDB[engineId] = engine    
      } else {
        log(`Granularly updating existing engine object ${engineId}`)
        engine = doc.engineDB[engineId]
        engine.hostname = os.hostname() as Hostname
        engine.lastBooted = (new Date()).getTime() as Timestamp
        engine.lastRun = (new Date()).getTime() as Timestamp
      }
    })
  return engine!
  } catch (e) {
    log(chalk.red(`Error initializing engine ${engineId}`))
    console.error(e)
    return undefined
  }
}

export const localEngineId = await getLocalEngineId()

export const rebootEngine = async (storeHandle: DocHandle<Store>, engine: Engine) => {
  log(`Gracefully rebooting engine ${engine.hostname}`);
  storeHandle.change(doc => {
    const eng = doc.engineDB[engine.id];
    if (eng) {
      eng.lastRun = new Date().getTime() as Timestamp;
      eng.lastHalted = new Date().getTime() as Timestamp;
    }
  });

  log('Waiting 5 seconds for state to sync before rebooting...');
  await sleep(5000);

  log(`Executing reboot command for ${engine.hostname}`);
  $`sudo reboot now`;
}
export const inspectEngine = (store: Store, engine: Engine) => {
  log(chalk.bgGray(`Engine: ${deepPrint(engine)}`))
  const disks = getDisksOfEngine(store, engine)
  log(chalk.bgGray(`Disks: ${deepPrint(disks)}`))
  const apps = getAppsOfEngine(store, engine)
  log(chalk.bgGray(`Apps: ${deepPrint(apps)}`))
  const instances = getInstancesOfEngine(store, engine)
  log(chalk.bgGray(`Instances: ${deepPrint(instances)}`))
}

// ##################################################################################################
// Installation and system setup functions (formerly in build-engine.ts)
// ##################################################################################################

export const syncEngine = async (user: string, machine: string) => {
  console.log(chalk.blue('Syncing the engine to the remote machine'))
  try {
    if (!fs.existsSync('./script/build_image_assets/gh_token.txt')) {
      const githubToken = await question('Enter the GitHub token: ');
      fs.writeFileSync('./script/build_image_assets/gh_token.txt', githubToken);
    }
    const targetName = machine.endsWith('.local') ? machine.slice(0, -6) : machine;
    await $`./sync-engine --user ${user} ${targetName}`;
  } catch (e) {
    console.log(chalk.red('Failed to sync the engine to the remote machine'));
    console.error(e);
    process.exit(1);
  }
}

export const buildEngine = async (args: any) => {
  const {
    exec, enginePath, isLocalMode, user, machine, hostname, language, keyboard, timezone,
    upgrade, argon, zerotier, raspap, gadget, temperature, version, productionMode
  } = args;

  // Clear known_hosts entry for the target machine to prevent SSH errors
  if (machine) {
    await clearKnownHost(machine);
  }

  await updateSystem(exec);
  if (upgrade) await upgradeSystem(exec);

  await setHostname(exec, hostname);
  await installAvahi(exec);
  await localiseSystem(exec, enginePath, language, keyboard, timezone);
  await installCrontabs(exec, enginePath);

  if (argon) await installArgonFanScript(exec, enginePath);
  if (temperature) await installTemperature(exec);

  await installUdev(exec, enginePath);
  await installVarious(exec);
  await installVarious2(exec);
  await installGh(exec);

  await installDocker(exec, enginePath, user);
  await buildDockerInfrastructure(exec);
  await buildAppsInfrastructure(exec);

  if (raspap) await installRaspAP(exec, enginePath);
  if (zerotier) await installZerotier(exec, enginePath);

  await addMeta(exec, hostname, version);

  //await installEngineNode(exec);
  await installBaseNpm(exec);
  await configurePnpm(exec);
  await installPm2(exec, enginePath);
  await installEnginePM2(exec, enginePath);
  await buildEnginePM2(exec, enginePath);

  if (isLocalMode) {
    const permanentEnginePath = config.defaults.enginePath;
    console.log(chalk.blue(`Copying engine to permanent location: ${permanentEnginePath}`));
    await exec`sudo mkdir -p ${permanentEnginePath}`;
    await exec`sudo rsync -a --delete ${enginePath}/ ${permanentEnginePath}/`;
    await exec`sudo chown -R pi:pi ${permanentEnginePath}`;
  }

  await startEnginePM2(exec, enginePath, config.defaults.enginePath, productionMode);

  if (gadget) await usbGadget(exec, enginePath);

  await rebootSystem(exec);
}

export const clearKnownHost = async (machine: string) => {
  console.log(chalk.yellow(`  - Clearing known_hosts entry for ${machine}...`));
  const knownHostsPath = path.join(os.homedir(), '.ssh', 'known_hosts');
  try {
    await $`ssh-keygen -R ${machine}`;
    console.log(chalk.green(`    - Entry for ${machine} removed from ${knownHostsPath}.`));
  } catch (e: any) {
    console.log(chalk.yellow(`    - Host not found in known_hosts or an error occurred. Continuing...`));
  }
}

export const copyAsset = async (exec: any, enginePath: string, asset: string, destination: string, executable: boolean = false, chmod: string | null = "0644", chown: string | null = "0:0") => {
  console.log(chalk.blue(`Copying asset ${asset} to ${destination}`));
  try {
    await exec`sudo cp ${enginePath}/script/build_image_assets/${asset} ${destination}`;
    await exec`sudo chmod ${chmod} ${destination}/${asset}`;
    await exec`sudo chown ${chown} ${destination}/${asset}`;
    if (executable) {
      await exec`sudo chmod +x ${destination}/${asset}`;
    }
  } catch (e) {
    console.log(chalk.red(`Error copying asset ${asset} to ${destination}`));
    console.error(e);
    process.exit(1);
  }
}

export const createDir = async (exec: any, dir: string, chmod: string | null = "0755", chown: string | null = "0:0") => {
  console.log(chalk.blue(`Creating directory ${dir}`));
  try {
    await exec`sudo mkdir -p ${dir}`;
    await exec`sudo chmod ${chmod} ${dir}`;
    await exec`sudo chown ${chown} ${dir}`;
  } catch (e) {
    console.log(chalk.red(`Error creating directory ${dir}`));
    console.error(e);
    process.exit(1);
  }
}

export const updateSystem = async (exec: any) => {
  console.log(chalk.blue('Updating package list...'));
  try {
    await exec`sudo apt update -y`;
  } catch (e) {
    console.log(chalk.red('Error updating package list'));
    console.error(e);
    process.exit(1);
  }
  console.log(chalk.green('Package list updated'));
}

export const upgradeSystem = async (exec: any) => {
  console.log(chalk.blue('Upgrading packages...'));
  try {
    await exec`sudo DEBIAN_FRONTEND="noninteractive" apt-get upgrade -y`;
  } catch (e) {
    console.log(chalk.red('Error upgrading packages'));
    console.error(e);
    process.exit(1);
  }
}

export const localiseSystem = async (exec: any, enginePath: string, language: string, keyboard: string, timezone: string) => {
  console.log(chalk.blue('Localising the system...'));
  try {
    await copyAsset(exec, enginePath, 'locale.gen', '/etc')
    await exec`sudo locale-gen`;
    
    // Set all locale environment variables
    const localeConfig = [
        `LANG=${language}`,
        `LANGUAGE=${language}`,
        `LC_ALL=${language}`,
        `LC_CTYPE=${language}`
    ].join('\\n');
    await exec`echo -e '${localeConfig}' | sudo tee /etc/default/locale`;
    
    await exec`sudo raspi-config nonint do_configure_keyboard ${keyboard}`
    await exec`sudo timedatectl set-timezone ${timezone}`
  } catch (e) {
    console.log(chalk.red('Error localising the system'));
    console.error(e);
    process.exit(1);
  }
  console.log(chalk.green('System localised'));
}

export const installCrontabs = async (exec: any, enginePath: string) => {
  console.log(chalk.blue('Installing crontabs...'));
  try {
    await copyAsset(exec, enginePath, 'boot.sh', '/usr/local/bin', true)
    await exec`sudo sed -i "s|/home/pi/projects/engine|${config.defaults.enginePath}|g" /usr/local/bin/boot.sh`
    await exec`sudo crontab ${enginePath}/script/build_image_assets/crondefs`
  } catch (e) {
    console.log(chalk.red('Error installing crontabs'));
    console.error(e);
    process.exit(1);
  }
}

export const installTemperature = async (exec: any) => {
  console.log(chalk.blue('Installing lm-sensors...'));
  try {
    await exec`sudo apt install lm-sensors -y`;
  } catch (e) {
    console.log(chalk.red('Error installing lm-sensors'));
    console.error(e);
    process.exit(1);
  }
  console.log(chalk.green('lm-sensors installed'));

  console.log(chalk.blue('Running sensors...'));
  try {
    const ret = await exec`sensors`
    console.log(ret.stdout)
  } catch (e) {
    console.log(chalk.red('Error running sensors'));
    console.error(e);
    process.exit(1);
  }
  console.log(chalk.green('Sensors run'));
}

export const setHostname = async (exec: any, hostname: string) => {
  console.log(chalk.blue(`Setting hostname to ${hostname}`));
  try {
    // 1. First, ensure /etc/hosts has the correct entry for the new hostname
    // This helps sudo resolve the hostname before hostnamectl sets it.
    // Robustly replace the line starting with 127.0.1.1, or add it if missing.
    await exec`sudo sed -i 's/^127\\.0\\.1\\.1.*/127.0.1.1\\t${hostname}/' /etc/hosts`;

    // Robustly update the 127.0.0.1 line to ensure 'localhost' and the new hostname are present.
    // This handles cases where only 'localhost' is present, or an old hostname exists.
    await exec`sudo sed -i 's/^127\\.0\\.0\\.1\s*.*/127.0.0.1\\tlocalhost ${hostname}/' /etc/hosts`;

    // 2. Set the new hostname using hostnamectl
    await exec`sudo hostnamectl set-hostname ${hostname}`;

    // 3. Ensure /etc/hostname is updated directly for persistence across reboots
    await exec`echo "${hostname}" | sudo tee /etc/hostname > /dev/null`;

  } catch (e) {
    console.log(chalk.red('Error setting hostname'));
    console.error(e);
    process.exit(1);
  }
  console.log(chalk.green('Hostname set'));
  console.log(hostname); // Print hostname for capture
}

export const installAvahi = async (exec: any) => {
  console.log(chalk.blue('Installing Avahi for .local mDNS discovery...'));
  try {
    await exec`sudo apt install avahi-daemon libnss-mdns -y`;
    await exec`sudo systemctl enable avahi-daemon`;
    await exec`sudo systemctl start avahi-daemon`;
  } catch (e) {
    console.log(chalk.red('Error installing Avahi'));
    console.error(e);
    process.exit(1);
  }
  console.log(chalk.green('Avahi installed and enabled'));
}

export const installArgonFanScript = async (exec: any, enginePath: string) => {
  console.log(chalk.blue('Installing argon_fan_script.sh...'));
  try {
    await copyAsset(exec, enginePath, 'argon_fan_script.sh', '/usr/local/bin', true, "0755")
  } catch (e) {
    console.log(chalk.red('Error installing argon_fan_script.sh'));
    console.error(e);
    process.exit(1);
  }
  console.log(chalk.green('Argon fan script installed'));

  console.log(chalk.blue('Executing argon_fan_script.sh...'));
  try {
    await exec`sudo /usr/local/bin/argon_fan_script.sh`;
  } catch (e) {
    console.log(chalk.red('Error executing argon_fan_script.sh'));
    console.error(e);
    process.exit(1);
  }
  console.log(chalk.green('Argon fan script executed'));
}

export const installGh = async (exec: any) => {
  console.log(chalk.blue('Installing gh...'));
  try {
    await exec`curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg`
    await exec`sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg`
    await exec`echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null`
    await exec`sudo apt update`
    await exec`sudo apt install gh -y`

  } catch (e) {
    console.log(chalk.red('Error installing gh'));
    console.error(e);
    process.exit(1);
  }
  console.log(chalk.green('gh installed'));
}

export const cloneRepo = async (exec: any, enginePath: string, engineParentPath: string, githubToken: string) => {
  console.log(chalk.blue('Cloning the engine repo...'));
  try {
    await exec`git config --global user.email "koen@swings.be"`;
    await exec`git config --global user.name "Koen Swings"`;
    await exec`gh auth login --with-token < ${enginePath}/script/build_image_assets/gh_token.txt`;
    await exec`if [ -d ${enginePath} ]; then sudo rm -rf ${enginePath}; fi`;
    await exec`cd ${engineParentPath} && git clone https://koenswings:${githubToken}@github.com/koenswings/engine.git`;
  } catch (e) {
    console.log(chalk.red('Error cloning the engine repo'));
    console.error(e);
    process.exit(1);
  }
  console.log(chalk.green('Engine repo cloned'));
}

export const installUdev = async (exec: any, enginePath: string) => {
  console.log(chalk.blue('Installing udev and udev rules...'));
  try {
    await exec`sudo apt install udev -y`;
    await copyAsset(exec, enginePath, '90-docking.rules', '/etc/udev/rules.d')
    await createDir(exec, '/disks', "0755", "0:0")
  } catch (e) {
    console.log(chalk.red('Error installing udev and udev rules'));
    console.error(e);
    process.exit(1);
  }
  console.log(chalk.green('Udev and udev rules installed'));
}

export const rebootSystem = async (exec: any) => {
  console.log(chalk.blue('Rebooting the system...'));
  try {
    await exec`sudo reboot`;
  } catch (e) {
    console.log(chalk.red('Error rebooting the system'));
    console.error(e);
    process.exit(1);
  }
}

export const usbGadget = async (exec: any, enginePath: string) => {
  console.log(chalk.blue('Running the rpi4-usb script...'));
  try {
    await exec`sudo chmod +x ${enginePath}/script/build_image_assets/rpi4-usb.sh`;
    await exec`sudo ${enginePath}/script/build_image_assets/rpi4-usb.sh`;
  } catch (e) {
    console.log(chalk.red('Error running the rpi4-usb script'));
    console.error(e);
    process.exit(1);
  }
  console.log(chalk.green('rpi4-usb script run'));
}

export const installRaspAP = async (exec: any, enginePath: string) => {
  console.log(chalk.blue('Installing RaspAP...'));
  try {
    const raspap_version = "2.8.5"
    await exec`sudo chmod +x ${enginePath}/script/build_image_assets/install-raspap.sh`;
    await exec`sudo ${enginePath}/script/build_image_assets/install-raspap.sh -b ${raspap_version} -y -o 0 -a 0`;
  } catch (e) {
    console.log(chalk.red('Error installing RaspAP'));
    console.error(e);
    process.exit(1);
  }
  console.log(chalk.green('RaspAP installed'));
}

export const installZerotier = async (exec: any, enginePath: string) => {
  console.log(chalk.blue('Installing Zerotier...'));
  try {
    await exec`sudo chmod +x ${enginePath}/script/build_image_assets/install-zerotier.sh`;
    await exec`sudo ${enginePath}/script/build_image_assets/install-zerotier.sh`;
  } catch (e) {
    console.log(chalk.red('Error installing Zerotier'));
    console.error(e);
    process.exit(1);
  }
  console.log(chalk.green('Zerotier installed'));
}

export const installRSync = async (exec: any) => {
  console.log(chalk.blue('Installing rsync...'));
  try {
    await exec`sudo apt install rsync -y`;
  } catch (e) {
    console.log(chalk.red('Error installing rsync'));
    console.error(e);
    process.exit(1);
  }
  console.log(chalk.green('rsync installed'));
}

export const installBaseNpm = async (exec: any) => {
  console.log(chalk.blue('Installing base node, n, npm and pnpm for script execution...'));
  try {
    await exec`sudo apt install npm -y`
    await exec`sudo npm install -g -y n pnpm`
    await exec`sudo n 22.20.0`
  } catch (e) {
    console.log(chalk.red('Error installing base node, n, npm and pnpm...'));
    console.error(e);
    process.exit(1);
  }
  console.log(chalk.green('Base node, n, npm and pnpm installed'));
}

export const installEngineNode = async (exec: any) => {
  console.log(chalk.blue('Installing node version for engine...'));
  try {
    await exec`sudo n 22.20.0`
  } catch (e) {
    console.log(chalk.red('Error installing engine node version...'));
    console.error(e);
    process.exit(1);
  }
  console.log(chalk.green('Engine node version installed'));
}

export const configurePnpm = async (exec: any) => {
  console.log(chalk.blue('Setting up pnpm...'));
  try {
    await exec`sudo pnpm setup`
  } catch (e) {
    console.log(chalk.red('Error setting up pnpm...'));
    console.error(e);
    process.exit(1);
  }
  console.log(chalk.green('pnpm set up'));
}

export const readRemoteDiskId = async (exec: any): Promise<DiskID | undefined> => {
  log(`Reading disk id remotely`)
  try {
    const rootDevice = (await exec`findmnt / -no SOURCE`).stdout.split('/')[2].trim();
    // First, find the full path to hdparm
    const hdparmPath = (await exec`which hdparm`).stdout.trim();
    if (!hdparmPath) {
      log('hdparm command not found on remote machine.');
      return undefined;
    }
    const sn = (await exec`${hdparmPath} -I /dev/${rootDevice} | grep 'Serial\\ Number'`).stdout;
    const id = sn.trim().split(':');
    if (id.length === 2) {
      const diskId = id[1].trim();
      log(`Remote disk id is ${diskId}`);
      return diskId as DiskID;
    } else {
      log(`Cannot read disk id for device ${rootDevice}`);
      return undefined;
    }
  } catch (e) {
    log(`Error reading disk id of the root device: ${e}`);
    return undefined;
  }
}

export const addMeta = async (exec: any, hostname: string, version: string) => {
  let id = await readRemoteDiskId(exec)
  if (id === undefined) {
    console.log(chalk.yellow(`Disk id is ${id}`));
    console.log(chalk.red('Remote disk has no disk id.  Generating one.'))
    id = uuid() as DiskID
  }
  console.log(chalk.blue('Adding metadata...'));
  try {
    await exec`sudo rm -f /META.yaml`;
    await exec`echo 'diskId: ${id}' | sudo tee -a /META.yaml`;
    await exec`echo 'diskName: ${id}' | sudo tee -a /META.yaml`;
    await exec`echo 'hostname: ${hostname}' | sudo tee -a /META.yaml`;
    await exec`echo 'created: ${new Date().getTime()}' | sudo tee -a /META.yaml`;
    await exec`echo 'version: ${version}' | sudo tee -a /META.yaml`;
    await exec`echo 'lastDocked: ${new Date().getTime()}' | sudo tee -a /META.yaml`;
  } catch (e) {
    console.log(chalk.red('Error adding metadata'));
    console.error(e);
    process.exit(1);
  }
}

export const installPm2 = async (exec: any, enginePath: string) => {
  console.log(chalk.blue('Installing pm2...'));
  try {
    await exec`sudo npm install -g pm2`
    await exec`cd ${enginePath}`
    console.log(chalk.blue('Installing pm2-logrotate...'))
    await exec`cd ${enginePath} && sudo pm2 install pm2-logrotate`
  } catch (e) {
    console.log(chalk.red('Error installing pm2'));
    console.error(e);
    process.exit(1);
  }
  console.log(chalk.green('pm2 installed'));
}

export const installEnginePM2 = async (exec: any, enginePath: string) => {
  console.log(chalk.blue('Installing the engine...'))
  await exec`cd ${enginePath} && sudo pnpm install_packages`
}

export const buildEnginePM2 = async (exec: any, enginePath: string) => {
  console.log(chalk.blue('Building the engine with tsc...'))
  await exec`cd ${enginePath} && sudo pnpm build`
}

export const startEnginePM2 = async (exec: any, enginePath: string, permanentEnginePath: string, productionMode: boolean) => {
  console.log(chalk.blue('Starting the engine with pm2...'));
  try {
    try {
      // We require idempotency - check if the engine has already started before starting and persisting it
      await exec`pm2 show engine`
    } catch (e) {
      console.log(chalk.blue(`Starting a ${productionMode ? "production" : "dev"} mode engine with pm2...`))
      await exec`sudo cp ${enginePath}/script/build_image_assets/pm2.config.cjs ${permanentEnginePath}/`
      await exec`sudo chown pi:pi ${permanentEnginePath}/pm2.config.cjs`

      if (productionMode) {
        await exec`cd ${permanentEnginePath} && sudo pm2 start pm2.config.cjs --env production`
      } else {
        await exec`cd ${permanentEnginePath} && sudo pm2 start pm2.config.cjs --env development`
      }
      console.log(chalk.blue('Saving the pm2 process list...'))
      await exec`cd ${permanentEnginePath} && sudo pm2 save`
      console.log(chalk.blue('Enabling pm2 to start on boot...'))
      await exec`cd ${permanentEnginePath} && sudo pm2 startup`
    }
  } catch (e) {
    console.log(chalk.red('Error starting the engine with pm2'));
    console.error(e);
    process.exit(1);
  }
  console.log(chalk.green('Engine started with pm2'))
}

export const installVarious = async (exec: any) => {
  console.log(chalk.blue('Installing tcpdump, vim and hdparm...'));
  try {
    await exec`sudo apt install tcpdump vim hdparm -y`;
  } catch (e) {
    console.log(chalk.red('Error installing tcpdump, vim and hdparm'));
    console.error(e);
    process.exit(1);
  }
  console.log(chalk.green('tcpdump, vim and hdparm installed'));
}

export const installVarious2 = async (exec: any) => {
  // Install the git, dnsutlis, tree, lshw and cloud-guest-utils packages
  console.log(chalk.blue('Installing lm-sensors, git, dnsutils, tree, lshw and cloud-guest-utils...'));
  try {
    await exec`sudo apt install git dnsutils tree lshw cloud-guest-utils -y`;
  } catch (e) {
    console.log(chalk.red('Error installing git, dnsutils, tree, lshw and cloud-guest-utils'));
    console.error(e);
    process.exit(1);
  }
  console.log(chalk.green('git, dnsutils, tree, lshw and cloud-guest-utils installed'));
}


export const buildAppsInfrastructure = async (exec: any) => {
  // Create the /apps, /apps/catalog, and /apps/instances directories 
  console.log(chalk.blue('Creating the /services, /apps, and /instances directories'))
  try {
    await createDir(exec, '/services')
    await createDir(exec, '/apps')
    await createDir(exec, '/instances')
  } catch (e) {
    console.log(chalk.red('Error creating the /services, /apps, and /instances directories'));
    console.error(e);
    process.exit(1);
  }
  console.log(chalk.green('The /services, /apps, and /instances directories have been created'));
}


const installDocker = async (exec, enginePath, user) => {

  // Run the install-docker.sh script
  console.log(chalk.blue('Installing Docker'))
  try {
    // Make the script executable
    await exec`sudo chmod +x ${enginePath}/script/build_image_assets/install-docker.sh`;
    await exec`sudo ${enginePath}/script/build_image_assets/install-docker.sh`;
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
    if (await exec`getent group docker`) {
      console.log(chalk.blue('The docker group already exists'));
    } else {
      await exec`sudo groupadd docker`;
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
    await exec`sudo usermod -aG docker ${user}`;
  } catch (e) {
    console.log(chalk.red('Error adding the ssh user to the docker group'));
    console.error(e);
    process.exit(1);
  }

  // Copy the daemon.json asset to /etc/docker
  console.log(chalk.blue('Configuring Docker'))
  try {
    await copyAsset(exec, enginePath, 'daemon.json', '/etc/docker', false, "0644")
  } catch (e) {
    console.log(chalk.red('Error configuring Docker'));
    console.error(e);
    process.exit(1);
  }
  console.log(chalk.green('Docker configured'));


  // Restart the Docker service
  console.log(chalk.blue('Restarting the Docker service'))
  try {
    await exec`sudo systemctl restart docker`;
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
    let ret = await exec`sudo docker compose version`
    console.log(ret.stdout)
    ret = await exec`sudo docker version`
    console.log(ret.stdout)
    ret = await exec`sudo docker info`
    console.log(ret.stdout)
  } catch (e) {
    console.log(chalk.red('Error printing the Docker info'));
    console.error(e);
    process.exit(1);
  }
  console.log(chalk.green('Docker info printed'));
}

const buildDockerInfrastructure = async (exec: any) => {

  // Create the internal docker networks frontend and backend if they do not already exist
  console.log(chalk.blue('Creating the frontend network'))
  try {
    // Check if the frontend network already exists
    // (use sudo because the docker group has not been added yet - requires a reboot)
    if (await exec`sudo docker network ls --filter name=frontend`) {
      console.log(chalk.blue('The frontend network already exists'));
    } else {
      await exec`sudo docker network create --internal frontend`;
    }
    // Check if the backend network already exists
    if (await exec`sudo docker network ls --filter name=backend`) {
      console.log(chalk.blue('The backend network already exists'));
    } else {
      await exec`sudo docker network create --internal backend`;
    }
  } catch (e) {
    console.log(chalk.red('Error creating the frontend or backend network'));
    console.error(e);
    process.exit(1);
  }
  console.log(chalk.green('Frontend and backend networks created'));
}


// ##################################################################################################
// Obsolete functions
// To be kept for reference only
// ##################################################################################################


const startDockerEngine = async (exec: any, enginePath: string, productionMode: boolean) => {
  // Build the engine image
  console.log(chalk.blue(`Building a ${productionMode ? "production" : "dev"} mode engine image...`))
  try {
    // Compose build
    // (use sudo because the docker group has not been added yet - requires a reboot)
    if (productionMode) {
      await exec`cd ${enginePath} && sudo docker compose -f compose-engine-prod.yaml build`;
    } else {
      await exec`cd ${enginePath} && sudo docker compose -f compose-engine-dev.yaml build`;
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
      await exec`cd ${enginePath} && sudo docker compose -f compose-engine-prod.yaml up -d`;
    } else {
      await exec`cd ${enginePath} && sudo docker compose -f compose-engine-dev.yaml up -d`;
    }
  } catch (e) {
    console.log(chalk.red('Error composing up the engine'));
    console.error(e);
    process.exit(1);
  }
  console.log(chalk.green('Engine composed up'));
}

```

## File: src/data/Instance.ts
```typescript
import { $, YAML, chalk, fs, os, sleep } from "zx";

$.verbose = false;
import { addOrUpdateEnvVariable, deepPrint, log, randomPort, readEnvVariable, uuid } from "../utils/utils.js";
import { DockerEvents, DockerMetrics, DockerLogs, InstanceID, AppID, PortNumber, ServiceImage, Timestamp, Version, DeviceName, InstanceName, AppName, Hostname, DiskID } from "./CommonTypes.js";
import { Store, getDisk, getEngine, getLocalEngine, getInstancesOfEngine, } from "./Store.js";
import { Disk } from "./Disk.js";
import { localEngineId } from "./Engine.js";
import { network } from "./Network.js";
import { createAppId } from "./App.js";
import { Docker } from "node-docker-api";
import { createMeta } from '../data/Meta.js'
import { error } from "console";
import { DocHandle } from "@automerge/automerge-repo";


export interface Instance {
  id: InstanceID;
  instanceOf: AppID;   // Reference by name since we can store the AppMaster object only once in Yjs
  name: InstanceName;
  status: Status;
  port: PortNumber;
  serviceImages: ServiceImage[];
  created: Timestamp;       // We must use a timestamp number as Date objects are not supported in YJS
  lastBackedUp: Timestamp;  // We must use a timestamp number as Date objects are not supported in YJS
  lastStarted: Timestamp;   // We must use a timestamp number as Date objects are not supported in YJS
  storedOn: DiskID | null;  // The disk that this instance is stored on. null if we do not know it yet
}

export type Status = 'Undocked'      // 
  | 'Docked'
  | 'Starting'
  | 'Running'
  | 'Pauzed'        // Stopped running but containers are still there (so still consuming resources)
  | 'Stopped'       // Stopped running and containers are removed (so not consuming resources)
  | 'Error';


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
    if (version === "latest") {
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
      const serviceImageFile = serviceImage.replace(/\//g, '_')
      if (fs.existsSync(`/disks/${device}/services/${serviceImageFile}.tar`)) {
        console.log(`Service image ${serviceImage} already exists`)
      } else {
        console.log(`Pulling service image ${serviceImage}`)
        await $`docker image pull ${serviceImage}`
        // Save the service image
        await $`docker save ${serviceImage} > /disks/${device}/services/${serviceImageFile}.tar`
      }
    }

    // **************************
    // STEP 4 - Create the META.yaml file if it is not already there
    // **************************

    if (!fs.existsSync(`/disks/${device}/META.yaml`)) {
      log(`Creating META.yaml file on disk ${device}`)
      createMeta(device)
    } else {
      console.log(`META.yaml file already exists on disk ${device}`)
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

export const createOrUpdateInstance = async (storeHandle: DocHandle<Store>, instanceId: InstanceID, disk: Disk): Promise<Instance | undefined> => {
  let instance: Instance
  try {
    const composeFile = await $`cat /disks/${disk.device}/instances/${instanceId}/compose.yaml`
    const compose = YAML.parse(composeFile.stdout)
    const services = Object.keys(compose.services)
    const servicesImages = services.map(service => compose.services[service].image)
    // const instanceId = createInstanceId(instanceName, disk.id)  
    const instanceName = compose['x-app'].instanceName as InstanceName
    storeHandle.change(doc => {
      const storedInstance: Instance | undefined = doc.instanceDB[instanceId]
      if (!storedInstance) {
        // Create a new instance object
        log(`Creating new instance object ${instanceId} on disk ${disk.id}`)
        instance = {
          id: instanceId,
          instanceOf: createAppId(compose['x-app'].name, compose['x-app'].version) as AppID,
          name: instanceName as InstanceName,
          storedOn: disk.id,
          status: 'Docked' as Status,
          port: 0 as PortNumber, // Will be set later
          serviceImages: servicesImages as ServiceImage[],
          created: new Date().getTime() as Timestamp,
          lastBackedUp: 0 as Timestamp,
          lastStarted: 0 as Timestamp,
        }
        doc.instanceDB[instanceId] = instance
      } else {
        // Granularly update the existing instance object
        log(`Updating existing instance object ${instanceId} on disk ${disk.id}`)
        instance = storedInstance
        instance.instanceOf = createAppId(compose['x-app'].name, compose['x-app'].version) as AppID
        instance.name = instanceName as InstanceName
        instance.status = 'Docked' as Status;
        instance.storedOn = disk.id
        instance.serviceImages = servicesImages as ServiceImage[]

      }
    })
    return instance!
  } catch (e) {
    log(chalk.red(`Error initializing instance ${instanceId} on disk ${disk.id}`))
    console.error(e)
    return undefined
  }
}

export const createPortNumber = async (store: Store): Promise<PortNumber> => {
  let port = randomPort()
  let portInUse = true
  let portInUseResult
  const localEngine = getLocalEngine(store)
  const instances = getInstancesOfEngine(store, localEngine)

  // Check if the port is already in use on the system
  while (portInUse) {
    log(`Checking if port ${port} is in use`)
    try {
      portInUseResult = await $`netstat -tuln | grep -w ${port}`
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

// KSW - UNTESTED >>>
export const checkPortNumber = async (port: PortNumber): Promise<boolean> => {
  log(`Checking if port ${port} is in use`)
  try {
    const portInUseResult = await $`netstat -tuln | grep -w ${port}`
    log(`Port ${port} is in use`)
    return true
  } catch (e) {
    log(`Port ${port} is not in use`)
    return false
  }
}
// KSW - UNTESTED <<<

export const startInstance = async (storeHandle: DocHandle<Store>, instance: Instance, disk: Disk): Promise<void> => {
  const store: Store = storeHandle.doc()
  console.log(`Starting instance '${instance.id}' on disk ${disk.id} of engine '${localEngineId}'.`)
  // Set the instance status to Starting
  storeHandle.change(doc => {
    const inst = doc.instanceDB[instance.id]
    inst.status = 'Starting' as Status // Set the status to Starting when the instance is started
  })

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

    let port: PortNumber = 0 as PortNumber

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

      // >>> KSW - UNTESTED
      // Check if the port is already in use on the system
      const portInUse = await checkPortNumber(port)
      if (portInUse) {
        log(`Port ${port} is already in use. Generating a new port number.`)
        // If the app is kolibri, it means that it has a fixed port and so either another kolibri instance is already running, ]
        // or it is still running after being stopped because the disk was disconnected. 
        // If the instance was still running after being stopped, lets wait for 10 secs and try again. If it is still running, we throw an error.
        if (instance.instanceOf.startsWith('kolibri' as AppID)) {
          log(`Instance ${instance.id} is a kolibri instance. Waiting 10 seconds to see if the port becomes free.`)
          await sleep(10000)
          const portStillInUse = await checkPortNumber(port)
          if (portStillInUse) {
            throw new Error(`Port ${port} is still in use after waiting. Cannot start kolibri instance ${instance.id}.`)
          } else {
            log(`Port ${port} is now free.`)
          }
        } else {
          port = await createPortNumber(store)
          // Write the new port number to the .env file
          // await $`echo "port=${port}" > /disks/${disk.device}/instances/${instance.id}/.env`
          await addOrUpdateEnvVariable(`/disks/${disk.device}/instances/${instance.id}/.env`, 'port', port.toString())
        }
      } else {
        log(`Port ${port} is not in use`)
      }
      // KSW UNTESTED <<<

    } else {
      log(`No port number has previously been generated.`)
      // If the app is kolibri, assign it port 8080
      if (instance.instanceOf.startsWith('kolibri' as AppID)) {
        port = 8080 as PortNumber
        log(`Instance ${instance.id} is a kolibri instance. Assigning it port ${port}.`)
      } else {
        log(`Generating a new port number for instance ${instance.id}.`)
        port = await createPortNumber(store)
      }
      // Write a .env file in which you define the port variable
      // await $`echo "port=${port}" > /disks/${disk.device}/instances/${instance.id}/.env`  
      await addOrUpdateEnvVariable(`/disks/${disk.device}/instances/${instance.id}/.env`, 'port', port.toString())
    }

    console.log(`Found a port number for instance ${instance.id}: ${port}`)
    // Assign the port number to the instance object
    storeHandle.change(doc => {
      const inst = doc.instanceDB[instance.id]
      inst.port = port as PortNumber
    })

    // **************************
    // STEP 1b - Generate a password for the app
    // **************************

    let pass: string = ""

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

    log(`Preloading the service images of the services from the compose file`)
    // Extract the service images of the services from the compose file, and pull them
    // Open the compose.yaml file of the app instance
    log(`Reading and parsing the compose.yaml file of the app instance`)
    const composeFile = await $`cat /disks/${disk.device}/instances/${instance.id}/compose.yaml`
    const compose = YAML.parse(composeFile.stdout)
    const services = compose.services
    for (const serviceName in services) {
      const serviceImage = services[serviceName].image
      // Load the service image from the saved tar file
      log(`Loading the service image ${serviceImage} from the saved tar file`)
      await $`docker image load < /disks/${disk.device}/services/${serviceImage.replace(/\//g, '_')}.tar`
    }

    // **************************
    // STEP 3 - Container creation
    // **************************

    await createInstanceContainers(storeHandle, instance, disk)

    // **************************
    // STEP 4 - run the Instance
    // **************************

    await runInstance(storeHandle, instance, disk)
  }

  catch (e) {
    console.log(chalk.red('Error starting app instance'))
    storeHandle.change(doc => {
      const inst = doc.instanceDB[instance.id]
      inst.status = 'Error' as Status // Set the status to Error when the instance fails to start
    })
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

export const createInstanceContainers = async (storeHandle: DocHandle<Store>, instance: Instance, disk: Disk) => {
  const store: Store = storeHandle.doc()
  try {
    log(`Creating the containers for the services of the app instance`)

    // App-specific pre-processing commands
    const app = store.appDB[instance.instanceOf]
    if (app && app.name === 'nextcloud') {

      // Pass the hostname to the compose file via .env
      const localEngine = getLocalEngine(store)
      const hostname = localEngine.hostname
      if (hostname) {
        await addOrUpdateEnvVariable(`/disks/${disk.device}/instances/${instance.id}/.env`, 'hostname', hostname)
      }

      // Pass the ip address to the compose file via .env
      const interfaceData = os.networkInterfaces()
      const ip = interfaceData["eth0"]?.find((iface) => iface.family === "IPv4")?.address
      if (ip) {
        log(`Found IP address ${ip} for instance ${instance.id}`)
        // await $`echo "ip=${ip}" >> /disks/${disk.device}/instances/${instance.id}/.env`
        await addOrUpdateEnvVariable(`/disks/${disk.device}/instances/${instance.id}/.env`, 'ip', ip)
      } else {
        log(chalk.red(`No IP address found for instance ${instance.id}`))
      }
      // const connections = network.connections
      // if (connections && connections["eth0"]) {
      //   const ip = connections["eth0"].ip4
      //   // Write the ip address to the .env file
      //   // await $`echo "ip=${ip}" >> /disks/${disk.device}/instances/${instance.id}/.env`
      //   await addOrUpdateEnvVariable(`/disks/${disk.device}/instances/${instance.id}/.env`, 'ip', ip)
      // }

    }

    log(`Creating containers of app instance '${instance.id}' on disk ${disk.id} of engine ${localEngineId}.`)
    // await $`docker compose -f /disks/${disk.device}/instances/${instance.id}/compose.yaml create`
    await $`cd /disks/${disk.device}/instances/${instance.id} && docker compose create`
    // Set the instance status to Pauzed
    storeHandle.change(doc => {
      const inst = doc.instanceDB[instance.id]
      inst.status = 'Pauzed' as Status // Set the status to Pauzed when the instance is created
    })
  } catch (e) {
    console.log(chalk.red(`Error creating the containers of app instance ${instance.id}`))
    console.error(e)
    storeHandle.change(doc => {
      const inst = doc.instanceDB[instance.id]
      inst.status = 'Error' as Status // Set the status to Error when the instance fails to create
    })
  }
}



export const runInstance = async (storeHandle: DocHandle<Store>, instance: Instance, disk: Disk): Promise<void> => {
  const store: Store = storeHandle.doc()
  try {

    log(`Running instance '${instance.id}' on disk ${disk.id} of engine '${localEngineId}'.`)

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
        storeHandle.change(doc => {
          const inst = doc.instanceDB[instance.id]
          inst.port = parsedPort as PortNumber
        })
      } else {
        log(chalk.red(`Error parsing port number from .env file for instance ${instance.id}. Got ${parsedPort} from ${port}`))
      }
    } else {
      log(chalk.red(`Error extracting port number from .env file for instance ${instance.id}`))
    }

    // Compose up the app
    //await $`docker compose -f /disks/${disk.device}/instances/${instance.id}/compose.yaml up -d`
    await $`cd /disks/${disk.device}/instances/${instance.id} && docker compose up -d`


    storeHandle.change(doc => {
      const inst = doc.instanceDB[instance.id]
      inst.lastStarted = new Date().getTime() as Timestamp
      inst.status = 'Running' as Status
    })
    // Modify the dockerMetrics of the instance
    // instance.dockerMetrics = {
    //   memory: os.totalmem().toString(),
    //   cpu: os.loadavg().toString(),
    //   network: "",
    //   disk: ""
    // }

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
          log(`Configuring nextcloud office`)
          log('Sleeping for 20 seconds to allow the app to start')
          await sleep(20000)
          log(`Running the occ command to use the Collabora server at ${ip}:9980`)
          await $`sudo docker exec ${instance.id}-nextcloud-app-1 runuser --user www-data -- php occ config:app:set --value=http://${ip}:9980 richdocuments wopi_url`
          log('Running the occ commands to set the trusted domains')
          await $`sudo docker exec ${instance.id}-nextcloud-app-1 runuser --user www-data -- php occ config:system:set trusted_domains 0 --value=*.local:*`
          await $`sudo docker exec ${instance.id}-nextcloud-app-1 runuser --user www-data -- php occ config:system:set trusted_domains 2 --value=192.168.0.*:*`
          log(`occ commands executed`)
        } catch (e) {
          log(chalk.red(`Error configuring nextcloud office to use the Collabora server at ${ip}:9980`))
          console.error(e)
          storeHandle.change(doc => {
            const inst = doc.instanceDB[instance.id]
            inst.status = 'Error' as Status // Set the status to Error when the instance fails to configure
          })
        }
      }
    }


  } catch (e) {

    console.log(chalk.red(`Error running app instance ${instance.id}`))
    console.error(e)
    storeHandle.change(doc => {
      const inst = doc.instanceDB[instance.id]
      inst.status = 'Error' as Status // Set the status to Error when the instance fails to run
    })
  }
}

export const stopInstance = async (storeHandle: DocHandle<Store>, instance: Instance, disk: Disk): Promise<void> => {
  console.log(`Stopping app '${instance.id}' on disk '${disk.id}' of engine '${localEngineId}'.`)

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
    const instanceContainers = containers.filter(container => {
      const name = container.data['Names'][0]
      return name.startsWith(`/${instance.id}-`) || name.startsWith(`/${instance.id}_`)
    })
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
    // Set the status of the instance to Stopped
    storeHandle.change(doc => {
      const inst = doc.instanceDB[instance.id]
      inst.status = 'Stopped' as Status // Set the status to Stopped when the instance is stopped
    })
  } catch (e) {
    console.log(chalk.red(`Error stopping app instance ${instance.id}`))
    console.error(e)
    storeHandle.change(doc => {
      const inst = doc.instanceDB[instance.id]
      inst.status = 'Error' as Status // Set the status to Error when the instance fails to stop
    })
  }
}

```

## File: src/data/Meta.ts
```typescript
import { $, chalk, YAML } from 'zx'
import { deepPrint, fileExists, log, stripPartition, uuid } from '../utils/utils.js'
import { DeviceName, DiskID, DiskName, Timestamp, Version } from './CommonTypes.js'
import { config } from './Config.js'

export interface DiskMeta {
  diskId: DiskID         
  // The serial number of the disk or user-assigned iif there is no serial number - We store it so that it easily inspectable
  
  isHardwareId?: boolean 
  // True if the diskId is a hardware id, false if it is a user-assigned id. If this is not present, the diskId has a generated id.
  
  diskName: DiskName     
  // The user-defined name of the disk.  Not necessarily unique
  
  created: Timestamp     
  // The timestamp when the disk was created
  
  version?: Version      
  // Only applicable to Engine Disks - the version of the engine running on the disk
  
  lastDocked: Timestamp  
  // The timestamp when the disk was last docked (for all other disks) or when the engine was last booted (in case of a system disk)
}

// Create a sample META.yaml file for an appdisk with id AA000000000000000724 and a create timestamp corresponding to 2024-12-12 and a lastDocked timestamp corresponding to 2025-01-07
const sampleMeta: DiskMeta = {
  diskId: 'AA000000000000000724' as DiskID,
  isHardwareId: true,
  diskName: 'MyAppDisk' as DiskName,
  created: 1731446400000 as Timestamp,
  lastDocked: 1733673600000 as Timestamp
}

const devMeta: DiskMeta = {
  diskId: 'DevEngine' as DiskID,
  isHardwareId: true,
  diskName: 'DevelopmentEngine' as DiskName,
  created: 1731446400000 as Timestamp,
  lastDocked: 1733673600000 as Timestamp,
  version: '1.0.0' as Version
}

// The corresponding YAML string
// diskId: 'AA000000000000000724'
// isHardwareId: true
// diskName: 'Nextcloud' 
// created:    1731446400000 
// lastDocked: 1733673600000 

export const readMetaUpdateId = async (deviceSpec?: DeviceName): Promise<DiskMeta> => {
  let path
  let device: DeviceName
  // If the config file has the isDev option set to true, we return the devMeta
  if (config.settings.isDev) {
    log(`Running in development mode, returning devMeta`)
    return devMeta
  }
  try {
    if (deviceSpec) {
      path = `/disks/${deviceSpec}/META.yaml`
      device = deviceSpec as DeviceName
    } else {
      path = `/META.yaml`
      device = (await $`findmnt / -no SOURCE`).stdout.split('/')[2].trim() as DeviceName
      //log(`last character of device is ${device[device.length - 1]}`)
    }
    log(`Reading metadata for device ${device} at path ${path}`)

    //log(`Our current dir is ${await $`pwd`} with content ${await $`ls`} and path ${path}`)
    if (await fileExists(path)) {

      // Read the META.yaml file
      const metaContent = (await $`cat ${path}`).stdout.trim()
      const meta: DiskMeta = YAML.parse(metaContent)
      log(`metaContent: ${metaContent}`)
      log(`meta: ${deepPrint(meta)}`)
      let update = false

      // Find the hardware id
      let diskId = await readHardwareId(device) as DiskID
      if (!diskId) {
        log(`No hardware id found for device ${device}`)
        if (meta.hasOwnProperty('isHardwareId') && meta.isHardwareId) {
          log(`The disk id in the META file is a hardware id, so must come from another disk. So this disk is a clone and it is cloned onto media without a hardware id. Generating a new hardware id`)
          diskId = uuid() as DiskID
          // Resetting the isHardwareId flag
          meta.isHardwareId = false
        } else {
          log(`The disk id in the META file is a user-assigned id. Keeping it as is`)
          diskId = meta.diskId
        }
      }

      // If the diskId does not match the one in the META file, update it
      if (String(meta.diskId) !== String(diskId)) {
        meta.diskId = diskId
        if (meta.isHardwareId) {
          log(`Found a new hardware id that is different from the one in the META file. Updating disk id to ${diskId}`)
        } else {
          log(`Created a new id that is different from the one in the META file. Updating disk id to ${diskId}`)
        }
        update = true
      }

      // Update the lastDocked timestamp
      meta.lastDocked = new Date().getTime() as Timestamp
      update = true  // Always update the lastDocked timestamp

      // Upgrade older META files that do not have the diskName field
      if (!meta.hasOwnProperty('diskName')) {
        log(`Upgrading older META file format to include diskName field and remove obsolete properties`)
        meta.diskName = diskId.toString() as DiskName
        // Remove the properties engineId and hostname
        // Ignore type checking the next two lines
        // @ts-ignore
        meta.engineId = undefined
        // @ts-ignore
        meta.hostname = undefined
        update = true
      }

      // Update the META file if necessary
      if (update) {
        await writeMeta(meta, path)
      }
      return meta
    } else {
      log(`No META file found at path ${path}. This disk has not yet been touched by the system.`)
      throw new Error(`No META file found at path ${path}`)
    }
  } catch (e) {
    log(`Error reading metadata: ${e}`)
    throw e
  }
}

export const readHardwareId = async (device: DeviceName): Promise<DiskID | undefined> => {
  log(`Reading disk id for device ${device}`)
  try {
    const rootDevice = stripPartition(device)
    log(`Root device is ${rootDevice}`)
    //const model = (await $`lsblk -o MODEL /dev/${rootDevice} --noheadings`).stdout.trim()
    const model = (await $`cat /sys/block/${rootDevice}/device/model`).stdout.trim()
    log(`Model is ${model}`)
    const vendor = (await $`cat /sys/block/${rootDevice}/device/vendor`).stdout.trim()
    log(`Vendor is ${vendor}`)
    if (model === 'Flash Drive FIT') {
      return await readHardwareIdSamsungFIT(device)
    } else if (vendor === 'INTENSO') {
      return await readHardwareIdIntenso(device)
    } else {
      log(`Model ${model} of vendor ${vendor} not recognized`)
      return undefined
    }
  } catch (e) {
    log(`Error reading disk id of device ${device}: ${e}`)
    return undefined
  }
}

export const readHardwareIdSamsungFIT = async (device: DeviceName): Promise<DiskID | undefined> => {
  try {
    const id = (await $`/usr/lib/udev/scsi_id --whitelisted --replace-whitespace --device=/dev/${device}`).stdout.trim()
    log(`ID is ${id}`)  
    return id as DiskID
  } catch (e) {
    log(`Error reading disk id of device ${device}: ${e}`)
    return undefined
  }
}

export const readHardwareIdIntenso = async (device: DeviceName): Promise<DiskID | undefined> => {
  try {
    const hdparm = (await $`which hdparm`).stdout
    log(`hdparm is at ${hdparm}`)
    //const info = (await $`hdparm -I /dev/${device}`).stdout
    //log(`Info is ${info}`)
    const sn = (await $`hdparm -I /dev/${device} | grep 'Serial\ Number'`).stdout
    log(`Serial number is ${sn}`)
    const id = sn.trim().split(':')
    log(`split ID is ${id}`)
    if (id.length === 2) {
      return id[1].trim() as DiskID
    } else {
      log(`Cannot read disk id for device ${device}`)
      return undefined
    }
  } catch (e) {
    log(`Error reading disk id of device ${device}: ${e}`)
    return undefined
  }
}



export const createMeta = async (device: DeviceName, engineVersion: Version | undefined = undefined): Promise<DiskMeta> => {
  // Find the hardware id
  let isHardwareId
  let diskId = await readHardwareId(device) as DiskID
  if (!diskId) {
    diskId = uuid() as DiskID
    isHardwareId = false
  } else {
    isHardwareId = true
  }

  const meta: DiskMeta = {
    diskId: diskId,
    isHardwareId: isHardwareId,
    diskName: diskId.toString() as DiskName,
    created: new Date().getTime() as Timestamp,
    lastDocked: new Date().getTime() as Timestamp
  }
  if (engineVersion) {
    meta.version = engineVersion
  }

  try {
    // Create the META.yaml file
    await writeMeta(meta, `/disks/${device}/META.yaml`)
  } catch (e) {
    console.log(chalk.red('Error creating metadata'));
  }
  return meta
}

const writeMeta = async (meta: DiskMeta, rootPath: string): Promise<void> => {
  log(`Writing metadata ${deepPrint(meta)} to ${rootPath}`)
  try {
    // const enginePath = `/home/pi`
    // Remove the old META file
    // await $`sudo rm -f ${enginePath}/METAtemp.yaml`
    // await $`sudo touch ${enginePath}/METAtemp.yaml`
    // await $`sudo echo 'diskId: ${meta.diskId}' >> ${enginePath}/METAtemp.yaml`
    // await $`sudo echo 'diskName: ${meta.diskName}' >> ${enginePath}/METAtemp.yaml`
    // await $`sudo echo 'created: ${meta.created}' >> ${enginePath}/METAtemp.yaml`
    // await $`sudo echo 'lastDocked: ${meta.lastDocked}' >> ${enginePath}/METAtemp.yaml`
    // if (meta.version) {
    //   await $`sudo echo 'version: ${meta.version}' >> ${enginePath}/METAtemp.yaml`
    // }
    // if (meta.isHardwareId) {
    //   await $`sudo echo 'isHardwareId: true' >> ${enginePath}/METAtemp.yaml`
    // }
    // // Move the META.yaml file to the root directory
    // await $`sudo mv ${enginePath}/METAtemp.yaml ${rootPath}`

    // Generate a temporary file in /home/pi using mktemp
    const tmpFile = (await $`sudo mktemp --suffix=.yaml --tmpdir=/home/pi`).stdout.trim()
    await $`sudo echo 'diskId: ${meta.diskId}' >> ${tmpFile}`
    await $`sudo echo 'diskName: ${meta.diskName}' >> ${tmpFile}`
    await $`sudo echo 'created: ${meta.created}' >> ${tmpFile}`
    await $`sudo echo 'lastDocked: ${meta.lastDocked}' >> ${tmpFile}`
    if (meta.version) {
      await $`sudo echo 'version: ${meta.version}' >> ${tmpFile}`
    }
    if (meta.isHardwareId) {
      await $`sudo echo 'isHardwareId: true' >> ${tmpFile}`
    }
    // Move the META.yaml file to the root directory
    await $`sudo mv ${tmpFile} ${rootPath}`

  } catch (e) {
    console.log(chalk.red('Error writing metadata'))
    console.error(e)
  }
}



```

## File: src/data/Network.ts
```typescript
import { BrowserWebSocketClientAdapter, WebSocketClientAdapter } from "@automerge/automerge-repo-network-websocket";
import { Engine } from './Engine.js'
import { findIp, log } from '../utils/utils.js';
import { EngineID, Hostname, IPAddress, InterfaceName, PortNumber, Timestamp } from './CommonTypes.js';
import { DocHandle, DocumentId, Repo } from "@automerge/automerge-repo";
import { config } from './Config.js';
import { Store, findRunningEngineByHostname } from "./Store.js";
import { fs } from "zx";

const settings = config.settings
const STORE_IDENTITY_PATH = "./"+config.settings.storeIdentityFolder
const STORE_URL_PATH = STORE_IDENTITY_PATH + "/store-url.txt"
const storeDocUrlStr = fs.readFileSync(STORE_URL_PATH, 'utf-8');
const storeDocId = storeDocUrlStr.replace('automerge:', '') as DocumentId;


// **********
// Typedefs
// **********


/**
 * The possible results returned from the Yjs websocket provider
 */
export type ConnectionResult = { status: ConnectionStatus } 
export type ConnectionStatus = 'connected' | 'disconnected' | 'synced' | 'reconnection-failure-3'


// The root level Network object 
/**
 * Manages the network of connected Engines
 */
export interface Network {
  // All connected engines sorted per interface
  connections: Connections;

}

// Create a type called Connections that represents all connections that a Network has
// The connections are organised per ip address of the Engine that the Network is connected to
/**
 * The connections that a Network has to other Engines
 */
export type Connections = { [key: IPAddress]: Connection }   // key is the ip address
export type Connection = {
    adapter: WebSocketClientAdapter;
    missedDiscoveryCount: number;
    hostname: Hostname;
    engineId: EngineID;
}

export const network: Network = {
  connections: {}
}

const MAX_MISSED_DISCOVERIES = 3;

// **********
// Functions
// **********

export const manageDiscoveredPeers = async (repo: Repo, discoveredPeers: Map<IPAddress, {hostname: Hostname, engineId: EngineID}>, storeHandle: DocHandle<Store>): Promise<void> => {
  const port = settings.port as PortNumber || 1234 as PortNumber;
  // Increment missed discovery count for all existing connections
  for (const connection of Object.values(network.connections)) {
      connection.missedDiscoveryCount++;
  }

  // Reset count for discovered peers and connect to new ones
  for (const [address, peerInfo] of discoveredPeers.entries()) {
      const connectionKey = `${address}:${port}`;
      if (network.connections[connectionKey]) {
          network.connections[connectionKey].missedDiscoveryCount = 0;
      } else {
          await connectEngine(repo, address, peerInfo.hostname, peerInfo.engineId, storeDocId);
      }
  }

  // Remove connections that have been missed too many times
  for (const [connectionKey, connection] of Object.entries(network.connections)) {
      if (connection.missedDiscoveryCount > MAX_MISSED_DISCOVERIES) {
          const [address, portStr] = connectionKey.split(':');
          const port = parseInt(portStr, 10) as PortNumber;
          disconnectEngine(repo, address as IPAddress, port, storeHandle, connection.hostname);
      }
  }
};

export const disconnectEngine = (repo: Repo, address: IPAddress, port: PortNumber, storeHandle: DocHandle<Store>, hostname: Hostname): void => {
  const connectionKey = `${address}:${port}`;
  const connection = network.connections[connectionKey];

  if (connection) {
    log(`Disconnecting from engine at ${connectionKey}`);
    try {
      repo.networkSubsystem.removeNetworkAdapter(connection.adapter);
      const engine = findRunningEngineByHostname(storeHandle.doc(), hostname);
      if (engine) {
        storeHandle.change(doc => {
          const eng = doc.engineDB[engine.id];
          if (eng) {
            eng.lastHalted = new Date().getTime() as Timestamp;
          }
        });
      }
    } catch (e: any) {
      if (e.message === 'WebSocket was closed before the connection was established') {
        log(`Ignoring expected error during disconnect: ${e.message}`);
      } else {
        throw e;
      }
    }
    delete network.connections[connectionKey];
  }
};




export const connectEngine = async (repo:Repo, address: IPAddress, hostname: Hostname, engineId: EngineID, storeDocId: DocumentId): Promise<WebSocketClientAdapter | undefined> => {

  const port = settings.port as PortNumber || 1234 as PortNumber

  log(`Connecting to engine at ${address}:${port}`)


  log(`Checking connection with ${address}`)
  if (!network.connections.hasOwnProperty(`${address}:${port}`) && address !== 'localhost' && address !== '127.0.0.1') {
    log(`Creating a new connection to ${address}:${port}`)

    const clientConnection = new WebSocketClientAdapter(`ws://${address}:${port}`)
    repo.networkSubsystem.addNetworkAdapter(clientConnection)
    
    log(`Finding document with ID: ${storeDocId}`);
    const handle = await repo.find(storeDocId) // Trigger the connection by finding the store document
    
    log(`Waiting for handle to be ready. Current state: ${handle.state}`);
    await handle.whenReady(); // Ensure it's loaded before returning
    log(`Handle is ready. State: ${handle.state}`);

    handle.on('change', ({ doc }) => {
      log(`Document changed on connection to ${address}:${port}. Current doc: ${JSON.stringify(doc)}`);
    });

    network.connections[`${address}:${port}`] = { adapter: clientConnection, missedDiscoveryCount: 0, hostname, engineId };
    
    log(`Created an websocket client connection on adddress ws://${address}:${port}`)
    return clientConnection
  } else {
    // Return a resolved promise of ConnectionResult
    log(`Connection to ${address}:${port} already exists or address is localhost or 127.0.0.1`)
    if (network.connections[`${address}:${port}`]) {
        network.connections[`${address}:${port}`].missedDiscoveryCount = 0;
    }
    return undefined
  }
}

export const isEngineConnected = (network: Network, ip: IPAddress):boolean => {
  return network.connections.hasOwnProperty(ip) && network.connections[ip] !== undefined && network.connections[ip].adapter.isReady()
}

// export const getIp = (engine: Engine, ifaceName: InterfaceName):IPAddress | undefined => {
//     return findIp(engine.hostname+'.local', ifaceName)
// }




```

## File: src/data/Store.ts
```typescript
import path from 'path'
import { Engine, localEngineId } from './Engine.js'
import { Disk } from './Disk.js'
import { deepPrint, getKeys, log } from '../utils/utils.js'
import { App } from './App.js'
import { Instance } from './Instance.js'
import { AppID, DeviceName, DiskID, EngineID, Hostname, InstanceID } from './CommonTypes.js'
import { DocHandle, DocumentId, PeerId, Repo } from '@automerge/automerge-repo'
import { chalk, fs } from "zx"
//import { WebSocketClientAdapter } from '@automerge/automerge-repo-network-websocket'
import { BrowserWebSocketClientAdapter, WebSocketClientAdapter } from "@automerge/automerge-repo-network-websocket";

// The single, hard-coded, predictable document ID for the main store.
//const STORE_DOC_ID = "ad40c014-180a-4590-bd11-b25da3ac22d3" as DocumentId;
// const STORE_DOC_ID = "3uVjrsTUqoraSy8UwqRcbYm71z21" as DocumentId;

// **********
// Typedefs
// **********

export interface Store {
    engineDB: { [key: EngineID]: Engine },
    diskDB: { [key: DiskID]: Disk },
    appDB: { [key: AppID]: App },
    instanceDB: { [key: InstanceID]: Instance },
}

// };

/**
 * Creates a document URL for the project
 * Creates the template file containing the binary representation of an empty store.
 * This should be run once, or whenever the template needs to be updated.
 */
export const initialiseServerStore = async (repo: Repo, STORE_TEMPLATE_PATH: string, STORE_URL_PATH: string): Promise<DocHandle<Store>> => {
    log(`Creating empty store document`);
    const handle = await repo.create<Store>({
        engineDB: {},
        diskDB: {},
        appDB: {},
        instanceDB: {},
    });
    log("Empty store document created successfully.")
    // Save the document to a binary file
    const bytes = await repo.export(handle.url);
    if (!bytes) {
        log(`Failed to export a new template store to bytes`);
        throw new Error(`Failed to export the store to bytes`);
    }
    await fs.writeFile(STORE_TEMPLATE_PATH, bytes);
    log("Store template file created successfully.");
    // Now write the URL to the store URL file
    await fs.writeFile(STORE_URL_PATH, handle.url);
    log(`Store URL file created successfully with url: ${handle.url}`);
    return handle;
}

/**
 * Finds or creates the main Store document using a robust, non-blocking method.
 * It manually checks for the document's existence in storage to handle the
 * offline-first initialization case correctly.
 *
 * @param repo The initialized Automerge repo.
 * @param storagePath The path to the repo's storage directory.
 * @returns A DocHandle for the main store document.
 */
export const createServerStore = async (repo: Repo, storeDocId: DocumentId, storagePath: string, templatePath: string): Promise<DocHandle<Store>> => {
    // The storage adapter uses a directory structure based on the document ID to store chunks.
    // We check for the existence of this directory to see if the document exists.
    // The path is constructed from the first two characters of the doc ID and the remainder.
    const docPath = path.join(storagePath, storeDocId.slice(0, 2), storeDocId.slice(2));
    log(`Checking for store document at: ${docPath}`);

    let handle: DocHandle<Store>

    if (fs.existsSync(docPath)) {
        // 1. Document exists in storage. Load it normally.
        log("Store document found in storage. Loading...")
        try {
            handle = await repo.find<Store>(storeDocId)
        } catch (e) {
            log(`Error finding document: ${e}`)
            throw e
        }
        log(`Document loaded successfully with handle state: ${handle.state} and url: ${handle.url}`);
    } else {
        // 2. Document does NOT exist. 
        
        // OBSOLETE - AI APPROACH - The initialisation is repeated on peer nodes
        // log("Store document not found. Initialising a new one...")
        // // Create an empty document in memory.
        // const newDoc = Automerge.change(Automerge.init<Store>(), doc => {
        //     doc.engineDB = {};
        //     doc.diskDB = {};
        //     doc.appDB = {};
        //     doc.instanceDB = {};
        // })

        // // Save it to a binary format.
        // const binary = Automerge.save(newDoc);

        // // Import it into the repo with our specific ID. This creates the file on disk.
        // handle = repo.import(binary, { docId: STORE_DOC_ID });
        // log("Successfully created and imported new store document.");

        // My approach - load the template file and create the document from that
        log("Document not found. Creating from template to ensure consistent history.")
        const templateBytes = await fs.readFile(templatePath);

        // Import the template into the handle. This populates the document with
        // the template's content and history, using the same DocumentId.
        handle = repo.import(templateBytes, { docId: storeDocId });
        log("Successfully imported an initial store document with id " + handle.url);
    }

    // 3. Wait for the document to be fully ready and return.
    await handle.whenReady();
    log("Store document is ready.")
    log(`   Doc in state ${handle.state}`);
    log(`   Doc contains: ${deepPrint(handle.doc(), 2)}`);
    return handle;
}


export const retrieveStore = async (repo: Repo, storeDocId: DocumentId): Promise<DocHandle<Store>> => {
    log(`Binding store to repo with ID: ${storeDocId}`)
    const handle = await repo.find<Store>(storeDocId);
    await handle.whenReady(); // Ensure it's loaded before returning
    log(`Store bound to repo successfully.`);
    return handle
}

// Create a client connection to the store
import { lookup } from 'dns/promises';
import { config } from './Config.js'

// ... (other imports)

export const createClientStore = async (hostnames: string[], clientPeerId: PeerId, storeDocId: DocumentId, timeout?: number): Promise<{handle: DocHandle<Store>, repo: Repo}> => {
    console.log(`Connecting to hosts ${hostnames.join(', ')} with peer ID ${clientPeerId}`);
    
    const connectPromise = (async () => {
        const urls = await Promise.all(hostnames.map(async (hostname) => {
            try {
                console.log(chalk.blue(`Resolving hostname ${hostname}...`));
                const { address } = await lookup(hostname);
                console.log(chalk.green(`  - Resolved to ${address}`));
                const port = config.settings.port || 4321;
                return `ws://${address}:${port}`;
            } catch (e) {
                console.error(chalk.red(`  - Failed to resolve hostname ${hostname}. Using it directly.`));
                // Fallback to using the hostname directly if lookup fails
                const port = config.settings.port || 4321;
                return `ws://${hostname}:${port}`;
            }
        }));

        const retryDelay = 2000;
        const adapters = urls.map(url => new WebSocketClientAdapter(url, retryDelay));
        const repo = new Repo({ 
            network: adapters,
            peerId: clientPeerId,
        });
        const handle = await retrieveStore(repo, storeDocId);
        return { handle, repo };
    })();

    try {
        let result;
        if (timeout) {
            console.log(chalk.blue(`Attempting to connect with a ${timeout} second timeout...`));
            const timeoutPromise = new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error(`Connection timed out after ${timeout} seconds`)), timeout * 1000)
            );
            result = await Promise.race([connectPromise, timeoutPromise]);
        } else {
            console.log(chalk.blue(`Attempting to connect with no timeout...`));
            result = await connectPromise;
        }
        
        console.log(`Connected successfully with peer ID ${clientPeerId}`);
        return result;

    } catch (e) {
        console.error(chalk.red('Failed to connect to engine(s).'));
        // The repo might not be created if the lookup fails early, so check for it.
        // In the future, the repo creation should be inside the promise.
        if (connectPromise) {
            const res = await connectPromise;
            if (res.repo) res.repo.shutdown();
        }
        throw e;
    }
}

export const getLocalEngine = (store: Store): Engine => {
    const localEngine = getEngine(store, localEngineId)
    if (localEngine) {
        return localEngine
    } else {
        throw new Error(`Local engine ${localEngineId} not found in store`)
    }
}

export const getEngine = (store: Store, engineId: EngineID): Engine | undefined => {
    if (store.engineDB.hasOwnProperty(engineId)) {
        return store.engineDB[engineId]
    } else {
        return undefined
    }
}

export const getRunningEngines = (store: Store): Engine[] => {
    const engineIds = Object.keys(store.engineDB) as EngineID[]
    return engineIds.flatMap(engineId => {
        const engine = getEngine(store, engineId)
        if (engine) {
            const isRunning = !engine.lastHalted || (engine.lastBooted > engine.lastHalted)
            if (isRunning) {
                return [engine]
            }
        }
        return []
    })
}

export const getInstancesOfEngine = (store: Store, engine: Engine): Instance[] => {
    return getDisksOfEngine(store, engine).flatMap(disk => {
        return getInstancesOfDisk(store, disk)
    })
}

export const getAppsOfEngine = (store: Store, engine: Engine): App[] => {
    return getDisksOfEngine(store, engine).flatMap(disk => {
        return getAppsOfDisk(store, disk)
    })
}

export const findRunningEngineByHostname = (store: Store, engineName: Hostname): Engine | undefined => {
    return getRunningEngines(store).find(engine => engine.hostname === engineName)
}

export const getApps = (store: Store): App[] => {
    return Object.keys(store.appDB).flatMap(appId => {
        const app = getApp(store, appId as AppID)
        if (app) {
            return [app]
        }
        return []
    })
}

export const getAppsOfDisk = (store: Store, disk: Disk): App[] => {
    const instances = getInstancesOfDisk(store, disk)
    return instances.flatMap(instance => {
        const app = getApp(store, instance.instanceOf)
        if (app) {
            return [app]
        } else {
            return []
        }
    })
}

export const getInstances = (store: Store): Instance[] => {
    return Object.keys(store.instanceDB).flatMap(instanceId => {
        const instance = getInstance(store, instanceId as InstanceID)
        if (instance && instance.status === 'Running') {
            return [instance]
        } else {
            return []
        }
    })
}

export const getEngineOfInstance = (store: Store, instance: Instance): Engine | undefined => {
    if (instance.storedOn) {
        const disk = getDisk(store, instance.storedOn)
        if (disk?.dockedTo) {
            const engine = getEngine(store, disk.dockedTo)
            return engine
        } else {
            console.error(chalk.red(`Disk ${instance.storedOn} is not docked to an engine`))
            return undefined
        }
    } else {
        console.error(chalk.red(`Instance ${instance.id} is not stored on a disk`))
        throw new Error(`Instance ${instance.id} is not stored on a disk`)
    }
}

export const getInstancesOfDisk = (store: Store, disk: Disk): Instance[] => {
    return Object.keys(store.instanceDB).flatMap(instanceId => {
        const instance = getInstance(store, instanceId as InstanceID)
        if (instance && instance.storedOn === disk.id) {
            return [instance]
        } else {
            return []
        }
    })
}

export const findInstanceByName = (store: Store, instanceName: string): Instance | undefined => {
    return getInstances(store).find(instance => instance.name === instanceName)
}

export const getDisks = (store: Store): Disk[] => {
    return Object.keys(store.diskDB).flatMap(diskId => {
        const disk = getDisk(store, diskId as DiskID)
        if (disk && disk.dockedTo) {
            return [disk]
        } else {
            return []
        }
    })
}

export const getDisksOfEngine = (store: Store, engine: Engine): Disk[] => {
    return Object.keys(store.diskDB).flatMap(diskId => {
        const disk = getDisk(store, diskId as DiskID)
        if (disk && disk.dockedTo === engine.id) {
            return [disk]
        } else {
            return []
        }
    })
}

export const findDiskByDevice = (store: Store, deviceName: DeviceName): Disk | undefined => {
    return getDisks(store).find(disk => disk.device === deviceName)
}

export const findDiskByName = (store: Store, diskName: string): Disk | undefined => {
    return getDisks(store).find(disk => disk.name === diskName)
}

export const findDisksByApp = (store: Store, appId: AppID): Disk[] => {
    const instances = Object.keys(store.instanceDB).flatMap(instanceId => {
        const instance = getInstance(store, instanceId as InstanceID)
        if (instance && instance.instanceOf === appId) {
            return [instance]
        } else {
            return []
        }
    })
    const diskIds = Array.from(new Set(instances.map(instance => instance.storedOn))).filter((id): id is DiskID => id !== null)
    return diskIds.flatMap(diskId => {
        const disk = getDisk(store, diskId)
        if (disk) {
            return [disk]
        } else {
            return []
        }
    })
}

export const extractAppName = (appId: AppID): string => {
    return appId.split('-')[0]
}

export const getDisk = (store: Store, diskId: DiskID): Disk | undefined => {
    if (store.diskDB.hasOwnProperty(diskId)) {
        return store.diskDB[diskId]
    } else {
        return undefined
    }
}

export const getApp = (store: Store, appId: AppID): App | undefined => {
    if (store.appDB.hasOwnProperty(appId)) {
        return store.appDB[appId]
    } else {
        return undefined
    }
}

export const getInstance = (store: Store, instanceId: InstanceID): Instance | undefined => {
    if (store.instanceDB.hasOwnProperty(instanceId)) {
        return store.instanceDB[instanceId]
    } else {
        return undefined
    }
}

```

## File: src/monitors/diskMonitor.ts
```typescript
// import { subscribe } from "valtio"
// import { Disk } from "../data/Disk.js"
// import { deepPrint, log } from "../utils/utils.js"

// export const enableDiskMonitor = (disk: Disk):void => {
//     // Monitor our local engine for any changes applied from within the engine
//     subscribe(disk, (value) => {
//         log(`DISK MONITOR: Disk ${disk.id} is modified as follows: ${deepPrint(value)}`)
//         //log(`LOCAL ENGINE ${localEngine.hostName} GLOBAL MONITOR: ${value.length} changes`)
//         // if (value.length > 20) {
//         //     // exit the program
//         //     log(`Too many changes detected, exiting...`)
//         //     process.exit(1)
//         // }
//     })
//     log(`Added a monitor for disk ${disk.id}`)
// }
```

## File: src/monitors/enginesMonitor.ts
```typescript
// import { log, deepPrint, getKeys } from '../utils/utils.js'
// import { Store } from '../data/Store.js'

// import { EngineID } from '../data/CommonTypes.js'
// import { handleCommand } from '../utils/commandHandler.js'
// import { engineCommands } from '../utils/engineCommands.js'
// import { DocHandle } from '@automerge/automerge-repo'




// /**
//  * Enables a monitor for the set of all engines in the store.
//  * This monitor will log the additional or removal of engines in the store.
//  * 
//  * @param storeHandle The DocHandle for the store document.
//  */
// export const enableEngineSetMonitor = (storeHandle: DocHandle<Store>): void => {
//     // Monitor for the addition or removal of engines in the store
//     const store = storeHandle.doc()
//     storeHandle.on('change', ({ doc, patches }) => {
//         log(`enableEngineSetMonitor handles ${deepPrint(patches)}`)
//         for (const patch of patches) {
//             // The path for an additional Engine in the engineDB set is expected to be in the form:
//             // ['engineDB', <index>]
//             if (patch.action === 'put' &&  // Since we never change the object value, we know that 'put' means an addition 
//                 patch.path.length === 2 &&
//                 patch.path[0] === 'engineDB' &&
//                 typeof patch.path[1] === 'number') {
//                 const engineId = patch.path[1].toString() as EngineID
//                 log(`New engine added with ID: ${engineId}`)
//             }
//             // The path for a removed Engine in the engineDB set is expected to be in the form:
//             // ['engineDB', <index>]
//             else if (patch.action === 'del' &&
//                 patch.path.length === 2 &&
//                 patch.path[0] === 'engineDB' &&
//                 typeof patch.path[1] === 'number') {
//                 const engineId = patch.path[1].toString() as EngineID
//                 log(`Engine removed with ID: ${engineId}`)
//             }
//         }
//     })
// }

// export const enableEngineCommandsMonitor = (storeHandle: DocHandle<Store>): void => {
//     const store = storeHandle.doc()
//     for (const engineId of getKeys(store.engineDB) as EngineID[]) {
//         storeHandle.on('change', ({ doc, patches }) => {
//             log(`enableEngineCommandsMonitor handles ${deepPrint(patches)}`)
//             for (const patch of patches) {
//                 // The path for an additional command in the commands array is expected to be in the form:
//                 // ['engineDB', <engineId>, 'commands', <index>]
//                 if (patch.action === 'put' &&
//                     patch.path.length === 4 &&
//                     patch.path[0] === 'engineDB' &&
//                     patch.path[1] === engineId &&
//                     patch.path[2] === 'commands' &&
//                     typeof patch.path[3] === 'number') {
//                     const command = patch.value as string
//                     log(`New command added for engine ${engineId}: ${command}`)
//                     handleCommand(engineCommands, command)
//                 }
//             }
//         })
//     }
// }


// export const enableEngineLastRunMonitor = (storeHandle: DocHandle<Store>): void => {
//     const store = storeHandle.doc()
//     for (const engineId of getKeys(store.engineDB) as EngineID[]) {
//         storeHandle.on('change', ({ doc, patches }) => {
//             log(`enableEngineLastRunMonitor handles ${deepPrint(patches)}`)
//             for (const patch of patches) {
//                 // The path for the lastRun property of an engine is expected to be in the form:
//                 // ['engineDB', <engineId>, 'lastRun']
//                 if (patch.action === 'put' &&
//                     patch.path.length === 3 &&
//                     patch.path[0] === 'engineDB' &&
//                     patch.path[1] === engineId &&
//                     patch.path[2] === 'lastRun') {
//                     const lastRun = patch.value as number
//                     log(`Engine ${engineId} last run updated to: ${lastRun}`)
//                 }
//             }
//         })
//     }
// }


// // export const enableEngineMonitor = (engine: Engine):void => {
// //     // Monitor our local engine for any changes applied from within the engine
// //     subscribe(engine, (value) => {
// //         log(`ENGINE ${engine.hostname} MONITOR: Engine ${engine.hostname} is modified as follows: ${deepPrint(value)}`)
// //         //log(`LOCAL ENGINE ${localEngine.hostName} GLOBAL MONITOR: ${value.length} changes`)
// //         // if (value.length > 20) {
// //         //     // exit the program
// //         //     log(`Too many changes detected, exiting...`)
// //         //     process.exit(1)
// //         // }
// //     })
// //     log(`Added a monitor for engine ${engine.hostname} (${engine.id})`)
// // }

// //   export const enableEngineCommandsMonitor = (engine: Engine):void => {
// //     // Monitor our local engine for commands to be executed
// //     log(`Adding a commands monitor for engine ${engine.hostname} (${engine.id})`)
// //     if (engine.commands) {
// //         subscribe(engine.commands, async (value) => {
// //             log(`ENGINE ${engine.hostname} COMMANDS MONITOR: Engine ${engine.hostname} commands is modified as follows: ${deepPrint(value)}`)
// //             // Extract the command from the value and execute it
// //             const command = value[0][2] as string
// //             log(`Executing command: ${command}`)
// //             await handleCommand(engineCommands, command)
// //         })
// //     } else {
// //         log(`No commands monitor installed because engine ${engine.hostname} does not have a commands array`)
// //     }
// // }

```

## File: src/monitors/instancesMonitor.ts
```typescript
import { fs } from 'zx'
import http from 'http'

import { log, deepPrint, getKeys, findIp, error } from '../utils/utils.js'
import { Store, getInstance } from '../data/Store.js'
import { InstanceID, InterfaceName, IPAddress, PortNumber } from '../data/CommonTypes.js'
import { getEngineOfInstance } from '../data/Store.js'
import { DocHandle } from '@automerge/automerge-repo'

// export const enableInstanceSetMonitor = async (storeHandle:DocHandle<Store>):Promise<void> => {
//     const store = storeHandle.doc()
//     // Generate HTML for the current instances
//     const instanceIds = getKeys(store.instanceDB) as InstanceID[]
//     await generateHTML(store, instanceIds)

//     storeHandle.on('change', ({ doc, patches }) => {
//         log(`enableInstanceSetMonitor handles ${deepPrint(patches)}`)
//         for (const patch of patches) {
//             // The path for an additional Engine in the engineDB set is expected to be in the form:
//             // ['engineDB', <index>]
//             if (patch.action === 'put' &&  // Since we never change the object value, we know that 'put' means an addition 
//                 patch.path.length === 2 &&
//                 patch.path[0] === 'instanceDB' &&
//                 typeof patch.path[1] === 'number') {
//                 const instanceId = patch.path[1].toString() as InstanceID
//                 log(`New instance added with ID: ${instanceId}`)
//                 // Update the HTML
//                 generateHTML(store, getKeys(store.instanceDB) as InstanceID[])
//             }
//             // The path for a removed Engine in the engineDB set is expected to be in the form:
//             // ['engineDB', <index>]
//             else if (patch.action === 'del' &&
//                 patch.path.length === 2 &&
//                 patch.path[0] === 'instanceDB' &&
//                 typeof patch.path[1] === 'number') {
//                 const instanceId = patch.path[1].toString() as InstanceID
//                 log(`Instance removed with ID: ${instanceId}`)
//                 // Update the HTML
//                 generateHTML(store, getKeys(store.instanceDB) as InstanceID[])
//             }
//         }   
//     })
//     log(`Added INSTANCESET MONITOR`)
// }

// export const enableInstanceStatusMonitor = async (storeHandle:DocHandle<Store>):Promise<void> => {
//     // Generate HTML for the current instances
//     await generateHTML(storeHandle)

//     // Monitor for changes in the status of instances
//     storeHandle.on('change', ({ doc, patches }) => {
//         log(`Instance Status Monitor handles ${deepPrint(patches)}`)
//         for (const patch of patches) {
//             // Monitor the status property of any instance in the instanceDB set
//             // The path for a change in the status property of an instance is expected to be in the form:
//             // ['instanceDB', <instanceId>, 'status']
//             if (patch.action === 'put' &&
//                 patch.path.length === 3 &&
//                 patch.path[0] === 'instanceDB' &&
//                 typeof patch.path[1] === 'string' && // instanceId
//                 patch.path[2] === 'status') {
//                 const instanceId = patch.path[1] as InstanceID
//                 const status = patch.value as string
//                 log(`Instance ${instanceId} status changed to: ${status}`)
//                 // Update the HTML
//                 generateHTML(storeHandle)
//             }
//         }   
//     })
//     log(`Added INSTANCESET MONITOR`)
// }

export const generateHTML = async (storeHandle:DocHandle<Store>):Promise<void> => {
    const store = storeHandle.doc()
    const instanceIds = getKeys(store.instanceDB) as InstanceID[]
    // Generate the HTML for the instances
    const html = `<!DOCTYPE html>
    <html>
        <head>
            <title>Instances</title>
            <meta http-equiv="refresh" content="5"> 
        </head>
        <body>
            <h1>Apps</h1>
            <ul>
                ${(await Promise.all(instanceIds.map(async (instanceId) =>  {
                    // Find the engine hostname for the instance and generate a url using the hostname and the port number of the instance
                    const instance = getInstance(store, instanceId) ?? undefined
                    if (!instance) {
                        return `<li>Instance ${instanceId} not found</li>`
                    }
                    const diskId = instance.storedOn
                    const engine = getEngineOfInstance(store, instance) ?? undefined
                    if (!engine) {
                        return `<li>Instance ${instanceId} not docked</li>`
                    }
                    const hostname = engine.hostname
                    const port = instance.port
                    // const ip = await findIp(`${hostname}.local` as IPAddress)
                    // HACK - Assuming engines are only used over eth0 - We should restrict the interaces and then enumerate the addresses on all restricted interfaces
                    const ip = await findIp(hostname+'.local' as IPAddress)
                    if (ip && (instance.status === 'Running') && port && port > 0) {
                        return `<li><a href="http://${hostname}.local:${port}">${instance.name} on disk ${diskId} (${instance.status})</a> or use <a href="http://${ip}:${port}">this</a></li>`
                    } else if ((instance.status === 'Running') && port && port > 0) {
                        return `<li><a href="http://${hostname}.local:${port}">${instance.name} on disk ${diskId} (${instance.status})</a></li>`
                    } else {
                        return `<li>${instance.name} on disk ${diskId} has status (${instance.status})</li>`
                    }
                }))).join('\n')}
            </ul>
        </body>
    </html>`
    log(`Generated HTML: ${html}`)
    // Write the HTML to a file called <appnetName>.html
    try {
        fs.writeFileSync(`appnet.html`, html)
    } catch (e) {
        error(`Error writing appnet.html: ${e}`)
    }
}   

export const enableIndexServer = async (storeHandle:DocHandle<Store>):Promise<void> => {
    // Start an HTTP server that serves the index.html file of the specified appnet
    const portNumber = 80

    // If the file `${appnetName}.html` does not exist, generate it
    if (!fs.existsSync(`appnet.html`)) {
        await generateHTML(storeHandle)
    }
    const server = http.createServer((req, res) => {
        res.writeHead(200, {'Content-Type': 'text/html'})
        fs.readFile(`appnet.html`, (err, data) => {
            if (err) {
                res.writeHead(404)
                res.write('File not found')
            } else {
                res.write(data)
            }
            res.end()
        })
    })
    server.on('error', (err) => {
        error(`Index server error on port ${portNumber}: ${err}`)
    })
    server.listen(portNumber)
    log(`Started HTTP server on port ${portNumber}`)
}

```

## File: src/monitors/interfaceMonitor.ts
```typescript
// import net_listner from 'network-interfaces-listener'
// import os from 'os'
// import { addNetwork, closeRunningServer, createRunningServer, findNetworkByName, getLocalEngine, getListenerByIface, addListener, getListeners, Store } from '../data/Store.js'
// import { createNetwork, connectEngine } from '../data/Network.js'
// import { deepPrint, log } from '../utils/utils.js'
// import { existsSync, write } from 'fs'
// import { $, chalk } from 'zx'
// import { exit } from 'process'
// import { InterfaceName } from '../data/CommonTypes.js'
// //import { LIBUSB_CAP_HAS_HID_ACCESS } from 'usb/dist/usb/bindings.js'
// import { enableWebSocketMonitor } from './webSocketMonitor.js'
// import { addConnectedInterface, isConnected, removeConnectedInterfaceByName } from '../data/Engine.js'


// export const enableInterfaceMonitor = async (store:Store, ifaceNames:InterfaceName[]):Promise<void> => {
//     log(`Enabling the interface monitor for interfaces ${ifaceNames} using store: ${deepPrint(store, 1)}`)
//     const monitorAll = ifaceNames.length === 0
  
//     if (monitorAll) {
//         log(`Monitoring the connection status of all interfaces`)
//     } else {
//         log(`Monitoring the connection status of interfaces ${ifaceNames}`)
//     }

//     // Monitor the interface for changes
//     const onNetworkChange = (data) => {

//         // TODO - We should filter out the interfaces that are not in the list of monitored interfaces
//         // const changedInterfaces = Object.keys(data).filter((ifaceName) => {
//         //     return monitorAll || ifaceNames.includes(ifaceName as InterfaceName)
//         // })
//         const changedInterfaces = Object.keys(data)
//         log(`New data for interfaces ${changedInterfaces}: ${JSON.stringify(data)}`)

//         // TODO - We should tolerate data with more than one key
//         // Replace Object.keys(data)[0] == 'xxx' with data[xxx]
//         // if (data.message && data.message === 'Network interface is not active') {
//         //     // disconnectNetwork(network, ifaceName)
//         //     removeInterfaceByName(getLocalEngine(), ifaceName)
//         //     return
//         // }

//         for (const ifaceName of changedInterfaces) {

//             processInterface(store, data, ifaceName as InterfaceName)
//         }

//         if (data.message) {
            
//             // This is an unknown message - do nothing
//             console.error(`Unknown message: ${data.message}`)
//             return

//         } 
//     }   

//     // Call the listener once with the current state of the interface
//     // Read the curent state of the interface from a call to os.networkInterfaces()
//     onNetworkChange(os.networkInterfaces())

//     // Register the listener for each interface
//     // Store the listener so that we can remove it later
//     // We need to remove the listener when we unmonitor the network
//     if (monitorAll) {
//         net_listner.addNetInterfaceListener("ALL", onNetworkChange)
//         addListener(store, "ALL" as InterfaceName, onNetworkChange)
//     } else {
//         for (const ifaceName of ifaceNames) {
//             net_listner.addNetInterfaceListener(ifaceName, onNetworkChange)
//             addListener(store, ifaceName, onNetworkChange)
//         }
//     }
// }

// const processInterface = (store:Store, data:any, ifaceName:InterfaceName):void => {
//     log (`Processing interface ${ifaceName}`)
//     log(`Using store ${deepPrint(store, 1)}`)
//     const localEngine = getLocalEngine(store)
//     // Check if data[ifaceName] is an array
//     if (!Array.isArray(data[ifaceName])) {
//         log(`Data for interface ${ifaceName} is not an array`)
//         return
//     }
//     const ip4Set = data[ifaceName].find((netObject) => {
//         // Check if netObject is an object with property family that is 'IPv4'
//         return netObject.family && netObject.family === 'IPv4'
//     })

//     //if (localEngine.connectedInterfaces && ip4Set) {
//     if ((localEngine.connectedInterfaces !== undefined) && ip4Set) {
//         const ip4 = ip4Set.address
//         const netmask = ip4Set.netmask
//         const cidr = ip4Set.cidr
//         const nowConnected:Boolean = ip4 ? true : false
//         const wasConnected:Boolean = isConnected(localEngine, ifaceName)

//         if (wasConnected && nowConnected) {

//                 const iface = localEngine.connectedInterfaces[ifaceName]
//                 const oldIp4 = iface.ip4
//                 const oldnetmask = iface.netmask
//                 const oldcidr = iface.cidr
//                 if (oldIp4 !== ip4) {
//                     log(`Changing the IP address on interface ${ifaceName} from ${oldIp4} to ${ip4}`)
//                     // OLD - Do this when we want to create websocket servers for each restricted interface
//                     // Close the existing server
//                     // closeRunningServer(store, oldIp4)
//                     // createRunningServer(store, ip4)
//                     // Update the network interface with the new data
//                     iface.ip4 = ip4
//                 }

//                 if (oldnetmask !== netmask) {
//                     log(`Changing the netmask on interface ${ifaceName} from ${oldnetmask} to ${netmask}`)
//                     iface.netmask = netmask
//                 }

//                 if (oldcidr !== cidr) {
//                     log(`Changing the cidr on interface ${ifaceName} from ${oldcidr} to ${cidr}`)
//                     iface.cidr = cidr
//                 }

//                 return 
//             }

//             if (wasConnected && !nowConnected) {
                
//                 //disconnectNetwork(network, ifaceName)
//                 removeConnectedInterfaceByName(getLocalEngine(store), ifaceName)
//                 return
//             }

//             if (!wasConnected && nowConnected) {

//                 addConnectedInterface(localEngine, ifaceName, ip4, netmask, cidr)
//                 log(`Interface ${ifaceName} on local engine has received an IP4 address ${ip4}`)
//                 // Start the websocket server on this interface
//                 // Do not enable the websocket monitor on the localhost as it is already enabled
//                 if (ip4 !== '127.0.0.1') {
//                     // enableWebSocketMonitor(ip4, '1234') 
//                     return
//                 }
//             }

//             if (!wasConnected && !nowConnected) {
//                 console.error(`Received new data for an unconnected ${ifaceName} without an IP4 address`)
//                 return

//             }
//         } else {
//             log(`Interface ${ifaceName} on local engine has no connected interfaces or no IP4 address`)
//         }
// }


```

## File: src/monitors/mdnsMonitor.ts
```typescript
import mDnsSd from 'node-dns-sd'
import { deepPrint, log, error } from '../utils/utils.js';
import { chalk } from 'zx';
import { Store, getLocalEngine } from '../data/Store.js';
import { manageDiscoveredPeers } from '../data/Network.js'
import ciao from '@homebridge/ciao'
import { DocHandle, DocumentId, Repo } from '@automerge/automerge-repo';
import { EngineID, Hostname, IPAddress } from '../data/CommonTypes.js';
import { config } from '../data/Config.js';

export const startAdvertising = (store: Store): void => {
    const engine = getLocalEngine(store)
    if (!engine) {
        log(`No local engine found in the store`)
        throw new Error(`No local engine found in the store`)
    }
    const engineName = engine.hostname
    const engineVersion = engine.version
    const responder = ciao.getResponder()
    let service

    if (engineName) {
        log(`Advertising on all interfaces  `)
        service = responder.createService({
            name: engineName.toString(),
            type: 'engine',
            port: config.settings.port,
            txt: {
                name: engineName,
                id: engine.id,
                version: engineVersion
            }
        })
    } 

    service.advertise().then(() => {
        log(`The following service is published on all interfaces: ${service.name}._engine._tcp.local`);
    }).catch((err) => {
        error(`Error advertising mDNS service: ${err}`)
    })
}

const discoverEngines = async (storeHandle: DocHandle<Store>, repo:Repo): Promise<void> => {
    const localEngine = getLocalEngine(storeHandle.doc());
    try {
        const deviceList = await mDnsSd.discover({ name: '_engine._tcp.local' });
        const discoveredPeers = new Map<IPAddress, {hostname: Hostname, engineId: EngineID}>();

        if (deviceList.length > 0) {
            log(chalk.bgBlackBright(`Discovered engines:`));
        }

        deviceList.forEach(device => {
            const txt = device.packet.additionals.find((add: any) => ((typeof add == 'object') && add.hasOwnProperty('type') && add.type === 'TXT'));

            if (!txt || !txt.rdata) {
                log(chalk.redBright(`  - No TXT record for ${device.modelName || device.address}. Skipping.`));
                return;
            }

            const txtRecord = txt.rdata;
            const engineId = txtRecord.id as EngineID;
            const hostname = txtRecord.name as Hostname;
            const address = device.address as IPAddress;
            const port = device.service?.port;

            log(`  - Name: ${hostname || 'N/A'}, ID: ${engineId || 'N/A'}, Address: ${address || 'N/A'}:${port || 'N/A'}`);

            if (engineId && engineId === localEngine.id) {
                return; // Skip local engine
            }

            if (address && hostname && engineId) {
                discoveredPeers.set(address, { hostname, engineId });
            }
        });

        await manageDiscoveredPeers(repo, discoveredPeers, storeHandle);

        if (deviceList.length === 0) {
            log(chalk.bgBlackBright(`No remote engines found`))
        }
    } catch (error) {
        log(`***node-dns-sd*** Error discovering engines`)
        console.error(error);
    }
}

export const enableMulticastDNSEngineMonitor = (storeHandle: DocHandle<Store>, repo:Repo): void => {
    startAdvertising(storeHandle.doc())
    
    const runDiscovery = async () => {
        await discoverEngines(storeHandle, repo);
        setTimeout(runDiscovery, 10000);
    };

    runDiscovery();
}

```

## File: src/monitors/storeMonitor.ts
```typescript
import { DocHandle } from '@automerge/automerge-repo'
import { Store } from '../data/Store.js'
import { log, deepPrint } from '../utils/utils.js'
import { EngineID, InstanceID } from '../data/CommonTypes.js'
import { handleCommand } from '../utils/commandUtils.js'
import { generateHTML } from './instancesMonitor.js'
import { commands } from '../data/Commands.js';



const engineSetMonitor = (patch, storeHandle): boolean => {
    if (patch.action === 'put' &&  // Since we never change the object value, we know that 'put' means an addition 
        patch.path.length === 2 &&
        patch.path[0] === 'engineDB' &&
        typeof patch.path[1] === 'string' // engineId
    ) {
        const engineId = patch.path[1].toString() as EngineID
        log(`New engine added with ID: ${engineId}`)
        log(`Doc now contains: ${deepPrint(storeHandle.doc(), 2)}`)
        return true
    } else {
        return false
    }
}

const engineCommandsMonitor = (patch, storeHandle): boolean => {
    if (patch.action === 'put' &&
        patch.path.length === 4 &&
        patch.path[0] === 'engineDB' &&
        typeof patch.path[1] === 'string' && // engineId
        patch.path[2] === 'commands' &&
        typeof patch.path[3] === 'number') {
        const command = patch.value as string
        const engineId = patch.path[1] as EngineID
        log(`New command added for engine ${engineId}: ${command}`)
        handleCommand(commands, storeHandle, 'engine', command)
        return true
    } else {
        return false
    }
}

const engineLastRunMonitor = (patch, storeHandle): boolean => {
    if (patch.action === 'put' &&
        patch.path.length === 3 &&
        patch.path[0] === 'engineDB' &&
        typeof patch.path[1] === 'string' && // engineId
        patch.path[2] === 'lastRun') {
        const lastRun = patch.value as number
        const engineId = patch.path[1] as EngineID
        log(`Engine ${engineId} last run updated to: ${lastRun}`)
        log(`Doc now contains: ${deepPrint(storeHandle.doc(), 2)}`)
        return true
    } else {
        return false
    }
}

const instancesMonitor = (patch, storeHandle): boolean => {
    if (patch.action === 'put' &&
        patch.path.length === 3 &&
        patch.path[0] === 'instanceDB' &&
        typeof patch.path[1] === 'string' && // instanceId
        patch.path[2] === 'status') {
        const instanceId = patch.path[1] as InstanceID
        const status = patch.value as string
        log(`Instance ${instanceId} status changed to: ${status}`)
        // Update the HTML
        generateHTML(storeHandle)
        return true
    } else {
        return false
    }
}

const applyUntilTrue = (functions: ((patch, storeHandle) => boolean)[], patch, storeHandle): boolean => {
    for (const func of functions) {
        if (func(patch, storeHandle)) {
            return true
        }
    }
    return false
}

export const enableStoreMonitor = (storeHandle: DocHandle<Store>): void => {
    // Monitor for the addition or removal of engines in the store
    storeHandle.on('change', ({ doc, patches }) => {
        for (const patch of patches) {
            log(`StoreMonitor handles the following change: ${deepPrint(patch)}`)
            applyUntilTrue([engineSetMonitor, engineCommandsMonitor, engineLastRunMonitor, instancesMonitor], patch, storeHandle)
        }
    })
}
```

## File: src/monitors/timeMonitor.ts
```typescript

import { doc } from 'lib0/dom.js'
import { Timestamp } from '../data/CommonTypes.js'
import { inspectEngine } from '../data/Engine.js'
import { Store, getLocalEngine } from '../data/Store.js'
import { log, contains, deepPrint } from '../utils/utils.js'

export const enableTimeMonitor = (interval, callback) => {
    setInterval(callback, interval)
}

export const logTimeCallback = () => {
    log(`Time callback at ${new Date()}`)
}

// export const generateRandomArrayPopulationCallback = (apps: Array<string>) => {
//     // Randomly populate and depopulate the apps array with app names every 5 seconds. 
//     // Choose from a list of app names such as "app1", "app2", "app3", "app4", "app5" etc.
//     // The array should contain between 0 and 5 app names at any given time.
//     // Make sure that any app name only appears once in the array.
//     // Do it
//     const appNames = ['app1', 'app2', 'app3', 'app4', 'app5']
//     // If the array is empty, add a random app name
//     // If the array is full, remove a random app name
//     // If the array is not empty and not full, randomly decide whether to add or remove an app name and only select an app name that is not already in the array
//     return () => {
//         if (apps.length === 0) {
//             apps.insert(0, [appNames[Math.floor(Math.random() * appNames.length)]])
//         } else if (apps.length === 5) {
//             apps.delete(Math.floor(Math.random() * 5))
//         } else {
//             if (Math.random() < 0.5) {
//                 const randomAppName = appNames[Math.floor(Math.random() * appNames.length)]
//                 if (!contains(apps, randomAppName)) {
//                     apps.insert(0, [randomAppName])
//                 }
//             } else {
//                 apps.delete(Math.floor(Math.random() * apps.length))
//             }
//         }
//     }
// }


// const generateRandomArrayModification = (apps: Array<object>) => {
//     apps.insert(0, [{ name: 'app1' }, { name: 'app2' }, { name: 'app3' }, { name: 'app4' }, { name: 'app5' }])
//     log(`Initialising apps array with app names`)
//     // Create a function that first removes any x letters from all app names and then 
//     // randomly puts a capital x behind the name of an app in the apps array 
//     // Do it
//     return () => {
//         apps.forEach((app: { name: string }, index: number) => {
//             app.name = app.name.replace('X', '')
//             if (Math.random() < 0.5) {
//                 app.name = app.name + 'X'
//             }
//         })
//         console.log(`Deep change to apps: ${JSON.stringify(apps.toArray())}`)
//     }
// }

// export const changeTest = (store:Store) => {
//     const localEngine = getLocalEngine(store)
//     if (localEngine && localEngine.lastBooted) {
//         localEngine.lastBooted = localEngine.lastBooted + 1 as Timestamp
//         log(`CHANGING ENGINE LASTBOOTED TO ${localEngine.lastBooted}`)
//         log(deepPrint(localEngine))
//     } else {
//         log(`CHANGETEST: Engine not yet available ********`)
//     }
// }

let runs = 0

export const generateHeartBeat = (storeHandle) => {
    runs++
    storeHandle.change(doc => {
        const lastRun = (new Date()).getTime() as Timestamp
        log(`UPDATING ENGINE LASTRUN TO ${lastRun}`)
        //log(`This is the doc to change: ${deepPrint(doc, 2)}`)
        const localEngine = getLocalEngine(doc)
        localEngine.lastRun = lastRun
        //inspectEngine(store, localEngine)
    })
} 
```

## File: src/monitors/usbDeviceMonitor.ts
```typescript
import chokidar from 'chokidar'
import { getKeys, log, uuid } from '../utils/utils.js'
import { DiskMeta, readHardwareId, readMetaUpdateId } from '../data/Meta.js';
import { $, fs, YAML, chalk } from 'zx'

$.verbose = false;
import { Disk, createOrUpdateDisk, processDisk } from '../data/Disk.js'
import { findDiskByDevice, Store, getDisksOfEngine, getLocalEngine } from '../data/Store.js'
import { DeviceName, DiskID, DiskName, InstanceID, Timestamp } from '../data/CommonTypes.js'
import { Instance, Status, stopInstance } from '../data/Instance.js';
import { config } from '../data/Config.js'
import { DocHandle } from '@automerge/automerge-repo';

export const enableUsbDeviceMonitor = async (storeHandle: DocHandle<Store>) => {

    // TODO: Alternative implementations for usb device detection:
    // 1. Monitor /dev iso /dev/engine
    // 2. Monitor /dev/disk/by-label
    // 3. Monitor dmesg output

    const store: Store = storeHandle.doc()
    const localEngine = getLocalEngine(store)

    if (!localEngine) {
        log(`No local engine found in the store`)
        throw new Error(`No local engine found in the store`)
    }

    const validDevice = function (device: string): boolean {
        // Check if the device begins with "sd", is then followed by a letter and ends with the number 2
        // We need the m flag - see https://regexr.com/7rvpq 
        return device && (device.match(/^sd[a-z][1-2]$/m) || device.match(/^sd[a-z]$/m)) ? true : false
    }

    const addDevice = async function (path: string) {
        log(`A disk on device ${path} has been added`)
        const device = path.split('/').pop() as DeviceName

        if (validDevice(device)) {
            log(`The disk on device ${device} has a valid device name`)
            log(`Processing the disk on device ${device}`)
            try {
                const mountOutput = await $`mount -t ext4`
                if (mountOutput.stdout.includes(`/dev/${device} on /disks/${device} type ext4`)) {
                    log(`Device ${device} already mounted`)
                } else {
                    log(`Mounting device ${device}`)
                    await $`sudo mkdir -p /disks/${device}`
                    await $`sudo mount /dev/${device} /disks/${device}`
                    log(`Device ${device} has been successfully mounted`)
                }

                let meta: DiskMeta
                if (fs.existsSync(`/disks/${device}/META.yaml`)) {
                    log(`Found a META file on device ${device}. This disk has been processed by the system before.`)
                    try {
                        meta = await readMetaUpdateId(device)
                        const disk: Disk = createOrUpdateDisk(storeHandle, localEngine.id, device, meta.diskId, meta.diskName, meta.created)
                        await processDisk(storeHandle, disk)
                    } catch (error) {
                        log('Error processing the META file on the disk: ' + error)
                    }
                } else {
                    log('Could not find a META file. Creating one now.')
                    const diskId = await readHardwareId(device) as DiskID
                    // The disk name should be the name of the volume if available, otherwise 'Unnamed Disk'
                    let diskName: DiskName = 'Unnamed Disk' as DiskName
                    try {
                        const volumeNameOutput = await $`lsblk -no LABEL /dev/${device}`
                        const volumeName = volumeNameOutput.stdout.trim()
                        // Check if it is a valid volume name (not empty) - it should also not have any newlines
                        if (volumeName && volumeName.length > 0 && !volumeName.includes('\n')) {
                            diskName = volumeName as DiskName
                        }
                    } catch (e) {
                        log(`Error reading volume name for device ${device}: ${e}`)
                    }
                    meta = {
                        diskId: diskId ? diskId : uuid() as DiskID,
                        isHardwareId: !!diskId,
                        diskName: diskName,
                        created: Date.now() as Timestamp,
                        lastDocked: Date.now() as Timestamp
                    }
                    const disk: Disk = createOrUpdateDisk(storeHandle, localEngine.id, device, meta.diskId, meta.diskName, meta.created)
                    await processDisk(storeHandle, disk)
                }
            } catch (e) {
                log(`Error processing device ${device}`)
                log(e)
            }
        } else {
            log(`The disk on device ${device} is not on a supported device name`)
        }
    }

    const removeDevice = async (path: string) => {
        const device = path.split('/').pop()
        if (validDevice(device!)) {
            log(`Processing the removal of USB device ${device}`)
            const disk = findDiskByDevice(storeHandle.doc(), device as DeviceName)
            if (!disk) {
                log(`No disk found on ${device}`)
                return
            }
            await undockDisk(storeHandle, disk)
        } else {
            log(`Non-USB device ${device} has been removed`)
        }
    }

    if (!config.settings.isDev) {
        try {
            log(`Cleaning up the /disks/old folder`)
            await $`sudo rm -fr /disks/old/*`
        } catch (e) {
            log(`Error cleaning up the /disks/old folder`)
            log(e)
        }
    }

    const actualDevices = config.settings.isDev ? [] : (await $`ls /dev/engine`).toString().split('\n').filter(device => validDevice(device))
    log(`Actual devices: ${actualDevices}`)

    log(`Removing from the network database disks that were attached before the current boot but are no longer attached now...`)

    const storedDisks = getDisksOfEngine(store, localEngine)
    if (storedDisks.length !== 0) {
        log(`The engine object shows previously mounted disks: ${storedDisks.map(d => d.id)}`)
        const storedDevices = storedDisks.map(disk => disk.device).filter((device): device is DeviceName => device !== undefined && device !== null)
        log(`Which were on devices: ${storedDevices}`)

        for (let device of storedDevices) {
            if (!actualDevices.includes(device)) {
                log(`Removing disk from previously mounted device ${device}`)
                const disk = findDiskByDevice(store, device as DeviceName)
                if (disk) {
                    await undockDisk(storeHandle, disk)
                    log(`Disk ${disk.id} removed from local engine`)
                }
            }
        }
    } else {
        log(`No previous disks found in the network database`)
    }

    log(`Cleaning the mount points...`)
    const previousMounts = config.settings.isDev ? [] : (await $`ls /disks`).toString().split('\n').filter(device => validDevice(device))
    log(`Previously mounted devices: ${previousMounts}`)
    const mountOutput = await $`mount -t ext4`
    for (let device of previousMounts) {
        log(`Checking if device ${device} is still actual or mounted`)
        if (!actualDevices.includes(device) && !mountOutput.stdout.includes(`/dev/${device} on /disks/${device} type ext4`)) {
            log(`Cleaning up stale mount point for ${device}`)
            try {
                await $`sudo umount /disks/${device}`
            } catch (e: any) {
                if (e.stderr.includes('not mounted')) {
                    await $`sudo mkdir -p /disks/old`
                    await $`sudo mv /disks/${device} /disks/old/${device}`
                    log(`Device ${device} has been moved to /disks/old`)
                } else {
                    log(`Error unmounting device during cleaning ${device}`)
                    log(e)
                }
            }
            log(`Device ${device} has been successfully cleaned up`)
        }
    }

    const watchDir = '/dev/engine'
    const watcher = chokidar.watch(watchDir, { persistent: true })

    watcher
        .on('add', addDevice)
        .on('unlink', removeDevice)
        .on('error', error => log(`Watcher error: ${error}`))

    log(`Watching ${watchDir} for USB devices`)
}

const undockDisk = async (storeHandle: DocHandle<Store>, disk: Disk) => {
    const store: Store = storeHandle.doc()
    const device = disk.device
    if (!device) {
        log(`Disk ${disk.id} is not mounted on any device. Nothing to undock.`)
        return
    }
    try {
        log(`Attempting to unmount device ${device}`)
        try {
            await $`sudo umount /disks/${device}`
            log(`Device ${device} has been successfully unmounted`)
        } catch (e: any) {
            // If the error indicates it wasn't mounted, we can proceed. 
            // Otherwise, we must abort to avoid deleting data on a mounted disk.
            if (!e.stderr.includes('not mounted')) {
                throw new Error(`Failed to unmount ${device}: ${e.message}`)
            }
            log(`Device ${device} was not mounted`)
        }
        await $`sudo rm -fr /disks/${device}`
        log(`Mount point /disks/${device} has been removed`)
        storeHandle.change(doc => {
            const dsk = doc.diskDB[disk.id]
            if (dsk) {
                // Move the disk to the 'Undocked' state
                dsk.dockedTo = null
                // Set the disk's device to null    
                dsk.device = null
            }
        })
        // Stop all instances of the disk and move them to the 'Undocked' state
        const instancesOnDisk = Object.values(store.instanceDB).filter(instance => instance.storedOn === disk.id);
        for (const instance of instancesOnDisk) {
            await stopInstance(storeHandle, instance, disk)
            log(`Instance ${instance.id} stopped`)
            storeHandle.change(doc => {
                const inst = doc.instanceDB[instance.id]
                // Move the instance to the 'Undocked' state
                if (inst) inst.status = 'Undocked' as Status
            })
            log(`Instance ${instance.id} has been moved to the 'Undocked' state`)
        }
    } catch (e) {
        log(`Error unmounting device ${device}`)
        log(e)
    }
}

```

## File: src/monitors/webSocketMonitor.ts
```typescript
// import { yjsWebsocketServer } from '../y-websocket/yjsWebSocketServer.js'
// import { log } from '../utils/utils.js'
// import { IPAddress, PortNumber } from '../data/CommonTypes.js'
// import { Server } from 'http'


// export const enableWebSocketMonitor = (host:IPAddress, port:PortNumber):Server => {
//     // Monitor the specified host and port for web socket conenctions from clients
//     // const host = 'localhost'
//     // const port = '1234'
//     const wsServer = yjsWebsocketServer(host, port)
//     log(`Serving web socket connections on ws://${host}:${port}`)
//     return wsServer
// }

// // When receiving an exit signal, close the websocket server
// export const disableWebSocketMonitor = (wsServer:Server):void => {
//     wsServer.close()
//     log('Closing the web socket server')
// }
```

## File: src/utils/commandUtils.ts
```typescript
import { DocHandle } from "@automerge/automerge-repo";
import { Store } from "../data/Store.js";
import { Command, EngineID } from "../data/CommonTypes.js";
import { ArgumentDescriptor, CommandDefinition } from "../data/CommandDefinition.js";


export const handleCommand = async (commands: CommandDefinition[], storeHandle: DocHandle<Store> | null, context: 'console' | 'engine', input: string):Promise<void> => {
    const trimmedInput = input.trim();
    const commandName = trimmedInput.split(' ')[0];
    const command = commands.find(cmd => cmd.name === commandName);

    if (!command) {
        console.log(`Unknown command: ${commandName}`);
        return;
    }

    let stringArgs: string[] = [];
    // Special case for commands that take the entire rest of the line as a single argument
    if (command.args.length === 1) {
        const firstSpaceIndex = trimmedInput.indexOf(' ');
        if (firstSpaceIndex !== -1) {
            stringArgs.push(trimmedInput.substring(firstSpaceIndex + 1));
        }
    } else {
        stringArgs = trimmedInput.split(' ').slice(1).filter(arg => arg.length > 0);
    }

    // Scope checking
    if (context === 'console' && command.scope === 'engine') {
        console.log(`Error: Command '${commandName}' can only be executed on an engine. Use 'send <engineId> ${commandName} ...' to execute it remotely.`);
        return;
    }

    if (context === 'engine' && command.scope === 'console') {
        console.log(`Error: Command '${commandName}' can only be executed on a console.`);
        return;
    }

    try {
        const args = stringArgs.map((arg, index) => {
            if (index >= command.args.length) throw new Error("Too many arguments");
            return convertToType(arg, command.args[index]);
        });

        if (args.length < command.args.length) throw new Error("Insufficient arguments");

        await command.execute(storeHandle, ...args);
    } catch (error) { // @ts-ignore
        console.error(`Error: ${error.message}`);
    }
}


/**
 * A dependency-free utility to add a command to a specific engine's command array in the store.
 * This is used by tests and the 'send' command definition.
 */
export const sendCommand = (storeHandle: DocHandle<Store>, engineId: EngineID, command: Command): void => {
    console.log(`Sending command '${command}' to engine ${engineId}`);

    const store = storeHandle.doc();
    if (!store?.engineDB[engineId]) {
        console.error(`Cannot send command: Engine ${engineId} not found in store.`);
        return;
    }

    storeHandle.change(doc => {
        const engine = doc.engineDB[engineId];
        if (engine) {
            engine.commands.push(command);
        }
    });
}
const convertToType = (str: string, descriptor: ArgumentDescriptor): any => {
    switch (descriptor.type) {
        case "number":
            const num = parseFloat(str);
            if (isNaN(num)) throw new Error("Cannot convert to number");
            return num;
        case "string":
            return str;
        case "object":
            if (!descriptor.objectSpec) throw new Error("Object specification is missing");
            try {
                const obj = JSON.parse(str);
                for (const [key, fieldSpec] of Object.entries(descriptor.objectSpec)) {
                    if (!(key in obj)) throw new Error(`Missing key '${key}' in object`);
                    switch (fieldSpec.type) {
                        case 'number':
                            const value = parseFloat(obj[key]);
                            if (isNaN(value)) throw new Error(`Key '${key}' is not a valid number`);
                            obj[key] = value;
                            break;
                        case 'string':
                            if (typeof obj[key] !== 'string') throw new Error(`Key '${key}' is not a valid string`);
                            break;
                    }
                }
                return obj;
            } catch {
                throw new Error("Cannot convert to object");
            }
        default:
            throw new Error("Unsupported type");
    }
}

```

## File: src/utils/nameGenerator.ts
```typescript
import util from 'util';
import { Hostname } from '../data/CommonTypes.js';

// Docker-style name generation
// Inspired by
// - https://github.com/moby/moby/blob/39f7b2b6d0156811d9683c6cb0743118ae516a11/pkg/namesgenerator/names-generator.go#L852-L863 
// - https://github.com/subfuzion/docker-namesgenerator/blob/master/namesgenerator.js
  
  const adjectives = [
    "admiring",
          "adoring",
          "affectionate",
          "agitated",
          "amazing",
          "angry",
          "awesome",
          "beautiful",
          "blissful",
          "bold",
          "boring",
          "brave",
          "busy",
          "charming",
          "clever",
          "cool",
          "compassionate",
          "competent",
          "condescending",
          "confident",
          "cranky",
          "crazy",
          "dazzling",
          "determined",
          "distracted",
          "dreamy",
          "eager",
          "ecstatic",
          "elastic",
          "elated",
          "elegant",
          "eloquent",
          "epic",
          "exciting",
          "fervent",
          "festive",
          "flamboyant",
          "focused",
          "friendly",
          "frosty",
          "funny",
          "gallant",
          "gifted",
          "goofy",
          "gracious",
          "great",
          "happy",
          "hardcore",
          "heuristic",
          "hopeful",
          "hungry",
          "infallible",
          "inspiring",
          "intelligent",
          "interesting",
          "jolly",
          "jovial",
          "keen",
          "kind",
          "laughing",
          "loving",
          "lucid",
          "magical",
          "mystifying",
          "modest",
          "musing",
          "naughty",
          "nervous",
          "nice",
          "nifty",
          "nostalgic",
          "objective",
          "optimistic",
          "peaceful",
          "pedantic",
          "pensive",
          "practical",
          "priceless",
          "quirky",
          "quizzical",
          "recursing",
          "relaxed",
          "reverent",
          "romantic",
          "sad",
          "serene",
          "sharp",
          "silly",
          "sleepy",
          "stoic",
          "strange",
          "stupefied",
          "suspicious",
          "sweet",
          "tender",
          "thirsty",
          "trusting",
          "unruffled",
          "upbeat",
          "vibrant",
          "vigilant",
          "vigorous",
          "wizardly",
          "wonderful",
          "xenodochial",
          "youthful",
          "zealous",
          "zen",
  ]
  
  const scientists = [
    // Maria Gaetana Agnesi - Italian mathematician, philosopher, theologian and humanitarian. She was the first woman to write a mathematics handbook and the first woman appointed as a Mathematics Professor at a University. https://en.wikipedia.org/wiki/Maria_Gaetana_Agnesi
    "agnesi",
  
    // Muhammad ibn Jābir al-Ḥarrānī al-Battānī was a founding father of astronomy. https://en.wikipedia.org/wiki/Mu%E1%B8%A5ammad_ibn_J%C4%81bir_al-%E1%B8%A4arr%C4%81n%C4%AB_al-Batt%C4%81n%C4%AB
    "albattani",
  
    // Frances E. Allen, became the first female IBM Fellow in 1989. In 2006, she became the first female recipient of the ACM's Turing Award. https://en.wikipedia.org/wiki/Frances_E._Allen
    "allen",
  
    // June Almeida - Scottish virologist who took the first pictures of the rubella virus - https://en.wikipedia.org/wiki/June_Almeida
    "almeida",
  
    // Kathleen Antonelli, American computer programmer and one of the six original programmers of the ENIAC - https://en.wikipedia.org/wiki/Kathleen_Antonelli
    "antonelli",
  
    // Archimedes was a physicist, engineer and mathematician who invented too many things to list them here. https://en.wikipedia.org/wiki/Archimedes
    "archimedes",
  
    // Maria Ardinghelli - Italian translator, mathematician and physicist - https://en.wikipedia.org/wiki/Maria_Ardinghelli
    "ardinghelli",
  
    // Aryabhata - Ancient Indian mathematician-astronomer during 476-550 CE https://en.wikipedia.org/wiki/Aryabhata
    "aryabhata",
  
    // Wanda Austin - Wanda Austin is the President and CEO of The Aerospace Corporation, a leading architect for the US security space programs. https://en.wikipedia.org/wiki/Wanda_Austin
    "austin",
  
    // Charles Babbage invented the concept of a programmable computer. https://en.wikipedia.org/wiki/Charles_Babbage.
    "babbage",
  
    // Stefan Banach - Polish mathematician, was one of the founders of modern functional analysis. https://en.wikipedia.org/wiki/Stefan_Banach
    "banach",
  
    // Buckaroo Banzai and his mentor Dr. Hikita perfected the "oscillation overthruster", a device that allows one to pass through solid matter. - https://en.wikipedia.org/wiki/The_Adventures_of_Buckaroo_Banzai_Across_the_8th_Dimension
    "banzai",
  
    // John Bardeen co-invented the transistor - https://en.wikipedia.org/wiki/John_Bardeen
    "bardeen",
  
    // Jean Bartik, born Betty Jean Jennings, was one of the original programmers for the ENIAC computer. https://en.wikipedia.org/wiki/Jean_Bartik
    "bartik",
  
    // Laura Bassi, the world's first female professor https://en.wikipedia.org/wiki/Laura_Bassi
    "bassi",
  
    // Hugh Beaver, British engineer, founder of the Guinness Book of World Records https://en.wikipedia.org/wiki/Hugh_Beaver
    "beaver",
  
    // Alexander Graham Bell - an eminent Scottish-born scientist, inventor, engineer and innovator who is credited with inventing the first practical telephone - https://en.wikipedia.org/wiki/Alexander_Graham_Bell
    "bell",
  
    // Karl Friedrich Benz - a German automobile engineer. Inventor of the first practical motorcar. https://en.wikipedia.org/wiki/Karl_Benz
    "benz",
  
    // Homi J Bhabha - was an Indian nuclear physicist, founding director, and professor of physics at the Tata Institute of Fundamental Research. Colloquially known as "father of Indian nuclear programme"- https://en.wikipedia.org/wiki/Homi_J._Bhabha
    "bhabha",
  
    // Bhaskara II - Ancient Indian mathematician-astronomer whose work on calculus predates Newton and Leibniz by over half a millennium - https://en.wikipedia.org/wiki/Bh%C4%81skara_II#Calculus
    "bhaskara",
  
    // Sue Black - British computer scientist and campaigner. She has been instrumental in saving Bletchley Park, the site of World War II codebreaking - https://en.wikipedia.org/wiki/Sue_Black_(computer_scientist)
    "black",
  
    // Elizabeth Helen Blackburn - Australian-American Nobel laureate; best known for co-discovering telomerase. https://en.wikipedia.org/wiki/Elizabeth_Blackburn
    "blackburn",
  
    // Elizabeth Blackwell - American doctor and first American woman to receive a medical degree - https://en.wikipedia.org/wiki/Elizabeth_Blackwell
    "blackwell",
  
    // Niels Bohr is the father of quantum theory. https://en.wikipedia.org/wiki/Niels_Bohr.
    "bohr",
  
    // Kathleen Booth, she's credited with writing the first assembly language. https://en.wikipedia.org/wiki/Kathleen_Booth
    "booth",
  
    // Anita Borg - Anita Borg was the founding director of the Institute for Women and Technology (IWT). https://en.wikipedia.org/wiki/Anita_Borg
    "borg",
  
    // Satyendra Nath Bose - He provided the foundation for Bose–Einstein statistics and the theory of the Bose–Einstein condensate. - https://en.wikipedia.org/wiki/Satyendra_Nath_Bose
    "bose",
  
    // Katherine Louise Bouman is an imaging scientist and Assistant Professor of Computer Science at the California Institute of Technology. She researches computational methods for imaging, and developed an algorithm that made possible the picture first visualization of a black hole using the Event Horizon Telescope. - https://en.wikipedia.org/wiki/Katie_Bouman
    "bouman",
  
    // Evelyn Boyd Granville - She was one of the first African-American woman to receive a Ph.D. in mathematics; she earned it in 1949 from Yale University. https://en.wikipedia.org/wiki/Evelyn_Boyd_Granville
    "boyd",
  
    // Brahmagupta - Ancient Indian mathematician during 598-670 CE who gave rules to compute with zero - https://en.wikipedia.org/wiki/Brahmagupta#Zero
    "brahmagupta",
  
    // Walter Houser Brattain co-invented the transistor - https://en.wikipedia.org/wiki/Walter_Houser_Brattain
    "brattain",
  
    // Emmett Brown invented time travel. https://en.wikipedia.org/wiki/Emmett_Brown (thanks Brian Goff)
    "brown",
  
    // Linda Brown Buck - American biologist and Nobel laureate best known for her genetic and molecular analyses of the mechanisms of smell. https://en.wikipedia.org/wiki/Linda_B._Buck
    "buck",
  
    // Dame Susan Jocelyn Bell Burnell - Northern Irish astrophysicist who discovered radio pulsars and was the first to analyse them. https://en.wikipedia.org/wiki/Jocelyn_Bell_Burnell
    "burnell",
  
    // Annie Jump Cannon - pioneering female astronomer who classified hundreds of thousands of stars and created the system we use to understand stars today. https://en.wikipedia.org/wiki/Annie_Jump_Cannon
    "cannon",
  
    // Rachel Carson - American marine biologist and conservationist, her book Silent Spring and other writings are credited with advancing the global environmental movement. https://en.wikipedia.org/wiki/Rachel_Carson
    "carson",
  
    // Dame Mary Lucy Cartwright - British mathematician who was one of the first to study what is now known as chaos theory. Also known for Cartwright's theorem which finds applications in signal processing. https://en.wikipedia.org/wiki/Mary_Cartwright
    "cartwright",
  
    // George Washington Carver - American agricultural scientist and inventor. He was the most prominent black scientist of the early 20th century. https://en.wikipedia.org/wiki/George_Washington_Carver
    "carver",
  
    // Vinton Gray Cerf - American Internet pioneer, recognised as one of "the fathers of the Internet". With Robert Elliot Kahn, he designed TCP and IP, the primary data communication protocols of the Internet and other computer networks. https://en.wikipedia.org/wiki/Vint_Cerf
    "cerf",
  
    // Subrahmanyan Chandrasekhar - Astrophysicist known for his mathematical theory on different stages and evolution in structures of the stars. He has won nobel prize for physics - https://en.wikipedia.org/wiki/Subrahmanyan_Chandrasekhar
    "chandrasekhar",
  
    // Sergey Alexeyevich Chaplygin (Russian: Серге́й Алексе́евич Чаплы́гин; April 5, 1869 – October 8, 1942) was a Russian and Soviet physicist, mathematician, and mechanical engineer. He is known for mathematical formulas such as Chaplygin's equation and for a hypothetical substance in cosmology called Chaplygin gas, named after him. https://en.wikipedia.org/wiki/Sergey_Chaplygin
    "chaplygin",
  
    // Émilie du Châtelet - French natural philosopher, mathematician, physicist, and author during the early 1730s, known for her translation of and commentary on Isaac Newton's book Principia containing basic laws of physics. https://en.wikipedia.org/wiki/%C3%89milie_du_Ch%C3%A2telet
    "chatelet",
  
    // Asima Chatterjee was an Indian organic chemist noted for her research on vinca alkaloids, development of drugs for treatment of epilepsy and malaria - https://en.wikipedia.org/wiki/Asima_Chatterjee
    "chatterjee",
  
    // David Lee Chaum - American computer scientist and cryptographer. Known for his seminal contributions in the field of anonymous communication. https://en.wikipedia.org/wiki/David_Chaum
    "chaum",
  
    // Pafnuty Chebyshev - Russian mathematician. He is known fo his works on probability, statistics, mechanics, analytical geometry and number theory https://en.wikipedia.org/wiki/Pafnuty_Chebyshev
    "chebyshev",
  
    // Joan Clarke - Bletchley Park code breaker during the Second World War who pioneered techniques that remained top secret for decades. Also an accomplished numismatist https://en.wikipedia.org/wiki/Joan_Clarke
    "clarke",
  
    // Bram Cohen - American computer programmer and author of the BitTorrent peer-to-peer protocol. https://en.wikipedia.org/wiki/Bram_Cohen
    "cohen",
  
    // Jane Colden - American botanist widely considered the first female American botanist - https://en.wikipedia.org/wiki/Jane_Colden
    "colden",
  
    // Gerty Theresa Cori - American biochemist who became the third woman—and first American woman—to win a Nobel Prize in science, and the first woman to be awarded the Nobel Prize in Physiology or Medicine. Cori was born in Prague. https://en.wikipedia.org/wiki/Gerty_Cori
    "cori",
  
    // Seymour Roger Cray was an American electrical engineer and supercomputer architect who designed a series of computers that were the fastest in the world for decades. https://en.wikipedia.org/wiki/Seymour_Cray
    "cray",
  
    // This entry reflects a husband and wife team who worked together:
    // Joan Curran was a Welsh scientist who developed radar and invented chaff, a radar countermeasure. https://en.wikipedia.org/wiki/Joan_Curran
    // Samuel Curran was an Irish physicist who worked alongside his wife during WWII and invented the proximity fuse. https://en.wikipedia.org/wiki/Samuel_Curran
    "curran",
  
    // Marie Curie discovered radioactivity. https://en.wikipedia.org/wiki/Marie_Curie.
    "curie",
  
    // Charles Darwin established the principles of natural evolution. https://en.wikipedia.org/wiki/Charles_Darwin.
    "darwin",
  
    // Leonardo Da Vinci invented too many things to list here. https://en.wikipedia.org/wiki/Leonardo_da_Vinci.
    "davinci",
  
    // A. K. (Alexander Keewatin) Dewdney, Canadian mathematician, computer scientist, author and filmmaker. Contributor to Scientific American's "Computer Recreations" from 1984 to 1991. Author of Core War (program), The Planiverse, The Armchair Universe, The Magic Machine, The New Turing Omnibus, and more. https://en.wikipedia.org/wiki/Alexander_Dewdney
    "dewdney",
  
    // Satish Dhawan - Indian mathematician and aerospace engineer, known for leading the successful and indigenous development of the Indian space programme. https://en.wikipedia.org/wiki/Satish_Dhawan
    "dhawan",
  
    // Bailey Whitfield Diffie - American cryptographer and one of the pioneers of public-key cryptography. https://en.wikipedia.org/wiki/Whitfield_Diffie
    "diffie",
  
    // Edsger Wybe Dijkstra was a Dutch computer scientist and mathematical scientist. https://en.wikipedia.org/wiki/Edsger_W._Dijkstra.
    "dijkstra",
  
    // Paul Adrien Maurice Dirac - English theoretical physicist who made fundamental contributions to the early development of both quantum mechanics and quantum electrodynamics. https://en.wikipedia.org/wiki/Paul_Dirac
    "dirac",
  
    // Agnes Meyer Driscoll - American cryptanalyst during World Wars I and II who successfully cryptanalysed a number of Japanese ciphers. She was also the co-developer of one of the cipher machines of the US Navy, the CM. https://en.wikipedia.org/wiki/Agnes_Meyer_Driscoll
    "driscoll",
  
    // Donna Dubinsky - played an integral role in the development of personal digital assistants (PDAs) serving as CEO of Palm, Inc. and co-founding Handspring. https://en.wikipedia.org/wiki/Donna_Dubinsky
    "dubinsky",
  
    // Annie Easley - She was a leading member of the team which developed software for the Centaur rocket stage and one of the first African-Americans in her field. https://en.wikipedia.org/wiki/Annie_Easley
    "easley",
  
    // Thomas Alva Edison, prolific inventor https://en.wikipedia.org/wiki/Thomas_Edison
    "edison",
  
    // Albert Einstein invented the general theory of relativity. https://en.wikipedia.org/wiki/Albert_Einstein
    "einstein",
  
    // Alexandra Asanovna Elbakyan (Russian: Алекса́ндра Аса́новна Элбакя́н) is a Kazakhstani graduate student, computer programmer, internet pirate in hiding, and the creator of the site Sci-Hub. Nature has listed her in 2016 in the top ten people that mattered in science, and Ars Technica has compared her to Aaron Swartz. - https://en.wikipedia.org/wiki/Alexandra_Elbakyan
    "elbakyan",
  
    // Taher A. ElGamal - Egyptian cryptographer best known for the ElGamal discrete log cryptosystem and the ElGamal digital signature scheme. https://en.wikipedia.org/wiki/Taher_Elgamal
    "elgamal",
  
    // Gertrude Elion - American biochemist, pharmacologist and the 1988 recipient of the Nobel Prize in Medicine - https://en.wikipedia.org/wiki/Gertrude_Elion
    "elion",
  
    // James Henry Ellis - British engineer and cryptographer employed by the GCHQ. Best known for conceiving for the first time, the idea of public-key cryptography. https://en.wikipedia.org/wiki/James_H._Ellis
    "ellis",
  
    // Douglas Engelbart gave the mother of all demos: https://en.wikipedia.org/wiki/Douglas_Engelbart
    "engelbart",
  
    // Euclid invented geometry. https://en.wikipedia.org/wiki/Euclid
    "euclid",
  
    // Leonhard Euler invented large parts of modern mathematics. https://de.wikipedia.org/wiki/Leonhard_Euler
    "euler",
  
    // Michael Faraday - British scientist who contributed to the study of electromagnetism and electrochemistry. https://en.wikipedia.org/wiki/Michael_Faraday
    "faraday",
  
    // Horst Feistel - German-born American cryptographer who was one of the earliest non-government researchers to study the design and theory of block ciphers. Co-developer of DES and Lucifer. Feistel networks, a symmetric structure used in the construction of block ciphers are named after him. https://en.wikipedia.org/wiki/Horst_Feistel
    "feistel",
  
    // Pierre de Fermat pioneered several aspects of modern mathematics. https://en.wikipedia.org/wiki/Pierre_de_Fermat
    "fermat",
  
    // Enrico Fermi invented the first nuclear reactor. https://en.wikipedia.org/wiki/Enrico_Fermi.
    "fermi",
  
    // Richard Feynman was a key contributor to quantum mechanics and particle physics. https://en.wikipedia.org/wiki/Richard_Feynman
    "feynman",
  
    // Benjamin Franklin is famous for his experiments in electricity and the invention of the lightning rod.
    "franklin",
  
    // Yuri Alekseyevich Gagarin - Soviet pilot and cosmonaut, best known as the first human to journey into outer space. https://en.wikipedia.org/wiki/Yuri_Gagarin
    "gagarin",
  
    // Galileo was a founding father of modern astronomy, and faced politics and obscurantism to establish scientific truth.  https://en.wikipedia.org/wiki/Galileo_Galilei
    "galileo",
  
    // Évariste Galois - French mathematician whose work laid the foundations of Galois theory and group theory, two major branches of abstract algebra, and the subfield of Galois connections, all while still in his late teens. https://en.wikipedia.org/wiki/%C3%89variste_Galois
    "galois",
  
    // Kadambini Ganguly - Indian physician, known for being the first South Asian female physician, trained in western medicine, to graduate in South Asia. https://en.wikipedia.org/wiki/Kadambini_Ganguly
    "ganguly",
  
    // William Henry "Bill" Gates III is an American business magnate, philanthropist, investor, computer programmer, and inventor. https://en.wikipedia.org/wiki/Bill_Gates
    "gates",
  
    // Johann Carl Friedrich Gauss - German mathematician who made significant contributions to many fields, including number theory, algebra, statistics, analysis, differential geometry, geodesy, geophysics, mechanics, electrostatics, magnetic fields, astronomy, matrix theory, and optics. https://en.wikipedia.org/wiki/Carl_Friedrich_Gauss
    "gauss",
  
    // Marie-Sophie Germain - French mathematician, physicist and philosopher. Known for her work on elasticity theory, number theory and philosophy. https://en.wikipedia.org/wiki/Sophie_Germain
    "germain",
  
    // Adele Goldberg, was one of the designers and developers of the Smalltalk language. https://en.wikipedia.org/wiki/Adele_Goldberg_(computer_scientist)
    "goldberg",
  
    // Adele Goldstine, born Adele Katz, wrote the complete technical description for the first electronic digital computer, ENIAC. https://en.wikipedia.org/wiki/Adele_Goldstine
    "goldstine",
  
    // Shafi Goldwasser is a computer scientist known for creating theoretical foundations of modern cryptography. Winner of 2012 ACM Turing Award. https://en.wikipedia.org/wiki/Shafi_Goldwasser
    "goldwasser",
  
    // James Golick, all around gangster.
    "golick",
  
    // Jane Goodall - British primatologist, ethologist, and anthropologist who is considered to be the world's foremost expert on chimpanzees - https://en.wikipedia.org/wiki/Jane_Goodall
    "goodall",
  
    // Stephen Jay Gould was was an American paleontologist, evolutionary biologist, and historian of science. He is most famous for the theory of punctuated equilibrium - https://en.wikipedia.org/wiki/Stephen_Jay_Gould
    "gould",
  
    // Carolyn Widney Greider - American molecular biologist and joint winner of the 2009 Nobel Prize for Physiology or Medicine for the discovery of telomerase. https://en.wikipedia.org/wiki/Carol_W._Greider
    "greider",
  
    // Alexander Grothendieck - German-born French mathematician who became a leading figure in the creation of modern algebraic geometry. https://en.wikipedia.org/wiki/Alexander_Grothendieck
    "grothendieck",
  
    // Lois Haibt - American computer scientist, part of the team at IBM that developed FORTRAN - https://en.wikipedia.org/wiki/Lois_Haibt
    "haibt",
  
    // Margaret Hamilton - Director of the Software Engineering Division of the MIT Instrumentation Laboratory, which developed on-board flight software for the Apollo space program. https://en.wikipedia.org/wiki/Margaret_Hamilton_(scientist)
    "hamilton",
  
    // Caroline Harriet Haslett - English electrical engineer, electricity industry administrator and champion of women's rights. Co-author of British Standard 1363 that specifies AC power plugs and sockets used across the United Kingdom (which is widely considered as one of the safest designs). https://en.wikipedia.org/wiki/Caroline_Haslett
    "haslett",
  
    // Stephen Hawking pioneered the field of cosmology by combining general relativity and quantum mechanics. https://en.wikipedia.org/wiki/Stephen_Hawking
    "hawking",
  
    // Martin Edward Hellman - American cryptologist, best known for his invention of public-key cryptography in co-operation with Whitfield Diffie and Ralph Merkle. https://en.wikipedia.org/wiki/Martin_Hellman
    "hellman",
  
    // Werner Heisenberg was a founding father of quantum mechanics. https://en.wikipedia.org/wiki/Werner_Heisenberg
    "heisenberg",
  
    // Grete Hermann was a German philosopher noted for her philosophical work on the foundations of quantum mechanics. https://en.wikipedia.org/wiki/Grete_Hermann
    "hermann",
  
    // Caroline Lucretia Herschel - German astronomer and discoverer of several comets. https://en.wikipedia.org/wiki/Caroline_Herschel
    "herschel",
  
    // Heinrich Rudolf Hertz - German physicist who first conclusively proved the existence of the electromagnetic waves. https://en.wikipedia.org/wiki/Heinrich_Hertz
    "hertz",
  
    // Jaroslav Heyrovský was the inventor of the polarographic method, father of the electroanalytical method, and recipient of the Nobel Prize in 1959. His main field of work was polarography. https://en.wikipedia.org/wiki/Jaroslav_Heyrovsk%C3%BD
    "heyrovsky",
  
    // Dorothy Hodgkin was a British biochemist, credited with the development of protein crystallography. She was awarded the Nobel Prize in Chemistry in 1964. https://en.wikipedia.org/wiki/Dorothy_Hodgkin
    "hodgkin",
  
    // Douglas R. Hofstadter is an American professor of cognitive science and author of the Pulitzer Prize and American Book Award-winning work Goedel, Escher, Bach: An Eternal Golden Braid in 1979. A mind-bending work which coined Hofstadter's Law: "It always takes longer than you expect, even when you take into account Hofstadter's Law." https://en.wikipedia.org/wiki/Douglas_Hofstadter
    "hofstadter",
  
    // Erna Schneider Hoover revolutionized modern communication by inventing a computerized telephone switching method. https://en.wikipedia.org/wiki/Erna_Schneider_Hoover
    "hoover",
  
    // Grace Hopper developed the first compiler for a computer programming language and  is credited with popularizing the term "debugging" for fixing computer glitches. https://en.wikipedia.org/wiki/Grace_Hopper
    "hopper",
  
    // Frances Hugle, she was an American scientist, engineer, and inventor who contributed to the understanding of semiconductors, integrated circuitry, and the unique electrical principles of microscopic materials. https://en.wikipedia.org/wiki/Frances_Hugle
    "hugle",
  
    // Hypatia - Greek Alexandrine Neoplatonist philosopher in Egypt who was one of the earliest mothers of mathematics - https://en.wikipedia.org/wiki/Hypatia
    "hypatia",
  
    // Teruko Ishizaka - Japanese scientist and immunologist who co-discovered the antibody class Immunoglobulin E. https://en.wikipedia.org/wiki/Teruko_Ishizaka
    "ishizaka",
  
    // Mary Jackson, American mathematician and aerospace engineer who earned the highest title within NASA's engineering department - https://en.wikipedia.org/wiki/Mary_Jackson_(engineer)
    "jackson",
  
    // Yeong-Sil Jang was a Korean scientist and astronomer during the Joseon Dynasty; he invented the first metal printing press and water gauge. https://en.wikipedia.org/wiki/Jang_Yeong-sil
    "jang",
  
    // Mae Carol Jemison -  is an American engineer, physician, and former NASA astronaut. She became the first black woman to travel in space when she served as a mission specialist aboard the Space Shuttle Endeavour - https://en.wikipedia.org/wiki/Mae_Jemison
    "jemison",
  
    // Betty Jennings - one of the original programmers of the ENIAC. https://en.wikipedia.org/wiki/ENIAC - https://en.wikipedia.org/wiki/Jean_Bartik
    "jennings",
  
    // Mary Lou Jepsen, was the founder and chief technology officer of One Laptop Per Child (OLPC), and the founder of Pixel Qi. https://en.wikipedia.org/wiki/Mary_Lou_Jepsen
    "jepsen",
  
    // Katherine Coleman Goble Johnson - American physicist and mathematician contributed to the NASA. https://en.wikipedia.org/wiki/Katherine_Johnson
    "johnson",
  
    // Irène Joliot-Curie - French scientist who was awarded the Nobel Prize for Chemistry in 1935. Daughter of Marie and Pierre Curie. https://en.wikipedia.org/wiki/Ir%C3%A8ne_Joliot-Curie
    "joliot",
  
    // Karen Spärck Jones came up with the concept of inverse document frequency, which is used in most search engines today. https://en.wikipedia.org/wiki/Karen_Sp%C3%A4rck_Jones
    "jones",
  
    // A. P. J. Abdul Kalam - is an Indian scientist aka Missile Man of India for his work on the development of ballistic missile and launch vehicle technology - https://en.wikipedia.org/wiki/A._P._J._Abdul_Kalam
    "kalam",
  
    // Sergey Petrovich Kapitsa (Russian: Серге́й Петро́вич Капи́ца; 14 February 1928 – 14 August 2012) was a Russian physicist and demographer. He was best known as host of the popular and long-running Russian scientific TV show, Evident, but Incredible. His father was the Nobel laureate Soviet-era physicist Pyotr Kapitsa, and his brother was the geographer and Antarctic explorer Andrey Kapitsa. - https://en.wikipedia.org/wiki/Sergey_Kapitsa
    "kapitsa",
  
    // Susan Kare, created the icons and many of the interface elements for the original Apple Macintosh in the 1980s, and was an original employee of NeXT, working as the Creative Director. https://en.wikipedia.org/wiki/Susan_Kare
    "kare",
  
    // Mstislav Keldysh - a Soviet scientist in the field of mathematics and mechanics, academician of the USSR Academy of Sciences (1946), President of the USSR Academy of Sciences (1961–1975), three times Hero of Socialist Labor (1956, 1961, 1971), fellow of the Royal Society of Edinburgh (1968). https://en.wikipedia.org/wiki/Mstislav_Keldysh
    "keldysh",
  
    // Mary Kenneth Keller, Sister Mary Kenneth Keller became the first American woman to earn a PhD in Computer Science in 1965. https://en.wikipedia.org/wiki/Mary_Kenneth_Keller
    "keller",
  
    // Johannes Kepler, German astronomer known for his three laws of planetary motion - https://en.wikipedia.org/wiki/Johannes_Kepler
    "kepler",
  
    // Omar Khayyam - Persian mathematician, astronomer and poet. Known for his work on the classification and solution of cubic equations, for his contribution to the understanding of Euclid's fifth postulate and for computing the length of a year very accurately. https://en.wikipedia.org/wiki/Omar_Khayyam
    "khayyam",
  
    // Har Gobind Khorana - Indian-American biochemist who shared the 1968 Nobel Prize for Physiology - https://en.wikipedia.org/wiki/Har_Gobind_Khorana
    "khorana",
  
    // Jack Kilby invented silicon integrated circuits and gave Silicon Valley its name. - https://en.wikipedia.org/wiki/Jack_Kilby
    "kilby",
  
    // Maria Kirch - German astronomer and first woman to discover a comet - https://en.wikipedia.org/wiki/Maria_Margarethe_Kirch
    "kirch",
  
    // Donald Knuth - American computer scientist, author of "The Art of Computer Programming" and creator of the TeX typesetting system. https://en.wikipedia.org/wiki/Donald_Knuth
    "knuth",
  
    // Sophie Kowalevski - Russian mathematician responsible for important original contributions to analysis, differential equations and mechanics - https://en.wikipedia.org/wiki/Sofia_Kovalevskaya
    "kowalevski",
  
    // Marie-Jeanne de Lalande - French astronomer, mathematician and cataloguer of stars - https://en.wikipedia.org/wiki/Marie-Jeanne_de_Lalande
    "lalande",
  
    // Hedy Lamarr - Actress and inventor. The principles of her work are now incorporated into modern Wi-Fi, CDMA and Bluetooth technology. https://en.wikipedia.org/wiki/Hedy_Lamarr
    "lamarr",
  
    // Leslie B. Lamport - American computer scientist. Lamport is best known for his seminal work in distributed systems and was the winner of the 2013 Turing Award. https://en.wikipedia.org/wiki/Leslie_Lamport
    "lamport",
  
    // Mary Leakey - British paleoanthropologist who discovered the first fossilized Proconsul skull - https://en.wikipedia.org/wiki/Mary_Leakey
    "leakey",
  
    // Henrietta Swan Leavitt - she was an American astronomer who discovered the relation between the luminosity and the period of Cepheid variable stars. https://en.wikipedia.org/wiki/Henrietta_Swan_Leavitt
    "leavitt",
  
    // Esther Miriam Zimmer Lederberg - American microbiologist and a pioneer of bacterial genetics. https://en.wikipedia.org/wiki/Esther_Lederberg
    "lederberg",
  
    // Inge Lehmann - Danish seismologist and geophysicist. Known for discovering in 1936 that the Earth has a solid inner core inside a molten outer core. https://en.wikipedia.org/wiki/Inge_Lehmann
    "lehmann",
  
    // Daniel Lewin - Mathematician, Akamai co-founder, soldier, 9/11 victim-- Developed optimization techniques for routing traffic on the internet. Died attempting to stop the 9-11 hijackers. https://en.wikipedia.org/wiki/Daniel_Lewin
    "lewin",
  
    // Ruth Lichterman - one of the original programmers of the ENIAC. https://en.wikipedia.org/wiki/ENIAC - https://en.wikipedia.org/wiki/Ruth_Teitelbaum
    "lichterman",
  
    // Barbara Liskov - co-developed the Liskov substitution principle. Liskov was also the winner of the Turing Prize in 2008. - https://en.wikipedia.org/wiki/Barbara_Liskov
    "liskov",
  
    // Ada Lovelace invented the first algorithm. https://en.wikipedia.org/wiki/Ada_Lovelace (thanks James Turnbull)
    "lovelace",
  
    // Auguste and Louis Lumière - the first filmmakers in history - https://en.wikipedia.org/wiki/Auguste_and_Louis_Lumi%C3%A8re
    "lumiere",
  
    // Mahavira - Ancient Indian mathematician during 9th century AD who discovered basic algebraic identities - https://en.wikipedia.org/wiki/Mah%C4%81v%C4%ABra_(mathematician)
    "mahavira",
  
    // Lynn Margulis (b. Lynn Petra Alexander) - an American evolutionary theorist and biologist, science author, educator, and popularizer, and was the primary modern proponent for the significance of symbiosis in evolution. - https://en.wikipedia.org/wiki/Lynn_Margulis
    "margulis",
  
    // Yukihiro Matsumoto - Japanese computer scientist and software programmer best known as the chief designer of the Ruby programming language. https://en.wikipedia.org/wiki/Yukihiro_Matsumoto
    "matsumoto",
  
    // James Clerk Maxwell - Scottish physicist, best known for his formulation of electromagnetic theory. https://en.wikipedia.org/wiki/James_Clerk_Maxwell
    "maxwell",
  
    // Maria Mayer - American theoretical physicist and Nobel laureate in Physics for proposing the nuclear shell model of the atomic nucleus - https://en.wikipedia.org/wiki/Maria_Mayer
    "mayer",
  
    // John McCarthy invented LISP: https://en.wikipedia.org/wiki/John_McCarthy_(computer_scientist)
    "mccarthy",
  
    // Barbara McClintock - a distinguished American cytogeneticist, 1983 Nobel Laureate in Physiology or Medicine for discovering transposons. https://en.wikipedia.org/wiki/Barbara_McClintock
    "mcclintock",
  
    // Anne Laura Dorinthea McLaren - British developmental biologist whose work helped lead to human in-vitro fertilisation. https://en.wikipedia.org/wiki/Anne_McLaren
    "mclaren",
  
    // Malcolm McLean invented the modern shipping container: https://en.wikipedia.org/wiki/Malcom_McLean
    "mclean",
  
    // Kay McNulty - one of the original programmers of the ENIAC. https://en.wikipedia.org/wiki/ENIAC - https://en.wikipedia.org/wiki/Kathleen_Antonelli
    "mcnulty",
  
    // Gregor Johann Mendel - Czech scientist and founder of genetics. https://en.wikipedia.org/wiki/Gregor_Mendel
    "mendel",
  
    // Dmitri Mendeleev - a chemist and inventor. He formulated the Periodic Law, created a farsighted version of the periodic table of elements, and used it to correct the properties of some already discovered elements and also to predict the properties of eight elements yet to be discovered. https://en.wikipedia.org/wiki/Dmitri_Mendeleev
    "mendeleev",
  
    // Lise Meitner - Austrian/Swedish physicist who was involved in the discovery of nuclear fission. The element meitnerium is named after her - https://en.wikipedia.org/wiki/Lise_Meitner
    "meitner",
  
    // Carla Meninsky, was the game designer and programmer for Atari 2600 games Dodge 'Em and Warlords. https://en.wikipedia.org/wiki/Carla_Meninsky
    "meninsky",
  
    // Ralph C. Merkle - American computer scientist, known for devising Merkle's puzzles - one of the very first schemes for public-key cryptography. Also, inventor of Merkle trees and co-inventor of the Merkle-Damgård construction for building collision-resistant cryptographic hash functions and the Merkle-Hellman knapsack cryptosystem. https://en.wikipedia.org/wiki/Ralph_Merkle
    "merkle",
  
    // Johanna Mestorf - German prehistoric archaeologist and first female museum director in Germany - https://en.wikipedia.org/wiki/Johanna_Mestorf
    "mestorf",
  
    // Maryam Mirzakhani - an Iranian mathematician and the first woman to win the Fields Medal. https://en.wikipedia.org/wiki/Maryam_Mirzakhani
    "mirzakhani",
  
    // Rita Levi-Montalcini - Won Nobel Prize in Physiology or Medicine jointly with colleague Stanley Cohen for the discovery of nerve growth factor (https://en.wikipedia.org/wiki/Rita_Levi-Montalcini)
    "montalcini",
  
    // Gordon Earle Moore - American engineer, Silicon Valley founding father, author of Moore's law. https://en.wikipedia.org/wiki/Gordon_Moore
    "moore",
  
    // Samuel Morse - contributed to the invention of a single-wire telegraph system based on European telegraphs and was a co-developer of the Morse code - https://en.wikipedia.org/wiki/Samuel_Morse
    "morse",
  
    // Ian Murdock - founder of the Debian project - https://en.wikipedia.org/wiki/Ian_Murdock
    "murdock",
  
    // May-Britt Moser - Nobel prize winner neuroscientist who contributed to the discovery of grid cells in the brain. https://en.wikipedia.org/wiki/May-Britt_Moser
    "moser",
  
    // John Napier of Merchiston - Scottish landowner known as an astronomer, mathematician and physicist. Best known for his discovery of logarithms. https://en.wikipedia.org/wiki/John_Napier
    "napier",
  
    // John Forbes Nash, Jr. - American mathematician who made fundamental contributions to game theory, differential geometry, and the study of partial differential equations. https://en.wikipedia.org/wiki/John_Forbes_Nash_Jr.
    "nash",
  
    // John von Neumann - todays computer architectures are based on the von Neumann architecture. https://en.wikipedia.org/wiki/Von_Neumann_architecture
    "neumann",
  
    // Isaac Newton invented classic mechanics and modern optics. https://en.wikipedia.org/wiki/Isaac_Newton
    "newton",
  
    // Florence Nightingale, more prominently known as a nurse, was also the first female member of the Royal Statistical Society and a pioneer in statistical graphics https://en.wikipedia.org/wiki/Florence_Nightingale#Statistics_and_sanitary_reform
    "nightingale",
  
    // Alfred Nobel - a Swedish chemist, engineer, innovator, and armaments manufacturer (inventor of dynamite) - https://en.wikipedia.org/wiki/Alfred_Nobel
    "nobel",
  
    // Emmy Noether, German mathematician. Noether's Theorem is named after her. https://en.wikipedia.org/wiki/Emmy_Noether
    "noether",
  
    // Poppy Northcutt. Poppy Northcutt was the first woman to work as part of NASA’s Mission Control. http://www.businessinsider.com/poppy-northcutt-helped-apollo-astronauts-2014-12?op=1
    "northcutt",
  
    // Robert Noyce invented silicon integrated circuits and gave Silicon Valley its name. - https://en.wikipedia.org/wiki/Robert_Noyce
    "noyce",
  
    // Panini - Ancient Indian linguist and grammarian from 4th century CE who worked on the world's first formal system - https://en.wikipedia.org/wiki/P%C4%81%E1%B9%87ini#Comparison_with_modern_formal_systems
    "panini",
  
    // Ambroise Pare invented modern surgery. https://en.wikipedia.org/wiki/Ambroise_Par%C3%A9
    "pare",
  
    // Blaise Pascal, French mathematician, physicist, and inventor - https://en.wikipedia.org/wiki/Blaise_Pascal
    "pascal",
  
    // Louis Pasteur discovered vaccination, fermentation and pasteurization. https://en.wikipedia.org/wiki/Louis_Pasteur.
    "pasteur",
  
    // Cecilia Payne-Gaposchkin was an astronomer and astrophysicist who, in 1925, proposed in her Ph.D. thesis an explanation for the composition of stars in terms of the relative abundances of hydrogen and helium. https://en.wikipedia.org/wiki/Cecilia_Payne-Gaposchkin
    "payne",
  
    // Radia Perlman is a software designer and network engineer and most famous for her invention of the spanning-tree protocol (STP). https://en.wikipedia.org/wiki/Radia_Perlman
    "perlman",
  
    // Rob Pike was a key contributor to Unix, Plan 9, the X graphic system, utf-8, and the Go programming language. https://en.wikipedia.org/wiki/Rob_Pike
    "pike",
  
    // Henri Poincaré made fundamental contributions in several fields of mathematics. https://en.wikipedia.org/wiki/Henri_Poincar%C3%A9
    "poincare",
  
    // Laura Poitras is a director and producer whose work, made possible by open source crypto tools, advances the causes of truth and freedom of information by reporting disclosures by whistleblowers such as Edward Snowden. https://en.wikipedia.org/wiki/Laura_Poitras
    "poitras",
  
    // Tat’yana Avenirovna Proskuriakova (Russian: Татья́на Авени́ровна Проскуряко́ва) (January 23 [O.S. January 10] 1909 – August 30, 1985) was a Russian-American Mayanist scholar and archaeologist who contributed significantly to the deciphering of Maya hieroglyphs, the writing system of the pre-Columbian Maya civilization of Mesoamerica. https://en.wikipedia.org/wiki/Tatiana_Proskouriakoff
    "proskuriakova",
  
    // Claudius Ptolemy - a Greco-Egyptian writer of Alexandria, known as a mathematician, astronomer, geographer, astrologer, and poet of a single epigram in the Greek Anthology - https://en.wikipedia.org/wiki/Ptolemy
    "ptolemy",
  
    // C. V. Raman - Indian physicist who won the Nobel Prize in 1930 for proposing the Raman effect. - https://en.wikipedia.org/wiki/C._V._Raman
    "raman",
  
    // Srinivasa Ramanujan - Indian mathematician and autodidact who made extraordinary contributions to mathematical analysis, number theory, infinite series, and continued fractions. - https://en.wikipedia.org/wiki/Srinivasa_Ramanujan
    "ramanujan",
  
    // Sally Kristen Ride was an American physicist and astronaut. She was the first American woman in space, and the youngest American astronaut. https://en.wikipedia.org/wiki/Sally_Ride
    "ride",
  
    // Dennis Ritchie - co-creator of UNIX and the C programming language. - https://en.wikipedia.org/wiki/Dennis_Ritchie
    "ritchie",
  
    // Ida Rhodes - American pioneer in computer programming, designed the first computer used for Social Security. https://en.wikipedia.org/wiki/Ida_Rhodes
    "rhodes",
  
    // Julia Hall Bowman Robinson - American mathematician renowned for her contributions to the fields of computability theory and computational complexity theory. https://en.wikipedia.org/wiki/Julia_Robinson
    "robinson",
  
    // Wilhelm Conrad Röntgen - German physicist who was awarded the first Nobel Prize in Physics in 1901 for the discovery of X-rays (Röntgen rays). https://en.wikipedia.org/wiki/Wilhelm_R%C3%B6ntgen
    "roentgen",
  
    // Rosalind Franklin - British biophysicist and X-ray crystallographer whose research was critical to the understanding of DNA - https://en.wikipedia.org/wiki/Rosalind_Franklin
    "rosalind",
  
    // Vera Rubin - American astronomer who pioneered work on galaxy rotation rates. https://en.wikipedia.org/wiki/Vera_Rubin
    "rubin",
  
    // Meghnad Saha - Indian astrophysicist best known for his development of the Saha equation, used to describe chemical and physical conditions in stars - https://en.wikipedia.org/wiki/Meghnad_Saha
    "saha",
  
    // Jean E. Sammet developed FORMAC, the first widely used computer language for symbolic manipulation of mathematical formulas. https://en.wikipedia.org/wiki/Jean_E._Sammet
    "sammet",
  
    // Mildred Sanderson - American mathematician best known for Sanderson's theorem concerning modular invariants. https://en.wikipedia.org/wiki/Mildred_Sanderson
    "sanderson",
  
    // Satoshi Nakamoto is the name used by the unknown person or group of people who developed bitcoin, authored the bitcoin white paper, and created and deployed bitcoin's original reference implementation. https://en.wikipedia.org/wiki/Satoshi_Nakamoto
    "satoshi",
  
    // Adi Shamir - Israeli cryptographer whose numerous inventions and contributions to cryptography include the Ferge Fiat Shamir identification scheme, the Rivest Shamir Adleman (RSA) public-key cryptosystem, the Shamir's secret sharing scheme, the breaking of the Merkle-Hellman cryptosystem, the TWINKLE and TWIRL factoring devices and the discovery of differential cryptanalysis (with Eli Biham). https://en.wikipedia.org/wiki/Adi_Shamir
    "shamir",
  
    // Claude Shannon - The father of information theory and founder of digital circuit design theory. (https://en.wikipedia.org/wiki/Claude_Shannon)
    "shannon",
  
    // Carol Shaw - Originally an Atari employee, Carol Shaw is said to be the first female video game designer. https://en.wikipedia.org/wiki/Carol_Shaw_(video_game_designer)
    "shaw",
  
    // Dame Stephanie "Steve" Shirley - Founded a software company in 1962 employing women working from home. https://en.wikipedia.org/wiki/Steve_Shirley
    "shirley",
  
    // William Shockley co-invented the transistor - https://en.wikipedia.org/wiki/William_Shockley
    "shockley",
  
    // Lina Solomonovna Stern (or Shtern; Russian: Лина Соломоновна Штерн; 26 August 1878 – 7 March 1968) was a Soviet biochemist, physiologist and humanist whose medical discoveries saved thousands of lives at the fronts of World War II. She is best known for her pioneering work on blood–brain barrier, which she described as hemato-encephalic barrier in 1921. https://en.wikipedia.org/wiki/Lina_Stern
    "shtern",
  
    // Françoise Barré-Sinoussi - French virologist and Nobel Prize Laureate in Physiology or Medicine; her work was fundamental in identifying HIV as the cause of AIDS. https://en.wikipedia.org/wiki/Fran%C3%A7oise_Barr%C3%A9-Sinoussi
    "sinoussi",
  
    // Betty Snyder - one of the original programmers of the ENIAC. https://en.wikipedia.org/wiki/ENIAC - https://en.wikipedia.org/wiki/Betty_Holberton
    "snyder",
  
    // Cynthia Solomon - Pioneer in the fields of artificial intelligence, computer science and educational computing. Known for creation of Logo, an educational programming language.  https://en.wikipedia.org/wiki/Cynthia_Solomon
    "solomon",
  
    // Frances Spence - one of the original programmers of the ENIAC. https://en.wikipedia.org/wiki/ENIAC - https://en.wikipedia.org/wiki/Frances_Spence
    "spence",
  
    // Michael Stonebraker is a database research pioneer and architect of Ingres, Postgres, VoltDB and SciDB. Winner of 2014 ACM Turing Award. https://en.wikipedia.org/wiki/Michael_Stonebraker
    "stonebraker",
  
    // Ivan Edward Sutherland - American computer scientist and Internet pioneer, widely regarded as the father of computer graphics. https://en.wikipedia.org/wiki/Ivan_Sutherland
    "sutherland",
  
    // Janese Swanson (with others) developed the first of the Carmen Sandiego games. She went on to found Girl Tech. https://en.wikipedia.org/wiki/Janese_Swanson
    "swanson",
  
    // Aaron Swartz was influential in creating RSS, Markdown, Creative Commons, Reddit, and much of the internet as we know it today. He was devoted to freedom of information on the web. https://en.wikiquote.org/wiki/Aaron_Swartz
    "swartz",
  
    // Bertha Swirles was a theoretical physicist who made a number of contributions to early quantum theory. https://en.wikipedia.org/wiki/Bertha_Swirles
    "swirles",
  
    // Helen Brooke Taussig - American cardiologist and founder of the field of paediatric cardiology. https://en.wikipedia.org/wiki/Helen_B._Taussig
    "taussig",
  
    // Valentina Tereshkova is a Russian engineer, cosmonaut and politician. She was the first woman to fly to space in 1963. In 2013, at the age of 76, she offered to go on a one-way mission to Mars. https://en.wikipedia.org/wiki/Valentina_Tereshkova
    "tereshkova",
  
    // Nikola Tesla invented the AC electric system and every gadget ever used by a James Bond villain. https://en.wikipedia.org/wiki/Nikola_Tesla
    "tesla",
  
    // Marie Tharp - American geologist and oceanic cartographer who co-created the first scientific map of the Atlantic Ocean floor. Her work led to the acceptance of the theories of plate tectonics and continental drift. https://en.wikipedia.org/wiki/Marie_Tharp
    "tharp",
  
    // Ken Thompson - co-creator of UNIX and the C programming language - https://en.wikipedia.org/wiki/Ken_Thompson
    "thompson",
  
    // Linus Torvalds invented Linux and Git. https://en.wikipedia.org/wiki/Linus_Torvalds
    "torvalds",
  
    // Youyou Tu - Chinese pharmaceutical chemist and educator known for discovering artemisinin and dihydroartemisinin, used to treat malaria, which has saved millions of lives. Joint winner of the 2015 Nobel Prize in Physiology or Medicine. https://en.wikipedia.org/wiki/Tu_Youyou
    "tu",
  
    // Alan Turing was a founding father of computer science. https://en.wikipedia.org/wiki/Alan_Turing.
    "turing",
  
    // Varahamihira - Ancient Indian mathematician who discovered trigonometric formulae during 505-587 CE - https://en.wikipedia.org/wiki/Var%C4%81hamihira#Contributions
    "varahamihira",
  
    // Dorothy Vaughan was a NASA mathematician and computer programmer on the SCOUT launch vehicle program that put America's first satellites into space - https://en.wikipedia.org/wiki/Dorothy_Vaughan
    "vaughan",
  
    // Cédric Villani - French mathematician, won Fields Medal, Fermat Prize and Poincaré Price for his work in differential geometry and statistical mechanics. https://en.wikipedia.org/wiki/C%C3%A9dric_Villani
    "villani",
  
    // Sir Mokshagundam Visvesvaraya - is a notable Indian engineer.  He is a recipient of the Indian Republic's highest honour, the Bharat Ratna, in 1955. On his birthday, 15 September is celebrated as Engineer's Day in India in his memory - https://en.wikipedia.org/wiki/Visvesvaraya
    "visvesvaraya",
  
    // Christiane Nüsslein-Volhard - German biologist, won Nobel Prize in Physiology or Medicine in 1995 for research on the genetic control of embryonic development. https://en.wikipedia.org/wiki/Christiane_N%C3%BCsslein-Volhard
    "volhard",
  
    // Marlyn Wescoff - one of the original programmers of the ENIAC. https://en.wikipedia.org/wiki/ENIAC - https://en.wikipedia.org/wiki/Marlyn_Meltzer
    "wescoff",
  
    // Sylvia B. Wilbur - British computer scientist who helped develop the ARPANET, was one of the first to exchange email in the UK and a leading researcher in computer-supported collaborative work. https://en.wikipedia.org/wiki/Sylvia_Wilbur
    "wilbur",
  
    // Andrew Wiles - Notable British mathematician who proved the enigmatic Fermat's Last Theorem - https://en.wikipedia.org/wiki/Andrew_Wiles
    "wiles",
  
    // Roberta Williams, did pioneering work in graphical adventure games for personal computers, particularly the King's Quest series. https://en.wikipedia.org/wiki/Roberta_Williams
    "williams",
  
    // Malcolm John Williamson - British mathematician and cryptographer employed by the GCHQ. Developed in 1974 what is now known as Diffie-Hellman key exchange (Diffie and Hellman first published the scheme in 1976). https://en.wikipedia.org/wiki/Malcolm_J._Williamson
    "williamson",
  
    // Sophie Wilson designed the first Acorn Micro-Computer and the instruction set for ARM processors. https://en.wikipedia.org/wiki/Sophie_Wilson
    "wilson",
  
    // Jeannette Wing - co-developed the Liskov substitution principle. - https://en.wikipedia.org/wiki/Jeannette_Wing
    "wing",
  
    // Steve Wozniak invented the Apple I and Apple II. https://en.wikipedia.org/wiki/Steve_Wozniak
    "wozniak",
  
    // The Wright brothers, Orville and Wilbur - credited with inventing and building the world's first successful airplane and making the first controlled, powered and sustained heavier-than-air human flight - https://en.wikipedia.org/wiki/Wright_brothers
    "wright",
  
    // Chien-Shiung Wu - Chinese-American experimental physicist who made significant contributions to nuclear physics. https://en.wikipedia.org/wiki/Chien-Shiung_Wu
    "wu",
  
    // Rosalyn Sussman Yalow - Rosalyn Sussman Yalow was an American medical physicist, and a co-winner of the 1977 Nobel Prize in Physiology or Medicine for development of the radioimmunoassay technique. https://en.wikipedia.org/wiki/Rosalyn_Sussman_Yalow
    "yalow",
  
    // Ada Yonath - an Israeli crystallographer, the first woman from the Middle East to win a Nobel prize in the sciences. https://en.wikipedia.org/wiki/Ada_Yonath
    "yonath",
  
    // Nikolay Yegorovich Zhukovsky (Russian: Никола́й Его́рович Жуко́вский, January 17 1847 – March 17, 1921) was a Russian scientist, mathematician and engineer, and a founding father of modern aero- and hydrodynamics. Whereas contemporary scientists scoffed at the idea of human flight, Zhukovsky was the first to undertake the study of airflow. He is often called the Father of Russian Aviation. https://en.wikipedia.org/wiki/Nikolay_Yegorovich_Zhukovsky
    "zhukovsky",
  ]
  
  export const generateHostName = ():Hostname => {
    return util.format('%s-%s', randelem(adjectives), randelem(scientists)) as Hostname
  }
  
  function randnum(n:number):number {
    return Math.floor(Math.random() * n);
  }
  
  function randelem(a:string[]):string {
    return a[randnum(a.length)];
  }
```

## File: src/utils/utils.ts
```typescript
import util from 'util';
import { $, chalk, fs, os, question } from 'zx';
import { IPAddress, PortNumber } from '../data/CommonTypes.js';
import net from 'net';


// Dummy key
export const dummyKey = "_dummy"

export const getKeys = (obj) => {
  return Object.keys(obj).filter(key => !(key === `${dummyKey}`))
}

// Generate a random port number between 49152-65535
export const randomPort = ():PortNumber => {
  return Math.floor(Math.random() * 16383) + 49152 as PortNumber
}
// Write a function that reads a .env file and extracts the value of a variable from it
// The function should take the path to the .env file and the name of the variable as input
// It should return the value of the variable
// If the variable is not found, it should return null
export const readEnvVariable = async (path: string, variable: string): Promise<string | null> => {
  try {
    const envContent = (await $`cat ${path}`).stdout
    const values = envContent.match(new RegExp(`^${variable}=(.*)`, 'm'))
    log(`Values: ${deepPrint(values)}`)
    if (values && values.length >= 1) {
      const value = values[1]
      return value
    } else {
      return null
    }
  } catch (e) {
    return null
  }
}

// Write a function that adds or updates a variable to a .env file
// The function should take the path to the .env file, the name of the variable and its value as input
// If the variable is already present in the .env file, it should update its value
// If the variable is not present in the .env file, it should add it
export const addOrUpdateEnvVariable = async (path: string, variable: string, value: string): Promise<void> => {
  try {
    const envContent = (await $`cat ${path}`).stdout
    const values = envContent.match(new RegExp(`^${variable}=(.*)`, 'm'))
    if (values && values.length >= 1) {
      // Update the value of the variable
      await $`sed -i 's|^${variable}=.*|${variable}=${value}|' ${path}`
    } else {
      // Add the variable to the .env file
      await $`echo "${variable}=${value}" >> ${path}`
    }
    log(`Added or updated variable ${variable} in .env file ${path}`)
  } catch (e) {
    // Add the variable to the .env file
    log(`Error adding or updating variable ${variable} in .env file ${path}`)
    log(`error: ${e}`)
    //await $`echo "${variable}=${value}" >> ${path}`
  }
}



// Read verbosityLevel from the environmnet
const verbosity = process.env.VERBOSITY || ""
export let verbosityLevel = parseInt(verbosity) || 0

//export const log = console.log.bind(console);
export const log = (msg:string, level?:number):void => {
  if (!level) {
    // Set the default log level to 2
    level = 2
  }
  if (verbosityLevel >= level) {
    console.log(chalk.gray(msg))
  }
}

export const error = (msg:string):void => {
  console.log(chalk.red(msg))
  console.error(chalk.red(msg))
}

export const setVerbosity = (level:number):void => {
  verbosityLevel = level
}

export const isEngineOnline = (hostname: string, port: number): Promise<boolean> => {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timeout = 2000; // 2 seconds
    socket.setTimeout(timeout);

    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });

    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });

    socket.connect(port, hostname);
  });
};

// // Execute promises sequentially
// export const sequential = (promises) => {
//   return promises.reduce((promise, func) => {
//     return promise.then(func)
//   }, Promise.resolve())
// }

// export const executePromisesSequentially = async (promises) => {
//     for (let promise of promises) {
//       await promise
//     }
// }






// Write a function that uses zx to test if a path exists
// export const dirExists = async (path: string) => {
//     try {
//         await $`test -d ${path}`
//         return true
//     } catch (e) {
//         return false
//     }
// }

// export const dirExists = async (path: string) => {
//   return await $`test -d ${path}`.then(() => true).catch(() => false)
// }

// export const fileExists = async (path: string) => {
//   try {
//       await $`test -f ${path}`
//       return true
//   } catch (e) {
//       return false
//   }
// }

// export const fileExists = async (path: string) => {
//   return await $`test -f ${path}`.then(() => true).catch(() => false)
// }

export const fileExists = (path: string):boolean => {
  return fs.existsSync(path)
}

// Check if the root folder contains the folder yjs-db  If so, set firstBoot to false, otherwise set it to true
// This is a way to check if the engine has been booted before
// export const firstBoot: boolean = fs.existsSync('../yjs-db') ? false : true 
// export const firstBoot: boolean = !(await fileExists('./yjs-db'))
// log(`First boot: ${firstBoot}`)




// Write a function that checks if a given yarray contains a specific value
// Use the Y.Array API of the Yjs library (which does not have a built-in method for this)
// Do it
export const contains = (yarray, value) => {
    let found = false
    yarray.forEach((item) => {
      if (item === value) {
        found = true
      }
    })
    return found
  }

export const deepPrint = (obj, depth:(number | null)=null) => {
    return util.inspect(obj, {showHidden: false, depth: depth, colors: true})
    // Alternative: return JSON.stringify(obj, null, 2)
    // Alternative: return console.dir(obj, {depth: null, colors: true})
}


// Write a function that tests if a string is a valid IP4 address
export const isIP4 = (str: string): boolean => {
  const ip4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
  return ip4Regex.test(str)
}

export const isNetmask = isIP4

// See https://stackoverflow.com/questions/503052/how-to-check-if-ip-is-in-one-of-these-subnets


// const ip2long = (ip) => {
//   var components;
//   if(components = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/))
//   {
//       var iplong = 0;
//       var power  = 1;
//       for(var i=4; i>=1; i-=1)
//       {
//           iplong += power * parseInt(components[i]);
//           power  *= 256;
//       }
//       return iplong;
//   }
//   else return -1;
// };

// THIS FUNCTION IS WRONG
// export const inSubNet = (ip, subnet) => {   
//   var mask, base_ip, long_ip = ip2long(ip);
//   if( (mask = subnet.match(/^(.*?)\/(\d{1,2})$/)) && ((base_ip=ip2long(mask[1])) >= 0) )
//   {
//       var freedom = Math.pow(2, 32 - parseInt(mask[2]));
//       return (long_ip > base_ip) && (long_ip < base_ip + freedom - 1);
//   }
//   else return false;
// }

export const IPnumber = (ip:IPAddress):number => {
//  var ip = IPaddress.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
//  if(ip) {
//      return (+ip[1]<<24) + (+ip[2]<<16) + (+ip[3]<<8) + (+ip[4]);
//  }
  return (+ip[1]<<24) + (+ip[2]<<16) + (+ip[3]<<8) + (+ip[4]);
}

export const isIPAddress = (str: string): str is IPAddress => {
  // return str.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
  // const ipRegex = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/
  return ipRegex.test(str)
}

export const sameNet = (IP1:any, IP2:any, mask:any) => {
  //log(`${IPnumber(IP1) & IPnumber(mask)} == ${IPnumber(IP2) & IPnumber(mask)}`)
  // Check if the IP addresses are strings
  if (isIPAddress(IP1) && isIPAddress(IP2) && isNetmask(mask)) {
    return (IPnumber(IP1) & IPnumber(mask)) == (IPnumber(IP2) & IPnumber(mask))
  } else {
    return false
  }
}

export const findIp = async (address:IPAddress):Promise<IPAddress | undefined> => {
  // Use a shell command to resolve the ip address
  // REmove the trailing \n from the ip address
  try {
    const interfaceData = os.networkInterfaces()
    const ip = interfaceData["eth0"]?.find((iface) => iface.family === "IPv4")?.address
    if (ip && isIPAddress(ip)) {
      return ip
    } else {
      return undefined
    }
  } catch (e) {
    return undefined
  }
}

export const findIp2 = async (address:IPAddress):Promise<IPAddress | undefined> => {
  // Use a shell command to resolve the ip address
  // REmove the trailing \n from the ip address
  try {
    const ip = (await $`ping -c 1 ${address} | grep PING | awk '{print $3}' | tr -d '()'`).stdout.replace(/\n$/, '')
    if (isIPAddress(ip)) {
      return ip
    } else {
      return undefined
    }
  } catch (e) {
    return undefined
  }
}

export const reset = async ($) => {
  console.log(chalk.blue('Resetting the local engine'));
  try {
      // console.log(chalk.blue('Removing the yjs database'));
      // await $`rm -rf ../yjs-db`;
      // console.log(chalk.blue('Removing all appnet ids'))
      // if (config.settings.appnets) {
      //   config.settings.appnets.forEach((appnet) => delete appnet.id)
      //   console.log(chalk.blue('Updating the config file'));
      //   writeConfig(config, '../config.yaml')
      // }
  } catch (e) {   
      console.log(chalk.red('Failed to reset the local engine'));
      console.error(e);
      process.exit(1);
  }
}

export const prompt = (level:number, message: string) => {
  // Create level*4 spaces
  const spaces = ' '.repeat(level * 4)
  console.log(chalk.green(spaces+message))
  return question(chalk.bgMagentaBright(spaces+'Press ENTER when ready'))
}

// Generate a uuid
export const uuid = ():string => {
  const id = Math.random().toString(36).substring(2) + Date.now().toString(36)
  log(`Generated uuid: ${id}`)
  return id
}

export const uuidLight = ():string => {
  return uuid().substring(0, 8)
}


// A function to strip the trailing partition number from a device name
export const stripPartition = (device: string):string => {
  if (device.startsWith('nvme') || device.startsWith('mmcblk')) {
    return device.replace(/p[0-9]+$/, '')
  }
  return device.replace(/[0-9]+$/, '')
}

```

