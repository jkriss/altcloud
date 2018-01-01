const express = require('express')
const bodyParser = require('body-parser')
const defaultLogger = require('./default-logger')
const mkdirp = require('mkdirp')
const fs = require('fs')
const Path = require('path')

module.exports = function (opts) {
  const logger = defaultLogger(opts)
  const app = express()

  app.use(function (req, res, next) {
    opts.logger.debug('-- edit files --')
    next()
  })

  app.use(bodyParser.raw({
    type: function(req) {
      const t = req.headers['content-type']
      return !t.includes('text') && !t.includes('json') && !t.includes('form')
    },
    limit: '10mb'
  }))
  app.use(bodyParser.urlencoded({ extended: false, type: 'application/x-www-form-urlencoded' }))
  app.use(bodyParser.text({ type: 'application/json' }))
  app.use(bodyParser.text({ type: 'text/plain' }))

  const writeFile = function (req, res, next) {
    const dst = decodeURIComponent(req.path)
    const fullPath = Path.join(opts.root, dst)
    let targetPath = fullPath
    const jsonBody = req.body && typeof req.body === 'object' ? req.body : null
    if (jsonBody && req.altcloud.targetPathTemplate) {
      targetPath = req.altcloud.targetPathTemplate(jsonBody)
      targetPath = Path.join(opts.root, req.altcloud.siteBase, targetPath)
      logger.debug("!! generated target path:", targetPath)
    }
    logger.debug('writing to', dst, 'full path:', targetPath)

    logger.debug(`making sure dir is present: ${Path.dirname(targetPath)}`)
    mkdirp.sync(Path.dirname(targetPath))
    var ws = fs.createWriteStream(targetPath)
    logger.debug('req body is', req.body)
    ws.write((typeof req.body === 'string' || req.body instanceof Buffer) ? req.body : JSON.stringify(req.body))
    ws.end(function (err) {
      if (err) return next(err)
      res.status(201).send(req.altcloud.fullRules && req.altcloud.fullRules.response || 'Created')
    })
    ws.on('error', function(err) {
      logger.warn(err)
      return next(err)
    })
  }

  app.post('*', function (req, res, next) {
    logger.debug('-- posting file --')
    writeFile(req, res, next)
  })

  app.put('*', function (req, res, next) {
    logger.debug('-- putting file --')
    writeFile(req, res, next)
  })

  app.delete('*', function (req, res, next) {
    logger.debug('-- deleting file --')
    fs.unlink(Path.join(opts.root, decodeURIComponent(req.path)), function (err) {
      if (err && err.code !== 'ENOENT') return next(err)
      res.sendStatus(202)
    })
  })

  return app
}
