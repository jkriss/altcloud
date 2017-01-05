var Handlebars = require('handlebars')
var Path = require('path')
var fs = require('fs')

module.exports = function (opts) {
  return function (req, res, next) {
    if (req.altcloud && req.altcloud.attributes && req.altcloud.attributes.layout) {
      fs.readFile(Path.join(opts.root, Path.dirname(req.path), req.altcloud.attributes.layout), 'utf8', function(err, templateString) {
        if (err) return next(err)
        opts.logger.debug(`rendering ${req.path} with layout ${req.altcloud.attributes.layout}`)
        const template = Handlebars.compile(templateString)
        const data = Object.assign({}, req.altcloud.attributes, { content : req.altcloud.fileContents })
        req.altcloud.fileContents = template(data)
        next()
      })
    } else {
      next()
    }
  }
}