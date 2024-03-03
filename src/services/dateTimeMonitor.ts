
export const enableDateTimeMonitor = () => {
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
}