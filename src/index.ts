import { usb, getDeviceList } from 'usb';
const devices: usb.Device[] = getDeviceList();

for (const device of devices) {
    console.log(device); // Legacy device
}

usb.on('attach', function(device) { console.log(device); });
usb.on('detach', function(device) { console.log(device); });

// Your task is to convert the above code to TypeScript.



// Write a simple Nodejs program that displays the current date and time every 5 seconds using the setInterval function
// The output should look like this:
// Current Date and Time: 2021-05-24T12:00:00
// Current Date and Time: 2021-05-24T12:00:05
// Current Date and Time: 2021-05-24T12:00:10
// Current Date and Time: 2021-05-24T12:00:15
// ...
// Do it
const displayDateAndTime = () => {
  console.log(`Current Time: ${new Date()}`);
}

setInterval(displayDateAndTime, 5000);

