const fs = require('fs')
const chokidar = require('chokidar')
const debounce = require('lodash.debounce')

function getHostnames() {
  const files = fs.readdirSync('.')
  const dirs = files.filter(f => fs.lstatSync(f).isDirectory() && !f.startsWith('.'))
  return dirs
}

function watchHostnames(cb) {
  const watcher = chokidar.watch('.', {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true
  })
  function updateDirect() {
    cb(getHostnames())
  }
  const update = debounce(updateDirect, 500)
  watcher.on('addDir', update)
  watcher.on('unlinkDir', update)
  watcher.on('ready', () => console.log("watching for hostname changes"))
}

module.exports = {
  getHostnames,
  watchHostnames
}

if (require.main === module) {
  console.log("known hostnames: ", getHostnames())
  watchHostnames(hostnames => console.log("updated hostnames:", hostnames))
}
