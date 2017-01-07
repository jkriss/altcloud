const express = require('express')
const winston = require('winston')
const compression = require('compression')
const cors = require('cors')

const staticFiles = require('./lib/static')
const frontMatter = require('./lib/front-matter')
const markdown = require('./lib/markdown')
const altFormats = require('./lib/alt-formats')
const layouts = require('./lib/layouts')
const vhosts = require('./lib/vhosts')
const basicAuth = require('./lib/basic-auth')
const cookieParser = require('cookie-parser')
const cookieAuth = require('./lib/cookie-auth')
const accessRules = require('./lib/access-rules')
const accessEnforcement = require('./lib/access-enforcement')
const loginForm = require('./lib/login-form')

const altcloud = function (options) {
  const app = express()

  const opts = Object.assign({
    root: '.',
    logger: winston
  }, options)

  opts.logger.level = opts.logLevel

  const cookies = cookieAuth(opts)

  app.use('/', loginForm(opts))

  app.use(cors())
  app.use(basicAuth(opts))
  app.use(cookieParser())
  app.use(cookies.checkCookie)
  app.use(compression())
  app.use(vhosts(opts))
  app.use(altFormats(opts))
  app.use(accessRules(opts))
  app.use(accessEnforcement(opts))
  app.use(staticFiles(opts))
  app.use(frontMatter(opts))
  app.use(markdown(opts))
  app.use(layouts(opts))

  // send file contents if set
  app.use(function (req, res, next) {
    if (req.altcloud && req.altcloud.fileContents) {
      res.send(req.altcloud.fileContents)
    } else {
      next()
    }
  })

  return app
}

module.exports = altcloud
