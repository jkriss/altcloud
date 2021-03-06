const express = require('express')
const winston = require('winston')
const compression = require('compression')
const Path = require('path')

const staticFiles = require('./lib/static')
const frontMatter = require('./lib/front-matter')
const markdown = require('./lib/markdown')
const altFormats = require('./lib/alt-formats')
const layouts = require('./lib/layouts')
const vhosts = require('./lib/vhosts')
const basicAuth = require('./lib/basic-auth')
const cookieParser = require('cookie-parser')
const cookieAuth = require('./lib/cookie-auth')
const tokenAuth = require('./lib/token-auth')
const accessRules = require('./lib/access-rules')
const accessEnforcement = require('./lib/access-enforcement')
const loginForm = require('./lib/login-form')
const sendRenderedFile = require('./lib/send-rendered-file')
const editFiles = require('./lib/edit-files')
const collections = require('./lib/collections')
const signup = require('./lib/signup')
const cron = require('./lib/cron')
const headers = require('./lib/headers')
const helmet = require('helmet')
const rewrite = require('./lib/rewrite')
const { reader } = require('time-streams')

const altcloud = function (options) {
  const app = express()

  const opts = Object.assign({
    root: '.',
    logger: winston
  }, options)

  opts.root = Path.resolve(opts.root)
  opts.logger.level = opts.logLevel

  cron(opts)

  const cookies = cookieAuth(opts)

  app.use(function (req, res, next) {
    opts.logger.info(req.method, req.url)
    next()
  })

  app.use('/', loginForm(opts))
  app.use('/', signup(opts))

  app.use(helmet())
  app.use(basicAuth(opts))
  app.use(cookieParser())
  app.use(cookies.checkCookie)
  app.use(tokenAuth(opts))
  app.use(compression())
  app.use(vhosts(opts))
  app.use(accessRules(opts))
  app.use(rewrite(opts))
  app.use(altFormats(opts))
  app.use(accessEnforcement(opts))
  app.use(headers(opts))
  app.use(frontMatter(opts))
  app.use(markdown(opts))
  app.use(layouts(opts))
  app.use(sendRenderedFile(opts))
  app.use(editFiles(opts))
  app.use(reader(opts.root))
  app.use(staticFiles(opts))
  app.use(collections(opts))

  // error handler
  app.use(function (err, req, res, next) {
    // see if we have a custom error page
    const rules = req.altcloud.fullRules
    if (rules[err.status]) {
      const fileBase = req.altcloud.siteBase ? Path.join(opts.root, req.altcloud.siteBase) : opts.root
      return res.sendFile(Path.join(fileBase, rules[err.status]))
    }
    if (err && req.headers['content-type'] === 'application/json' && err.status) {
      res.status(err.status)
      res.json({ message: err.message })
    } else {
      next()
    }
  })

  return app
}

module.exports = altcloud
