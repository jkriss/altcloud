const Path = require('path')
const express = require('express')
const bodyParser = require('body-parser')
const passwords = require('./passwords')
const cookieAuth = require('./cookie-auth')
const defaultLogger = require('./default-logger')

module.exports = function (opts) {
  const logger = defaultLogger(opts)
  const app = express()

  app.use(bodyParser.urlencoded({ extended: false, type: 'application/x-www-form-urlencoded' }))
  app.use(bodyParser.json({ type: 'application/json' }))
  app.use(bodyParser.text({ type: 'text/plain' }))

  const cookies = cookieAuth(opts)

  app.post('/login', function (req, res) {
    logger.debug('-- login form /login --')
    logger.debug('body:', req.body)
    passwords.verify(Path.join(opts.root, '.passwords'), req.body.username, req.body.password, function (err, matches) {
      logger.debug('password matches?', matches)
      if (err) {
        logger.error('Error while logging in:', err)
        res.sendStatus(500)
      } else if (matches) {
        logger.debug('password valid')
        cookies.setCookie(res, req.body.username)
        req.user = req.body.username
        res.sendStatus(200)
      } else {
        logger.debug('password invalid')
        res.sendStatus(401)
      }
    })
  })

  return app
}
