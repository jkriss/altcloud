const express = require('express')
const bodyParser = require('body-parser')
const defaultLogger = require('./default-logger')
const mkdirp = require('mkdirp')
const fs = require('fs')
const Path = require('path')

module.exports = function (opts) {
  const logger = defaultLogger(opts)
  const app = express()

  app.use(bodyParser.raw())
  app.use(bodyParser.urlencoded({ extended: false, type: 'application/x-www-form-urlencoded' }))
  app.use(bodyParser.text({ type: 'application/json' }))
  app.use(bodyParser.text({ type: 'text/plain' }))

  const writeFile = function (req, res, next) {
    const dst = decodeURIComponent(req.path)
    const fullPath = Path.join(opts.root, dst)
    logger.debug('writing to', dst, 'full path:', fullPath)

    logger.debug(`making sure dir is present: ${Path.dirname(fullPath)}`)
    mkdirp.sync(Path.dirname(fullPath))
    var ws = fs.createWriteStream(fullPath)
    console.log('req body is', req.body)
    ws.write(req.body)
    ws.end(function (err) {
      if (err) return next(err)
      res.sendStatus(201)
    })
  }

  app.post('*', function (req, res, next) {
    writeFile(req, res, next)
  })

  app.put('*', function (req, res, next) {
    writeFile(req, res, next)
  })

  app.delete('*', function (req, res, next) {
    fs.unlink(Path.join(opts.root, decodeURIComponent(req.path)), function (err) {
      if (err && err.code !== 'ENOENT') return next(err)
      res.sendStatus(202)
    })
  })

  return app
}
