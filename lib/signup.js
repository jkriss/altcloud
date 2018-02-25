const express = require('express')
const bodyParser = require('body-parser')
const createError = require('http-errors')
const yaml = require('js-yaml')
const Path = require('path')
const fs = require('fs')
const passwords = require('./passwords')
const cookieAuth = require('./cookie-auth')

const loadInvitations = function(path, cb) {
  fs.readFile(path, 'utf8', function(err, data) {
    if (err) return cb(err)
    cb(null, yaml.safeLoad(data))
  })
}

const deleteToken = function(invitations, path, token, cb) {
  delete invitations[token]

  fs.writeFile(
    path,
    Object.keys(invitations).length === 0 ? '' : yaml.safeDump(invitations),
    cb
  )
}

module.exports = function(opts) {
  const app = express()

  const invitationsPath = Path.join(opts.root, '.invitations')
  const cookies = cookieAuth(opts)

  app.use(
    bodyParser.urlencoded({
      extended: false,
      type: 'application/x-www-form-urlencoded'
    })
  )
  app.use(bodyParser.json({ type: 'application/json' }))
  app.use(bodyParser.text({ type: 'text/plain' }))

  const checkToken = function(req, res, next) {
    if (req.body.token && req.body.username && req.body.password) {
      loadInvitations(invitationsPath, function(err, invitations) {
        if (!req.altcloud) req.altcloud = {}
        req.altcloud.invitations = invitations
        if (err) return next(err)
        if (!invitations)
          return next(createError(401, 'Signup token not valid'))
        const invitation = invitations[req.body.token]
        if (!invitation) {
          next(createError(401))
        } else if (invitation.expires < new Date().getTime()) {
          deleteToken(invitations, invitationsPath, req.body.token, function(
            err
          ) {
            if (err) return next(err)
            next(createError(401))
          })
        } else {
          next()
        }
      })
    } else {
      next(createError(401))
    }
  }

  const createUser = function(req, res, next) {
    if (req.body.username && req.body.password) {
      passwords.add(
        Path.join(opts.root, '.passwords'),
        req.body.username,
        req.body.password,
        function(err) {
          if (err) return next(createError(400, err))
          // we're good, but delete it so it can't be used again
          req.user = req.body.username
          cookies.setCookie(res, req.body.username)
          deleteToken(
            req.altcloud.invitations,
            invitationsPath,
            req.body.token,
            function(err) {
              next(err)
            }
          )
        }
      )
    } else {
      next()
    }
  }

  app.post('/signup', checkToken, createUser, function(req, res, next) {
    res.sendStatus(200)
  })

  return app
}
