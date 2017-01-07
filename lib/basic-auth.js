const basicAuth = require('basic-auth')
const createError = require('http-errors')
const Path = require('path')
const defaultLogger = require('./default-logger')
const passwords = require('./passwords')

module.exports = function (opts) {
  const logger = defaultLogger(opts)

  return function (req, res, next) {
    logger.debug('-- basic auth --')
    var user = basicAuth(req)
    if (!user) return next()
    logger.debug(`checking password for ${user.name}`)
    passwords.verify(Path.join(opts.root, '.passwords'), user.name, user.pass, function (err, passwordMatches) {
      if (err) {
        next(err)
      } else {
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
