const express = require('express')
const bodyParser = require('body-parser')
const mkdirp = require('mkdirp')
const fs = require('fs')
const Path = require('path')
const debug = require('debug')('altcloud:files:edit')

module.exports = function (opts) {
  const app = express()

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
      debug("!! generated target path:", targetPath)
    }
    debug('writing to', dst, 'full path:', targetPath)

    debug(`making sure dir is present: ${Path.dirname(targetPath)}`)
    mkdirp.sync(Path.dirname(targetPath))
    var ws = fs.createWriteStream(targetPath)
    debug('req body is', req.body)
    ws.write((typeof req.body === 'string' || req.body instanceof Buffer) ? req.body : JSON.stringify(req.body))
    ws.end(function (err) {
      if (err) return next(err)
      res.status(201).send(req.altcloud.fullRules && req.altcloud.fullRules.response || 'Created')
    })
    ws.on('error', function(err) {
      console.warn(err)
      return next(err)
    })
  }

  app.post('*', function (req, res, next) {
    debug('posting file')
    writeFile(req, res, next)
  })

  app.put('*', function (req, res, next) {
    debug('putting file')
    writeFile(req, res, next)
  })

  app.delete('*', function (req, res, next) {
    debug('deleting file')
    fs.unlink(Path.join(opts.root, decodeURIComponent(req.path)), function (err) {
      if (err && err.code !== 'ENOENT') return next(err)
      res.sendStatus(202)
    })
  })

  return app
}
