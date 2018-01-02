const fs = require('fs')
const Path = require('path')
const debug = require('debug')('altcloud:find-file')
const unique = require('array-unique')

const findFile = function (paths, root, cb) {
  if (!root) root = ''
  if (paths.length === 0) cb(null, null)
  const path = paths.shift()
  const fullPath = Path.join(root, path)
  fs.stat(fullPath, function (err) {
    if (err) {
      if (err.code === 'ENOENT') {
        debug(fullPath, "not found")
        findFile(paths, root, cb)
      } else {
        debug("error:", err)
        cb(err)
      }
    } else {
      debug(fullPath, "found")
      cb(null, path)
    }
  })
}

module.exports = function (paths, root, cb) {
  const uniquePaths = unique(paths)
  debug("checking paths", uniquePaths)
  return findFile(uniquePaths, root, cb)
}
