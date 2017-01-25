const express = require('express')
const bodyParser = require('body-parser')
const createError = require('http-errors')
const yaml = require('js-yaml')
const Path = require('path')
const fs = require('fs')
const passwords = require('./passwords')

const loadInvitations = function (path, cb) {
  fs.readFile(path, 'utf8', function (err, data) {
    if (err) return cb(err)
    cb(null, yaml.safeLoad(data))
  })
}

module.exports = function (opts) {
  const app = express()

  app.use(bodyParser.urlencoded({ extended: false, type: 'application/x-www-form-urlencoded' }))
  app.use(bodyParser.json({ type: 'application/json' }))
  app.use(bodyParser.text({ type: 'text/plain' }))

  const checkToken = function (req, res, next) {
    if (req.body.token) {
      const invitationsPath = Path.join(opts.root, '.invitations')

      loadInvitations(invitationsPath, function (err, invitations) {
        if (err) return next(err)
        console.log('loaded invitations:', invitations)
        const invitation = invitations[req.body.token]
        console.log('invitation token:', req.body.token)
        if (!invitation) {
          next(createError(401))
        } else if (invitation.expires < new Date().getTime()) {
          next(createError(401))
        } else {
          // we're good, but delete it so it can't be used again
          delete invitations[req.body.token]
          fs.writeFile(invitationsPath, yaml.safeDump(invitations), function (err) {
            next(err)
          })
        }
      })
    } else {
      next(createError(401))
    }
  }

  const createUser = function (req, res, next) {
    if (req.body.username && req.body.password) {
      passwords.add(Path.join(opts.root, '.passwords'), req.body.username, req.body.password, function (err) {
        if (err) return next(err)
        req.user = req.body.username
        next()
      })
    } else {
      next()
    }
  }

  app.post('/signup', checkToken, createUser, function (req, res, next) {
    next()
  })

  return app
}
