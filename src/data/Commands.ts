import { CommandDefinition } from "./CommandDefinition.js";
import { Store, getApps, getDisks, getEngines, getInstances, getEngine, findDiskByName, findInstanceByName } from "./Store.js";
import { deepPrint } from "../utils/utils.js";
import { buildInstance, startInstance, runInstance, stopInstance } from "./Instance.js";
import { AppName, Command, DeviceName, DiskName, EngineID, Hostname, InstanceName, Version } from "./CommonTypes.js";
import { localEngineId } from "./Engine.js";
import { chalk } from "zx";
import { DocHandle } from "@automerge/automerge-repo";

// **********************
// Local command execution
// **********************

const ls = (storeHandle: DocHandle<Store>): void => {
    console.log('NetworkData on this engine:');
    console.log(deepPrint(storeHandle.doc()), 3);
}

const lsEngines = (storeHandle: DocHandle<Store>): void => {
    console.log('Engines:');
    const engines = getEngines(storeHandle.doc());
    console.log(`Total engines: ${engines.length}`);
    console.log(deepPrint(engines, 2));
}

const lsDisks = (storeHandle: DocHandle<Store>): void => {
    console.log('Disks:');
    const disks = getDisks(storeHandle.doc());
    console.log(deepPrint(disks, 2));
}

const lsApps = (storeHandle: DocHandle<Store>): void => {
    console.log('Apps:');
    const apps = getApps(storeHandle.doc());
    console.log(deepPrint(apps, 2));
}

const lsInstances = (storeHandle: DocHandle<Store>): void => {
    console.log('Instances:');
    const instances = getInstances(storeHandle.doc());
    console.log(deepPrint(instances, 2));
}

const buildInstanceWrapper = async (storeHandle: DocHandle<Store>, instanceName: InstanceName, appName: AppName, gitAccount: string, gitTag: string, diskName: DiskName) => {
    const store = storeHandle.doc()
    const disk = findDiskByName(store, diskName)
    if (!disk || !disk.device) {
        console.log(chalk.red(`Disk ${diskName} not found or has no device on engine ${localEngineId}`))
        return
    }
    buildInstance(instanceName, appName, gitAccount, gitTag as Version, disk.device)
}

const startInstanceWrapper = async (storeHandle: DocHandle<Store>, instanceName: InstanceName, diskName: DiskName) => {
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

const runInstanceWrapper = async (storeHandle: DocHandle<Store>, instanceName: InstanceName, diskName: DiskName) => {
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

const stopInstanceWrapper = async (storeHandle: DocHandle<Store>, instanceName: InstanceName, diskName: DiskName) => {
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

// ************************
// Remote Command Execution
// ************************

const sendCommand = (storeHandle: DocHandle<Store>, engineId: EngineID, command: Command): void => {
    console.log(`Sending command '${command}' to engine ${engineId}`);

    const engine = getEngine(storeHandle.doc(), engineId);
    if (engine && engine.commands) {
        console.log(`Pushing commands to ${engineId}`);
        storeHandle.change(doc => {
            const engine = getEngine(doc, engineId)
            if (engine) engine.commands.push(command)
        })
    } else {
        console.log(`Engine ${engineId} not found or has no commands array.`);
    }
}

export const commands: CommandDefinition[] = [
    {
        name: "ls",
        execute: ls,
        args: [],
        scope: 'any'
    },
    {
        name: "engines",
        execute: lsEngines,
        args: [],
        scope: 'any'
    },
    {
        name: "disks",
        execute: lsDisks,
        args: [],
        scope: 'any'
    },
    {
        name: "apps",
        execute: lsApps,
        args: [],
        scope: 'any'
    },
    {
        name: "instances",
        execute: lsInstances,
        args: [],
        scope: 'any'
    },
    {
        name: "send",
        execute: (storeHandle, engineId, ...commandParts) => sendCommand(storeHandle, engineId, commandParts.join(' ') as Command),
        args: [{ type: "string" }, { type: "string" }], // Simplified for now, will need to handle variable args
        scope: 'any'
    },
    {
        name: "createInstance",
        execute: buildInstanceWrapper,
        args: [{ type: "string" }, { type: "string" }, { type: "string" }, { type: "string" }, { type: "string" }],
        scope: 'engine'
    },
    {
        name: "startInstance",
        execute: startInstanceWrapper,
        args: [{ type: "string" }, { type: "string" }],
        scope: 'engine'
    },
    {
        name: "runInstance",
        execute: runInstanceWrapper,
        args: [{ type: "string" }, { type: "string" }],
        scope: 'engine'
    },
    {
        name: "stopInstance",
        execute: stopInstanceWrapper,
        args: [{ type: "string" }, { type: "string" }],
        scope: 'engine'
    },
];
