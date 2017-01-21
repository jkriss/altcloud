const fs = require('fs')
const Path = require('path')
const yaml = require('js-yaml')

module.exports = function (opts) {
  return function (req, res, next) {
    const path = Path.join(opts.root, '.config')
    fs.readFile(path, function (err, data) {
      if (err) {
        if (err.code === 'ENOENT') next()
        else next(err)
      } else {
        if (!req.altcloud) req.altcloud = {}
        req.altcloud.config = yaml.safeLoad(data)
        next()
      }
    })
  }
}
