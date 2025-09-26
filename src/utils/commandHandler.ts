import { ArgumentDescriptor, CommandDefinition } from "../data/CommandDefinition.js";
import { DocHandle } from "@automerge/automerge-repo";
import { Store } from "../data/Store.js";
import { commands } from "../data/Commands.js";



// convertToType function with support for object fields of different types
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


export const handleCommand = async (storeHandle: DocHandle<Store>, context: 'client' | 'engine' | 'cli', input: string):Promise<void> => {
    const [commandName, ...stringArgs] = input.split(" ").map(arg => arg.trim()).filter(arg => arg.length > 0);
    const command = commands.find(cmd => cmd.name === commandName);

    if (!command) {
        console.log(`Unknown command: ${commandName}`);
        return;
    }

    // Scope checking
    if (context !== 'cli') {
        if (context === 'client' && command.scope === 'engine') {
            console.log(`Error: Command '${commandName}' can only be executed on an engine. Use 'send <engineId> ${commandName} ...' to execute it remotely.`);
            return;
        }
    
        if (context === 'engine' && command.scope === 'client') {
            console.log(`Error: Command '${commandName}' can only be executed on a client.`);
            return;
        }
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

