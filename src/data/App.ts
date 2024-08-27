import { $, YAML, chalk } from 'zx';
import { Version, URL, AppID, AppName, Hostname, DeviceName } from './CommonTypes.js';
import { log } from '../utils/utils.js';
import { proxy } from 'valtio';
import { Store, store } from './Store.js';
import { Network } from './Network.js';
import { bind } from '../valtio-yjs/index.js';

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

export const createOrUpdateApp = async (store:Store, appId:AppID, diskName:Hostname, device:DeviceName) => {
    let app: App
    try {
        // The full name of the app is <appName>-<version>
        const appName = extractAppName(appId)
        const appVersion = extractAppVersion(appId)

        // Read the compose.yaml file in the app folder
        const appComposeFile = await $`cat /disks/${device}/apps/${appId}/compose.yaml`
        const appCompose = YAML.parse(appComposeFile.stdout)
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
        // Class variation
        // const app = new App()
        // app.name = appCompose['x-app'].name
        // app.version = appCompose['x-app'].version
        // app.title = appCompose['x-app'].title
        // app.description = appCompose['x-app'].description
        // app.url = appCompose['x-app'].url
        // app.category = appCompose['x-app'].category
        // app.icon = appCompose['x-app'].icon
        // app.author = appCompose['x-app'].author
    } catch (e) {
        log(chalk.red(`Error creating app ${appId} from disk ${diskName}`))
        console.error(e)
        return undefined
    }
    if (store.appDB[app.id]) {
        // Update the app
        log(chalk.green(`Updating app ${appId} on disk ${diskName}`))
        const existingApp = store.appDB[app.id]
        existingApp.name = app.name
        existingApp.version = app.version
        existingApp.title = app.title
        existingApp.description = app.description
        existingApp.url = app.url
        existingApp.category = app.category
        existingApp.icon = app.icon
        existingApp.author = app.author
        return existingApp
    } else {
        // Create the app
        log
        const $app = proxy<App>(app)
        // Bind it to all networks
        bindApp($app, store.networks)
        // Add the app to the store
        store.appDB[app.id] = $app
        return $app
    }
}
  
export const bindApp = ($app:App, networks:Network[]):void => {
    networks.forEach((network) => {
        // Bind the $engine proxy to the network
        const yEngine = network.doc.getMap($app.id)
        network.unbind = bind($app as Record<string, any>, yEngine)
        log(`Bound app ${$app.id} to network ${network.appnet.name}`)
    })
}