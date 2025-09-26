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
    execute: (storeHandle: DocHandle<Store>, ...args: any[]) => void;
    args: ArgumentDescriptor[];
    scope: 'engine' | 'client' | 'any' | 'cli';
}