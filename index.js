const express = require('express')
const winston = require('winston')
const compression = require('compression')

const staticFiles = require('./lib/static')
const frontMatter = require('./lib/front-matter')
const markdown = require('./lib/markdown')
const altFormats = require('./lib/alt-formats')
const layouts = require('./lib/layouts')
const vhosts = require('./lib/vhosts')
const authorization = require('./lib/authorization')

const altcloud = function (options) {
  const app = express()

  const opts = Object.assign({
    root: '.',
    logger: winston
  }, options)

  opts.logger.level = opts.logLevel

  // app.use(authentication())
  app.use(compression())
  app.use(vhosts(opts))
  app.use(staticFiles(opts))
  app.use(altFormats(opts))
  app.use(authorization(opts))
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
