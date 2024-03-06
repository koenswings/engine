import util from 'util';

export const log = console.log.bind(console);

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

export const deepPrint = (obj, depth=null) => {
    return util.inspect(obj, {showHidden: false, depth: depth, colors: true})
    // Alternative: return JSON.stringify(obj, null, 2)
    // Alternative: return console.dir(obj, {depth: null, colors: true})
}
