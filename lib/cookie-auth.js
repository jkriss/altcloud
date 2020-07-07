const createError = require('http-errors')
const fs = require('fs')
const Path = require('path')
const jwt = require('jsonwebtoken')
const defaultLogger = require('./default-logger')
const defaultSettings = require('./default-settings')
const crypto = require('crypto')

module.exports = function (options) {
  const opts = Object.assign(
    {
      sessionCookieName: defaultSettings.sessionCookieName,
      userInfoCookieName: defaultSettings.userInfoCookieName
    },
    options
  )

  const logger = defaultLogger(opts)
  let privateKey, publicKey

  try {
    privateKey = fs.readFileSync(Path.join(opts.root, '.keys', 'private.key'))
    publicKey = fs.readFileSync(Path.join(opts.root, '.keys', 'public.pem'))
  } catch (e) {
    console.warn("Couldn't read keys from .keys/", e, e.trace)
  }

  const validateToken = function (token, cb) {
    jwt.verify(token, publicKey, { algorithm: 'RS256' }, function (err, t) {
      if (err) {
        console.log('!! bad token:', err)
        return cb()
      }
      cb(null, t)
    })
  }

  const checkCookie = function (req, res, next) {
    logger.debug('-- cookie auth --')
    if (!req.cookies) return next()
    if (!publicKey) return next()
    const cookie = req.cookies[opts.sessionCookieName]
    logger.debug('cookie:', cookie)
    if (cookie) {
      validateToken(cookie, function (err, validToken) {
        if (validToken) {
          req.user = validToken.sub
          logger.debug('set req.user to', req.user)
        } else {
          logger.debug('token invalid, clearing cookie', opts.sessionCookieName)
          res.clearCookie(opts.sessionCookieName)
        }
        next()
      })
    } else {
      next()
    }
  }

  const makeToken = function (username, additionalAttributes) {
    return jwt.sign(
      Object.assign({}, additionalAttributes || {}, { sub: username }),
      privateKey,
      { algorithm: 'RS256' }
    )
  }

  const setCookie = function (res, username) {
    if (!privateKey) {
      throw createError(500, 'Trying to set a cookie, but no private key set')
    }
    var token = makeToken(username)
    // calculate a hash for logging and such
    var shasum = crypto.createHash('sha256')
    shasum.update(username.toLowerCase())
    const usernameHash = shasum.digest('hex').slice(0, 16)
    res.cookie(opts.sessionCookieName, token, {
      httpOnly: true,
      secure: (process.env.NODE_ENV === 'production'),
      maxAge: 31104000000 // 1 year
    })
    res.cookie(opts.userInfoCookieName, JSON.stringify({ username: username, usernameHash: usernameHash }), {
      secure: (process.env.NODE_ENV === 'production'),
      maxAge: 31104000000 // 1 year
    })
    res.cookie(
      opts.userInfoCookieName,
      JSON.stringify({ username: username }),
      {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 31104000000 // 1 year
      }
    )
  }

  return {
    checkCookie: checkCookie,
    setCookie: setCookie,
    makeToken: makeToken,
    validateToken: validateToken
  }
}
