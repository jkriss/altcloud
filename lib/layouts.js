const Path = require('path')
const fs = require('fs')
const Liquid = require('liquid-node')
const engine = new Liquid.Engine()
const debug = require('debug')('layouts')

module.exports = function (opts) {
  return function (req, res, next) {
    if (req.method !== 'GET') return next()
    // if the request is for a raw format, don't render layout
    debug('format:', req.query.format)
    if (req.query.format && req.query.format === 'raw') return next()
    if (req.altcloud && req.altcloud.attributes && req.altcloud.attributes.layout) {
      const layoutPath = Path.join(opts.root, Path.dirname(req.altcloud.actualPath || req.path), req.altcloud.attributes.layout)
      debug('reading layout from ', layoutPath)
      fs.readFile(layoutPath, 'utf8', function (err, templateString) {
        if (err) return next(err)
        debug(`rendering ${req.path} with layout ${req.altcloud.attributes.layout}`)
        const data = Object.assign({}, req.altcloud.attributes, { content: req.altcloud.fileContents })
        if (req.altcloud.params) data.params = req.altcloud.params
        if (req.user) data.currentUser = req.user
        (`rendering with params`, data.params)
        engine
          .parse(templateString)
          .then(function (template) { return template.render(data) })
          .then(function (result) {
            req.altcloud.fileContents = result
            next()
          })
      })
    } else {
      next()
    }
  }
}
