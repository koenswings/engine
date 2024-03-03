import net_listner from 'network-interfaces-listener'
import os from 'os'

export const enableNetworkInterfaceMonitor = () => {
    // Get a list of all non-virtual interface names
    const nonVirtualInterfaces = Object.keys(os.networkInterfaces()).filter(name => !name.startsWith('v'))
    console.log(`Non-virtual interfaces: ${nonVirtualInterfaces}`)

    // Monitor the non-virtual interfaces for changes
    function onNetworkInterfaceChange(data) {
        console.log(`New data for interface ${data.name}: ${JSON.stringify(data)}`);
    }
    // Call net_listner.addNetInterfaceListener for each non-virtual interface and add the listener
    nonVirtualInterfaces.forEach((interfaceName) => {
        net_listner.addNetInterfaceListener(interfaceName, onNetworkInterfaceChange)
    })

}

