import { log } from './utils/utils.js'
import { firstBoot } from './y-websocket/yjsUtils.js'

import { startEngine } from "./start.js"
import { chalk } from "zx"

startEngine().then(() => {
    if (firstBoot) {
        log('+++++++++++++++++++++++++++++++++++++', 1)
        log('+ Engine started for the first time +', 1)
        log('+++++++++++++++++++++++++++++++++++++', 1)
    } else {
        log('++++++++++++++++++++++++++++++++++', 1)
        log('+++++++++ Engine started +++++++++', 1)
        log('++++++++++++++++++++++++++++++++++', 1)        
    }

}).catch((error) => {
    log(chalk.red('Error starting engine'))
    console.error(error)
})














