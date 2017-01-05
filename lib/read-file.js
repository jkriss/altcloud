var fs = require('fs')
var Path = require('path')

module.exports = function (opts, req, cb) {
  if (req.altcloud && req.altcloud.fileContents) {
    cb()
  } else {
    opts.logger.debug('reading file', req.path)
    fs.readFile(Path.join(opts.root, req.path), 'utf-8', function(err, data) {
      if (err) return cb(err)
      if (!req.altcloud) req.altcloud = {}
      req.altcloud.fileContents = data
      cb()
    })
  }
}