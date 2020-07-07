const express = require('express')
const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const OAuth2Strategy = require('passport-oauth2')
const defaultLogger = require('./default-logger')
const cookieAuth = require('./cookie-auth')
const cookieParser = require('cookie-parser')
const fetch = require('node-fetch')

class ExtendedOAuth2Strategy extends OAuth2Strategy {
  constructor (opts, verify) {
    super(opts, verify)
    if (opts.prompt) this.prompt = opts.prompt
  }
  authorizationParams () {
    if (this.prompt) return { prompt: this.prompt }
    else return {}
  }
}

module.exports = function (opts) {
  const logger = defaultLogger(opts)
  const app = express()

  const cookies = cookieAuth(opts)

  passport.serializeUser(function (username, done) {
    done(null, username)
  })

  passport.deserializeUser(function (username, done) {
    done(null, username)
  })

  if (opts.config && opts.config.authentication) {
    app.use(passport.initialize())
    app.use(cookieParser())

    const host = opts.config.authentication.host
    const strategies = opts.config.authentication.adapters
    const strategyNames = Object.keys(strategies)
    logger.info('setting up passport authentication for:', strategyNames.join(', '), 'on host', host)
    strategyNames.forEach(function (strategyName) {
      if (strategyName === 'google') {
        passport.use(new GoogleStrategy({
          clientID: strategies.google.clientId,
          clientSecret: strategies.google.clientSecret,
          callbackURL: `http${opts.ssl ? 's' : ''}://${host}/auth/google/callback`
        },
        function (accessToken, refreshToken, profile, cb) {
          logger.debug('google profile:', profile)
          const email = profile.emails.find(function (e) { return e.type === 'account' }).value
          return cb(null, email)
        }))
      } else if (strategyName === 'oauth') {
        var strategy = new ExtendedOAuth2Strategy({
          authorizationURL: strategies.oauth.authorizationURL,
          tokenURL: strategies.oauth.tokenURL,
          clientID: strategies.oauth.clientID,
          prompt: strategies.oauth.prompt,
          clientSecret: strategies.oauth.clientSecret,
          callbackURL: `http${opts.ssl ? 's' : ''}://${host}/auth/oauth/callback`
        }, function (accessToken, refreshToken, profile, cb) {
          logger.warn('oauth profile:', profile)
          logger.warn('access token?', accessToken)
          const email = profile.email
          return cb(null, email)
        })
        strategy.userProfile = function (accessToken, cb) {
          fetch(strategies.oauth.profileURL + '&access_token=' + accessToken)
            .then(function (res) { return res.json() })
            .then(function (json) { cb(null, json) })
        }
        passport.use(strategy)
      } else {
        logger.warn(`strategy ${strategyName} specified, but no adapter available`)
      }
    })

    app.get('/auth/oauth',
      function (req, res, next) {
        res.cookie('redir', req.query.redirect || req.headers.referer)
        next()
      },
      passport.authenticate('oauth2'))

    app.get('/auth/oauth/callback',
      passport.authenticate('oauth2', { failureRedirect: '/' }),
      function (req, res) {
        logger.info('passport auth succeeded!')
        logger.info('user:', req.user)
        res.clearCookie('redir')
        cookies.setCookie(res, req.user)
        res.redirect(req.cookies['redir'] || '/')
      })

    app.get('/auth/google',
      function (req, res, next) {
        res.cookie('redir', req.query.redirect || req.headers.referer)
        next()
      },
      passport.authenticate('google', { scope: ['email'] }))

    app.get('/auth/google/callback',
      passport.authenticate('google', { failureRedirect: '/' }),
      function (req, res) {
        logger.info('passport auth succeeded!')
        logger.info('user:', req.user)
        res.clearCookie('redir')
        cookies.setCookie(res, req.user)
        res.redirect(req.cookies['redir'] || '/')
      })
  }

  return app
}
