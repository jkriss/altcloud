const Path = require('path')
const express = require('express')
const bodyParser = require('body-parser')
const passwords = require('./passwords')
const cookieAuth = require('./cookie-auth')
const defaultSettings = require('./default-settings')
const debug = require('debug')('altcloud:login-form')

module.exports = function(options) {
  const opts = Object.assign(
    {
      sessionCookieName: defaultSettings.sessionCookieName,
      userInfoCookieName: defaultSettings.userInfoCookieName
    },
    options
  )
  const app = express()

  app.use(
    bodyParser.urlencoded({
      extended: false,
      type: 'application/x-www-form-urlencoded'
    })
  )
  app.use(bodyParser.json({ type: 'application/json' }))
  app.use(bodyParser.text({ type: 'text/plain' }))

  const cookies = cookieAuth(opts)

  app.post('/login', function(req, res) {
    debug('body:', req.body)
    passwords.verify(
      Path.join(opts.root, '.passwords'),
      req.body.username,
      req.body.password,
      function(err, matches) {
        debug('password matches?', matches)
        if (err) {
          console.error('Error while logging in:', err)
          res.sendStatus(500)
        } else if (matches) {
          debug('password valid')
          cookies.setCookie(res, req.body.username)
          req.user = req.body.username
          if (req.get('Content-Type') === 'application/x-www-form-urlencoded') {
            res.redirect(req.body.redirect || '/')
          } else {
            res.sendStatus(200)
          }
        } else {
          debug('password invalid')
          res.sendStatus(401)
        }
      }
    )
  })

  app.get('/logout', function(req, res) {
    res.clearCookie(opts.sessionCookieName)
    res.clearCookie(opts.userInfoCookieName)
    debug(
      'logged out, cleared cookies',
      opts.sessionCookieName,
      opts.userInfoCookieName
    )
    res.redirect(req.query.redirect || '/')
  })

  return app
}
