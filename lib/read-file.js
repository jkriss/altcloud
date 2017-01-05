const fs = require('fs')
const Path = require('path')
const defaultLogger = require('./default-logger')

module.exports = function (opts, req, cb) {
  const logger = defaultLogger(opts)
  if (req.altcloud && req.altcloud.fileContents) {
    cb()
  } else {
    const path = req.altcloud && req.altcloud.actualPath || req.path
    logger.debug('reading file', path)
    fs.readFile(Path.join(opts.root, path), 'utf-8', function (err, data) {
      if (err) return cb(err)
      if (!req.altcloud) req.altcloud = {}
      req.altcloud.fileContents = data
      cb()
    })
  }
}
