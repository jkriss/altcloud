const Handlebars = require('handlebars')
const Path = require('path')
const fs = require('fs')

module.exports = function (opts) {
  return function (req, res, next) {
    opts.logger.debug('-- layout --')
    if (req.altcloud && req.altcloud.attributes && req.altcloud.attributes.layout) {
      const layoutPath = Path.join(opts.root, Path.dirname(req.altcloud.actualPath || req.path), req.altcloud.attributes.layout)
      opts.logger.debug('reading layout from ', layoutPath)
      fs.readFile(layoutPath, 'utf8', function (err, templateString) {
        if (err) return next(err)
        opts.logger.debug(`rendering ${req.path} with layout ${req.altcloud.attributes.layout}`)
        const template = Handlebars.compile(templateString)
        const data = Object.assign({}, req.altcloud.attributes)
        if (req.altcloud.params) data.params = req.altcloud.params
        if (req.user) data.currentUser = req.user
        opts.logger.debug(`rendering with params`, data.params)
        data.content = Handlebars.compile(req.altcloud.fileContents)(data)
        req.altcloud.fileContents = template(data)
        next()
      })
    } else {
      next()
    }
  }
}
