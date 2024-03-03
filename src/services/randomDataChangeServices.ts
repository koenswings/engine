import { log } from '../utils/utils.js'
import { Array } from 'yjs'
import { contains } from '../utils/utils.js'


export const enableRandomArrayPopulation = (apps: Array<string>) => {
    // Randomly populate and depopulate the apps array with app names every 5 seconds. 
    // Choose from a list of app names such as "app1", "app2", "app3", "app4", "app5" etc.
    // The array should contain between 0 and 5 app names at any given time.
    // Make sure that any app name only appears once in the array.
    // Do it
    const appNames = ['app1', 'app2', 'app3', 'app4', 'app5']
    // If the array is empty, add a random app name
    // If the array is full, remove a random app name
    // If the array is not empty and not full, randomly decide whether to add or remove an app name and only select an app name that is not already in the array
    const populateApps = () => {
        if (apps.length === 0) {
            apps.insert(0, [appNames[Math.floor(Math.random() * appNames.length)]])
        } else if (apps.length === 5) {
            apps.delete(Math.floor(Math.random() * 5))
        } else {
            if (Math.random() < 0.5) {
                const randomAppName = appNames[Math.floor(Math.random() * appNames.length)]
                if (!contains(apps, randomAppName)) {
                    apps.insert(0, [randomAppName])
                }
            } else {
                apps.delete(Math.floor(Math.random() * apps.length))
            }
        }
    }
    setInterval(populateApps, 5000)
    log(`Randomly populating and depopulating apps array every 5 seconds`)
}


const enableRandomArrayModification = (apps: Array<object>) => {
    apps.insert(0, [{ name: 'app1' }, { name: 'app2' }, { name: 'app3' }, { name: 'app4' }, { name: 'app5' }])
    log(`Initialising apps array with app names`)
    // Create a function that first removes any x letters from all app names and then 
    // randomly puts a capital x behind the name of an app in the apps array 
    // Do it
    const modifyApps = () => {
        apps.forEach((app: { name: string }, index: number) => {
            app.name = app.name.replace('X', '')
            if (Math.random() < 0.5) {
                app.name = app.name + 'X'
            }
        })
        console.log(`Deep change to apps: ${JSON.stringify(apps.toArray())}`)
    }
    setInterval(modifyApps, 60000)
    log(`Randomly populating and depopulating apps array every 5 seconds`)

}

