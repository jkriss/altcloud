const Path = require('path')
const fs = require('fs')
const Liquid = require('liquid-node')
const engine = new Liquid.Engine()
const fm = require('front-matter')

module.exports = function (opts) {
  return function (req, res, next) {
    if (req.method !== 'GET') return next()
    opts.logger.debug('-- layout --')
    // if the request is for a raw format, don't render layout
    opts.logger.debug('format:', req.query.format)
    if (req.query.format && req.query.format === 'raw') return next()
    if (req.altcloud && req.altcloud.attributes && req.altcloud.attributes.layout) {
      const layoutPath = Path.join(opts.root, Path.dirname(req.altcloud.actualPath || req.path), req.altcloud.attributes.layout)
      opts.logger.debug('reading layout from ', layoutPath)
      fs.readFile(layoutPath, 'utf8', function (err, templateString) {
        const templateContent = fm(templateString)
        if (err) return next(err)
        opts.logger.debug(`rendering ${req.path} with layout ${req.altcloud.attributes.layout}`)
        const data = Object.assign({}, templateContent.attributes, req.altcloud.attributes, { content: req.altcloud.fileContents })
        if (req.altcloud.params) data.params = req.altcloud.params
        if (req.user) data.currentUser = req.user
        opts.logger.debug(`rendering with params`, data.params)
        engine
          .parse(templateContent.body)
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
