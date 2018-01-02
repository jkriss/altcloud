const fs = require('fs')
const Path = require('path')
const debug = require('debug')('altcloud:file:read')

module.exports = function (opts, req, cb) {
  if (req.altcloud && req.altcloud.fileContents) {
    cb()
  } else {
    const path = req.altcloud && req.altcloud.actualPath || req.path
    debug('reading file', path)
    fs.readFile(Path.join(opts.root, path), 'utf8', function (err, data) {
      if (err) return cb(err)
      if (!req.altcloud) req.altcloud = {}
      req.altcloud.fileContents = data
      cb()
    })
  }
}
