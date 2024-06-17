import { log } from './utils/utils.js'
import { firstBoot } from './y-websocket/yjsUtils.js'

import { startEngine } from "./start.js"
import { chalk } from "zx"

startEngine().then(() => {
    if (firstBoot) {
        log('+++++++++++++++++++++++++++++++++++++')
        log('+ Engine started for the first time +')
        log('+++++++++++++++++++++++++++++++++++++')
    } else {
        log('++++++++++++++++++++++++++++++++++')
        log('+++++++++ Engine started +++++++++')
        log('++++++++++++++++++++++++++++++++++')        
    }

}).catch((error) => {
    log(chalk.red('Error starting engine'))
    console.error(error)
})














