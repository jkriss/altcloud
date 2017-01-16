const Path = require('path')
const express = require('express')
const defaultLogger = require('./default-logger')
const passwords = require('./passwords')

module.exports = function (opts) {
  const logger = defaultLogger(opts)
  const app = express()

  app.get('/users.json', function (req, res, next) {
    passwords.load(Path.join(opts.root, '.passwords'), function(err, passwords) {
      if (err) return next(err)
      if (!req.altcloud) req.altcloud = {}
      req.altcloud.fileContents = Object.keys(passwords)
      req.altcloud.hiddenByDefault = true
      next()
    })
  })

  return app
}
