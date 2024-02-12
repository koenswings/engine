// TODO: solve issue adding udev to Mac     "udev": "^1.0.1"

import chokidar  from 'chokidar'
// https://stackoverflow.com/questions/42406913/nodejs-import-require-conversion

//import { usb, getDeviceList } from 'usb';

// var udev = require("udev");
// Change the above line to use the import statement
//import * as udev from 'udev';

// Print out the properties en methods of the udev object
//console.log(udev);

//console.log(udev.default.list()); // this is a long list :)

// var monitor = udev.default.monitor("input");
// monitor.on('add', function (device) {
//     console.log('added ' + device);
//     monitor.close() // this closes the monitor.
// });
// monitor.on('remove', function (device) {
//     console.log('removed ' + device);
// });
// monitor.on('change', function (device) {
//     console.log('changed ' + device);
// });



// const devices: usb.Device[] = getDeviceList();

// for (const device of devices) {
//     //console.log(device); // Legacy device
// }

// usb.on('attach', function(device) { 
//   console.log("ATTACHED")
//   console.log(device)
// })

// usb.on('detach', function(device) { 
//   console.log("DETACHED")
//   console.log(device)
// })



// One-liner for current directory
chokidar.watch('.').on('all', (event, path) => {
  console.log(event, path);
});


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

