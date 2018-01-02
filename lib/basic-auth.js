const basicAuth = require('basic-auth')
const createError = require('http-errors')
const Path = require('path')
const passwords = require('./passwords')
const debug = require('debug')('auth:basic')

module.exports = function (opts) {
  return function (req, res, next) {
    debug('-- basic auth --')
    var user = basicAuth(req)
    if (!user) return next()
    debug(`checking password for ${user.name}`)
    passwords.verify(Path.join(opts.root, '.passwords'), user.name, user.pass, function (err, passwordMatches) {
      if (err) {
        next(err)
      } else {
        debug(`valid password for ${user.name}? ${passwordMatches}`)
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
