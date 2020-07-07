const Path = require('path')
const express = require('express')
const cookieAuth = require('./cookie-auth')
const defaultLogger = require('./default-logger')
const defaultSettings = require('./default-settings')

module.exports = function (options) {
  const logger = defaultLogger(options)
  const app = express()

  const cookies = cookieAuth(options)
  
  app.get('/auth/link', function (req, res) {
    console.log("-- logging in with link")
    const token = req.query.token
    console.log("token is", token)
    if (token) {
      cookies.validateToken(token, function(err, validToken) {
        if (validToken) {
          logger.info('valid token in link, setting session cookie for', validToken.sub)
          cookies.setCookie(res, validToken.sub)
        } else {
          logger.info('token in link not valid, ignoring')
        }
        res.redirect(req.query.redirect || '/')  
      })
    } else {
      logger.info('No token present in query string, redirecting')
      res.redirect(req.query.redirect || '/')
    }
  })

  return app
}
