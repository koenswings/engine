import { log } from './utils/utils.js'
import { startEngine } from "./start.js"
import { chalk } from "zx"

startEngine().then(() => {
    log('++++++++++++++++++++++++++++++++++')
    log('+++++++++ Engine started +++++++++')
    log('++++++++++++++++++++++++++++++++++')
}).catch((error) => {
    log(chalk.red('Error starting engine'))
    console.error(error)
})














