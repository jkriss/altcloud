const createError = require('http-errors')
const fs = require('fs')
const Path = require('path')
const jwt = require('jsonwebtoken')
const defaultLogger = require('./default-logger')
const defaultSettings = require('./default-settings')

module.exports = function (options) {
  const opts = Object.assign({
    sessionCookieName: defaultSettings.sessionCookieName
  }, options)

  const logger = defaultLogger(opts)
  let privateKey, publicKey

  try {
    privateKey = fs.readFileSync(Path.join(opts.root, '.keys', 'private.key'))
    publicKey = fs.readFileSync(Path.join(opts.root, '.keys', 'public.pem'))
  } catch (e) {
    console.warn("Couldn't read keys from .keys/", e, e.trace)
  }

  const checkCookie = function (req, res, next) {
    logger.debug('-- cookie auth --')
    if (!req.cookies) return next()
    if (!publicKey) return next()
    const cookie = req.cookies[opts.sessionCookieName]
    logger.debug('cookie:', cookie)
    if (cookie) {
      jwt.verify(cookie, publicKey, { algorithm: 'RS256' }, function (err, token) {
        if (err) {
          logger.debug('token invalid, clearing cookie', opts.sessionCookieName)
          res.clearCookie(opts.sessionCookieName)
        }
        if (token) req.user = token.sub
        next()
      })
    } else {
      next()
    }
  }

  const makeToken = function (username) {
    return jwt.sign({ sub: username }, privateKey, { algorithm: 'RS256' })
  }

  const setCookie = function (res, username) {
    if (!privateKey) throw createError(500, 'Trying to set a cookie, but no private key set')
    var token = makeToken(username)
    res.cookie(opts.sessionCookieName, token, {
      httpOnly: true,
      secure: (process.env.NODE_ENV === 'production'),
      maxAge: 31104000000 // 1 year
    })
  }

  return {
    checkCookie: checkCookie,
    setCookie: setCookie,
    makeToken: makeToken
  }
}
