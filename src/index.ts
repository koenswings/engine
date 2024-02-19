import { $, fs} from 'zx'
import chokidar  from 'chokidar' // https://stackoverflow.com/questions/42406913/nodejs-import-require-conversion
import { Doc } from 'yjs'
import { yjsWebsocketServer } from './yjsWebSocketServer.js'
import { WebsocketProvider } from './y-websocket.js'

// TODO: Alternative implementations for usb device detection:
// 1. Monitor /dev iso /dev/engine
// 2. Monitor /dev/disk/by-label
// 3. Monitor dmesg

const watchDir = '/dev/engine'
const watcher = chokidar.watch(watchDir, {
  persistent: true,
})

const log = console.log.bind(console);

watcher
  .on('add', async function (path) {
    // log(`Device ${path} has been added`)
    // Strip out the name of the device from the path and assign it to a variable
    const device = path.split('/').pop()
    // Check if the device begins with "sd", is then followed by a letter and ends with the number 2
    // We need the m flag - see https://regexr.com/7rvpq
    if (device.match(/^sd[a-z]2$/m)) {
      log(`USB device ${device} has been added`)
      try {
        // Check if the mount point exists. Run "mount -t ext4" and check if the output contains the string "/dev/<device> on /disks/<device> type ext4". 
        const mountOutput = await $`mount -t ext4`
        if (mountOutput.stdout.includes(`/dev/${device} on /disks/${device} type ext4`)) {
          log(`Device ${device} already mounted`)
        } else {
          log(`Mounting device ${device}`)
          // Make the mount point
          await $`mkdir -p /disks/${device}`
          // Mount the device to the mount point
          await $`mount /dev/${device} /disks/${device}`
          log(`Device ${device} has been successfully mounted`)
        }
      } catch (e) {
        log(`Error mounting device ${device}`)
        log(e)
      }
    } else {
      log(`Non-USB device ${device} has been added`)
    }
  })
  //.on('change', path => log(`File ${path} has been changed`))
  .on('unlink', async function (path) {
    //log(`Device ${path} has been removed`)
    // Strip out the name of the device from the path and assign it to a variable
    const device = path.split('/').pop()
    // Check if the device begins with "sd" and ends with a letter
    if (device.match(/^sd[a-z]2$/m)) {
      log(`USB device ${device} has been removed`)
      // Unmount
      try {
        // Check if the mount point exists. Run "mount -t ext4" and check if the output contains the device
        const mountOutput = await $`mount -t ext4`
        if (!mountOutput.stdout.includes(`/dev/${device} on /disks/${device} type ext4`)) {
          log(`Device ${device} already unmounted`)
        } else {
          log(`Unmounting device ${device}`)
          // Unmount
          await $`umount /disks/${device}`
          await $`rmdir /disks/${device}`
          log(`Device ${device} has been successfully unmounted`)
        }
        // Remove mount point
        await $`rm -fr /disks/${device}`
      } catch (e) {
        log(`Error unmounting device ${device}`)
        log(e)
      }
    } else {
      log(`Non-USB device ${device} has been removed`)
    }
  })
  .on('error', error => log(`Watcher error: ${error}`))

// Say we are ready to go
log(`Watching ${watchDir} for USB devices`)


const sharedDoc = new Doc()
const apps = sharedDoc.getArray('apps')
// every time a local or remote client modifies apps, the observer is called
apps.observe(event => {
  console.log(`apps was modified. Apps is now: ${apps.toArray()}`)
})
log('Observing apps')

// create a websocket server
// const host = 'localhost'
const port = '1234'
const wsServer = yjsWebsocketServer(port)
log(`Serving apps on ws://xxx:${port}`)

// create a websocket client
const host = 'localhost'
const wsProvider = new WebsocketProvider(`ws://${host}:1234`, 'appdocker', sharedDoc)
wsProvider.on('status', (event: { status: any; }) => {
  console.log(event.status) // logs "connected" or "disconnected"
})
log(`Establishing a connection to ws://${host}:1234 with room name appdocker`)



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



// Write a function that checks if a given yarray contains a specific value
// Use the Y.Array API of the Yjs library (which does not have a built-in method for this)
// Do it
const contains = (yarray, value) => {
  let found = false
  yarray.forEach((item) => {
    if (item === value) {
      found = true
    }
  })
  return found
}


// Write a simple Nodejs program that displays the current date and time every 5 seconds using the setInterval function
// The output should look like this:
// Current Date and Time: 2021-05-24T12:00:00
// Current Date and Time: 2021-05-24T12:00:05
// Current Date and Time: 2021-05-24T12:00:10
// Current Date and Time: 2021-05-24T12:00:15
// ...
// Do it
const displayDateAndTime = () => {
  console.log(`***Current Time and Date***: ${new Date()}`);
} 

setInterval(displayDateAndTime, 3600000);

