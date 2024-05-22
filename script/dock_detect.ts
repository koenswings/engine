import { $, echo, ssh, argv, cd, chalk, fs, question } from 'zx'
import pack from '../package.json' assert { type: "json" }

const p = $`dmesg -wH | grep --line-buffered "Attached SCSI disk"`
for await (const chunk of p.stdout) {
  echo(chunk)
}

console.log("Done")
