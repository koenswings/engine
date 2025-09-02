import mDnsSd from 'node-dns-sd'
import { deepPrint, log } from '../utils/utils.js';
import { chalk } from 'zx';
import { Store, getLocalEngine } from '../data/Store.js';
import { manageDiscoveredPeers } from '../data/Network.js'
import ciao from '@homebridge/ciao'
import { Repo } from '@automerge/automerge-repo';
import { IPAddress } from '../data/CommonTypes.js';

export const startAdvertising = (store: Store): void => {
    const engine = getLocalEngine(store)
    if (!engine) {
        log(`No local engine found in the store`)
        throw new Error(`No local engine found in the store`)
    }
    const engineName = engine.hostname
    const engineVersion = engine.version
    const responder = ciao.getResponder()
    let service

    if (engineName) {
        log(`Advertising on all interfaces  `)
        service = responder.createService({
            name: engineName.toString(),
            type: 'engine',
            port: 1234,
            txt: {
                name: engineName,
                id: engine.id,
                version: engineVersion
            }
        })
    } 

    service.advertise().then(() => {
        log(`The following service is published on all interfaces: ${service.name}._engine._tcp.local`);
    })
}

const discoverEngines = (repo:Repo): void => {
    mDnsSd.discover({
        name: '_engine._tcp.local'
    }).then((deviceList) => {
        const discoveredAddresses = new Set<IPAddress>(deviceList.map(device => device.address as IPAddress));
        manageDiscoveredPeers(repo, discoveredAddresses);

        if (deviceList.length === 0) {
            log(chalk.bgBlackBright(`No engines found`))
        } else {
            log(chalk.bgBlackBright(`Discovered engines: ${deepPrint(deviceList, 2)}`))
        }
    }).catch((error) => {
        log(`***node-dns-sd*** Error discovering engines`)
        console.error(error);
    });
}

export const enableMulticastDNSEngineMonitor = (store: Store, repo:Repo): void => {
    startAdvertising(store)
    setInterval(() => discoverEngines(repo), 10000)
    discoverEngines(repo)
}
