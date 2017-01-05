var express = require('express')
var winston = require('winston')

var staticFiles = require('./lib/static')
var frontMatter = require('./lib/front-matter')
var markdown = require('./lib/markdown')

const altcloud = function (options) {
  const app = express()

  const opts = Object.assign({
    root: '.',
    logger: winston
  }, options)

  opts.logger.level = opts.logLevel

  app.use(frontMatter(opts))
  app.use(markdown(opts))
  app.use(staticFiles(opts))

  app.get('/hi', function (req, res) {
    res.send('Hello World!')
  })

  return app
}

module.exports = altcloud
