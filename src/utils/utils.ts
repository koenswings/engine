import util from 'util';
import { $, YAML, chalk, fs, question } from 'zx';
import { config, writeConfig } from '../data/Config.js';
import { DiskID, Hostname, IPAddress, NetMask, PortNumber, Timestamp, Version } from '../data/CommonTypes.js';
import { isIP } from 'net';

// Dummy key
export const dummyKey = "_dummy"

export const getKeys = (obj) => {
  return Object.keys(obj).filter(key => !(key === `${dummyKey}`))
}

// Generate a random port number between 49152-65535
export const randomPort = ():PortNumber => {
  return Math.floor(Math.random() * 16383) + 49152 as PortNumber
}



// Read verbosityLevel from the environmnet
const verbosity = process.env.VERBOSITY || ""
export let verbosityLevel = parseInt(verbosity) || 0

//export const log = console.log.bind(console);
export const log = (msg:string, level?:number):void => {
  if (!level) {
    // Set the default log level to 2
    level = 2
  }
  if (verbosityLevel >= level) {
    console.log(chalk.gray(msg))
  }
}

export const setVerbosity = (level:number):void => {
  verbosityLevel = level
}

// // Execute promises sequentially
// export const sequential = (promises) => {
//   return promises.reduce((promise, func) => {
//     return promise.then(func)
//   }, Promise.resolve())
// }

// export const executePromisesSequentially = async (promises) => {
//     for (let promise of promises) {
//       await promise
//     }
// }






// Write a function that uses zx to test if a path exists
// export const dirExists = async (path: string) => {
//     try {
//         await $`test -d ${path}`
//         return true
//     } catch (e) {
//         return false
//     }
// }

// export const dirExists = async (path: string) => {
//   return await $`test -d ${path}`.then(() => true).catch(() => false)
// }

// export const fileExists = async (path: string) => {
//   try {
//       await $`test -f ${path}`
//       return true
//   } catch (e) {
//       return false
//   }
// }

// export const fileExists = async (path: string) => {
//   return await $`test -f ${path}`.then(() => true).catch(() => false)
// }

export const fileExists = (path: string):boolean => {
  return fs.existsSync(path)
}

// Check if the root folder contains the folder yjs-db  If so, set firstBoot to false, otherwise set it to true
// This is a way to check if the engine has been booted before
// export const firstBoot: boolean = fs.existsSync('../yjs-db') ? false : true 
// export const firstBoot: boolean = !(await fileExists('./yjs-db'))
// log(`First boot: ${firstBoot}`)




// Write a function that checks if a given yarray contains a specific value
// Use the Y.Array API of the Yjs library (which does not have a built-in method for this)
// Do it
export const contains = (yarray, value) => {
    let found = false
    yarray.forEach((item) => {
      if (item === value) {
        found = true
      }
    })
    return found
  }

export const deepPrint = (obj, depth:(number | null)=null) => {
    return util.inspect(obj, {showHidden: false, depth: depth, colors: true})
    // Alternative: return JSON.stringify(obj, null, 2)
    // Alternative: return console.dir(obj, {depth: null, colors: true})
}


// Write a function that tests if a string is a valid IP4 address
export const isIP4 = (str: string): boolean => {
  const ip4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
  return ip4Regex.test(str)
}

export const isNetmask = isIP4

// See https://stackoverflow.com/questions/503052/how-to-check-if-ip-is-in-one-of-these-subnets


// const ip2long = (ip) => {
//   var components;
//   if(components = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/))
//   {
//       var iplong = 0;
//       var power  = 1;
//       for(var i=4; i>=1; i-=1)
//       {
//           iplong += power * parseInt(components[i]);
//           power  *= 256;
//       }
//       return iplong;
//   }
//   else return -1;
// };

// THIS FUNCTION IS WRONG
// export const inSubNet = (ip, subnet) => {   
//   var mask, base_ip, long_ip = ip2long(ip);
//   if( (mask = subnet.match(/^(.*?)\/(\d{1,2})$/)) && ((base_ip=ip2long(mask[1])) >= 0) )
//   {
//       var freedom = Math.pow(2, 32 - parseInt(mask[2]));
//       return (long_ip > base_ip) && (long_ip < base_ip + freedom - 1);
//   }
//   else return false;
// }

export const IPnumber = (ip:IPAddress):number => {
//  var ip = IPaddress.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
//  if(ip) {
//      return (+ip[1]<<24) + (+ip[2]<<16) + (+ip[3]<<8) + (+ip[4]);
//  }
  return (+ip[1]<<24) + (+ip[2]<<16) + (+ip[3]<<8) + (+ip[4]);
}

export const isIPAddress = (str: string): str is IPAddress => {
  // return str.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
  // const ipRegex = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/
  return ipRegex.test(str)
}

export const sameNet = (IP1:any, IP2:any, mask:any) => {
  //log(`${IPnumber(IP1) & IPnumber(mask)} == ${IPnumber(IP2) & IPnumber(mask)}`)
  // Check if the IP addresses are strings
  if (isIPAddress(IP1) && isIPAddress(IP2) && isNetmask(mask)) {
    return (IPnumber(IP1) & IPnumber(mask)) == (IPnumber(IP2) & IPnumber(mask))
  } else {
    return false
  }
}

export const findIp = async (address:IPAddress):Promise<IPAddress | undefined> => {
  // Use a shell command to resolve the ip address
  // REmove the trailing \n from the ip address
  try {
    const ip = (await $`ping -c 1 ${address} | grep PING | awk '{print $3}' | tr -d '()'`).stdout.replace(/\n$/, '')
    if (isIPAddress(ip)) {
      return ip
    } else {
      return undefined
    }
  } catch (e) {
    return undefined
  }
}

export const reset = async ($) => {
  console.log(chalk.blue('Resetting the local engine'));
  try {
      console.log(chalk.blue('Removing the yjs database'));
      await $`rm -rf ../yjs-db`;
      console.log(chalk.blue('Removing all appnet ids'))
      if (config.settings.appnets) {
        config.settings.appnets.forEach((appnet) => delete appnet.id)
        console.log(chalk.blue('Updating the config file'));
        writeConfig(config, '../config.yaml')
      }
  } catch (e) {   
      console.log(chalk.red('Failed to sync the engine to the remote machine'));
      console.error(e);
      process.exit(1);
  }
}

export const prompt = (level:number, message: string) => {
  // Create level*4 spaces
  const spaces = ' '.repeat(level * 4)
  console.log(chalk.green(spaces+message))
  return question(chalk.bgMagentaBright(spaces+'Press ENTER when ready'))
}

// Generate a uuid
export const uuid = ():string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export const uuidLight = ():string => {
  return uuid().substring(0, 8)
}
