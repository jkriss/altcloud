const fs = require('fs')
const yaml = require('js-yaml')
const Path = require('path')
const createError = require('http-errors')
const hash = require('./hash')

const readTokens = function(path, cb) {
  fs.readFile(path, 'utf8', function(err, data) {
    if (err) {
      if (err.code === 'ENOENT') {
        cb(null, {})
      } else {
        cb(err)
      }
    } else {
      cb(null, yaml.safeLoad(data))
    }
  })
}

module.exports = function(opts) {
  return function(req, res, next) {
    if (!req.query.token) return next()

    // load token file
    readTokens(Path.join(opts.root, '.tokens'), function(err, tokens) {
      if (err) {
        next(err)
      } else {
        const user = tokens[hash(req.query.token)]
        if (user) {
          req.user = user.toString()
          next()
        } else {
          next(createError(401))
        }
      }
    })
  }
}
