import { $, YAML, chalk } from 'zx';
import { Version, URL, AppID, AppName, Hostname, DeviceName, DiskName, DiskID } from './CommonTypes.js';
import { log } from '../utils/utils.js';
import { Store } from './Store.js';
import { Disk } from './Disk.js';

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


export const createOrUpdateApp = async (store:Store, appId:AppID, disk:Disk) => {
    const storedApp: App | undefined = store.appDB[appId]
    const device: DeviceName = disk.device as DeviceName;
    const diskID: DiskID = disk.id as DiskID;
    try {
        // The full name of the app is <appName>-<version>
        const appName = extractAppName(appId)
        const appVersion = extractAppVersion(appId)

        // Read the compose.yaml file in the app folder
        const appComposeFile = await $`cat /disks/${device}/apps/${appId}/compose.yaml`
        const appCompose = YAML.parse(appComposeFile.stdout)
        if (!storedApp) {
            // Create a new app object
            log(chalk.green(`Creating new app ${appId} on disk ${diskID}`))
            const app = {
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
            store.appDB[appId] = app
            return app
        } else {
            // Granularly update the existing app object
            log(chalk.green(`Updating existing app ${appId} on disk ${diskID}`))
            const app = storedApp
            app.name = appName
            app.version = appVersion
            app.title = appCompose['x-app'].title
            app.description = appCompose['x-app'].description
            app.url = appCompose['x-app'].url
            app.category = appCompose['x-app'].category
            app.icon = appCompose['x-app'].icon
            app.author = appCompose['x-app'].author 
            return app
        }
  } catch (e) {
    log(chalk.red(`Error initializing instance ${appId} on disk ${disk.id}`))
    console.error(e)
    return undefined
  }
}
