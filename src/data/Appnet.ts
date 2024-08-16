import { proxy } from "valtio"
import { AppnetName, EngineID } from "./CommonTypes.js"
import { Engine, initialiseLocalEngine } from "./Engine.js"
import { Doc } from "yjs"
import { bind } from "../valtio-yjs/index.js"

/**
 * Appnet is the root object for all data distributed over the network
 */
export interface Appnet {
        // name is also the unique identifier of the Appnet
    name: AppnetName

    // The set of ids for all engines in the network
    engines: {[key: EngineID]: boolean}
}

export const initialiseAppnetData = async (name: AppnetName, doc:Doc): Promise<Appnet> => {
    const $appnet = proxy<Appnet>({
        name: name,
        engines: proxy<{[key:EngineID]:boolean}>({}) 
    })
    
    // Bind the proxy for the engine Ids array to a corresponding Yjs Map
    bind($appnet.engines, doc.getMap(`${$appnet.name}_engineSet`))

    return $appnet
}

export const addEngineToAppnet = (appNet: Appnet, engineId: EngineID):void => {
    appNet.engines[engineId] = true
}

export const removeEngineFromAppnet = (appNet: Appnet, engineId: EngineID):void => {
    delete appNet.engines[engineId]
}

export const getAppnetEngineIds = (appNet: Appnet): EngineID[] => {
    return Object.keys(appNet.engines) as EngineID[]
}

export const getAppnetEngineCount = (appNet: Appnet): number => {
    return Object.keys(appNet.engines).length
}

