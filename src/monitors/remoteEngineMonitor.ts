import ciao from '@homebridge/ciao'
import { addRemoteEngine, getEngine, getNetwork } from '../data/store.js';
import { engineMonitor } from './mdnsMonitor.js';
import { log } from '../utils/utils.js';
import { chalk } from 'zx';

export const enableEngineMonitor = (ifaceName: string, networkName: string) => {
    log(`Monitoring interface ${ifaceName} for other engines that are on network ${networkName}`)

    // Advertise the local engine on the network using mdns using the following service name: engineName._engine._tcp
    const engine = getEngine()
    const engineName = engine.hostName
    const engineVersion = engine.version
    const network = getNetwork(networkName)

    // ********* MDNS Advertisement (error) *********
    // const txtRecord = {
    //     name: engineName,
    //     version: engineVersion,
    //     network: networkName
    // }
    // // const ad = mdns.createAdvertisement(mdns.tcp('engine'), 1234, { txtRecord: txtRecord})
    // const service = mdns.tcp('engine')
    // log(`Service: ${service}`)
    // const ad = mdns.createAdvertisement(service, 1234)
    // ad.start()
    // log(`Engine ${engineName} advertised on network ${networkName}`)
    // ********* MDNS Advertisement (error) *********

    // ********* Ciao Advertisement *********
    const responder = ciao.getResponder();

    // create a service defining a web server running on port 3000
    const service = responder.createService({
        name: engineName,
        type: 'engine',
        port: 1234, // optional, can also be set via updatePort() before advertising
        txt: {
                name: engineName,
                version: engineVersion,
                network: networkName
            }
    })

    service.advertise().then(() => {
        // stuff you do when the service is published
        console.log("Service is published :)");
    });

    // Register a callback on the mdnsMonitor for new engines on this interface and network
    engineMonitor.on(`new_engine_on_${networkName}_on_${ifaceName}`, (device) => {
        log(chalk.bgMagenta(`Engine ${device.familyName} discovered on the network`))
        const network = getNetwork(networkName)
        if (network) {
            addRemoteEngine(network, device, ifaceName)
        }
    })

}

export const disableEngineMonitor = (ifaceName: string, networkName: string) => {
}
