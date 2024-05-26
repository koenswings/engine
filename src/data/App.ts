import { $, YAML, chalk } from 'zx';
import { Version, URL } from './CommonTypes.js';
import { log } from '../utils/utils.js';

export interface App {
    name: string;
    version: Version;
    title: string;
    description: string;
    url: URL
    category: AppCategory;
    icon: URL;
    author: string;
}

type AppCategory = 'Productivity' | 'Utilities' | 'Games';


export const createAppFromFile = async (appName:string, diskName:string, device:string) => {
    let app: App
    try {
        // Read the compose.yaml file in the app folder
        const appComposeFile = await $`cat /disks/${device}/apps/${appName}/compose.yaml`
        const appCompose = YAML.parse(appComposeFile.stdout)
        app = {
            name: appCompose['x-app'].name,
            version: appCompose['x-app'].version,
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
        log(chalk.red(`Error creating app ${appName} on disk ${diskName}`))
        console.error(e)
    }
    return app
}
  
  