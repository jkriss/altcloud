const bcrypt = require('bcryptjs')
const basicAuth = require('basic-auth')
const createError = require('http-errors')
const fs = require('fs')
const Path = require('path')
const yaml = require('js-yaml')
const defaultLogger = require('./default-logger')

module.exports = function (opts) {
  const logger = defaultLogger(opts)
  const loadPasswords = function (cb) {
    fs.readFile(Path.join(opts.root, '.passwords'), function (err, data) {
      if (err) {
        if (err.code === 'ENOENT') return cb(null, {})
        else cb(err)
      } else {
        cb(null, yaml.safeLoad(data))
      }
    })
  }
  return function (req, res, next) {
    logger.debug("-- authenticate --")
    logger.debug(req.headers)
    var user = basicAuth(req)
    if (!user) return next()
    logger.debug(`checking password for ${user.name}`)
    loadPasswords(function (err, passwords) {
      if (err) {
        next(err)
      } else {
        const passwordMatches = bcrypt.compareSync(user.pass, passwords[user.name])
        logger.debug(`valid password for ${user.name}? ${passwordMatches}`)
        if (passwordMatches) {
          req.user = user.name
          next()
        } else {
          next(createError(401))
        }
      }
    })
  }
}
