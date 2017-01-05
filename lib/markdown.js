var Path = require('path')
var marked = require('marked')
var readFile = require('./read-file')

module.exports = function (opts) {
  return function (req, res, next) {
    if (req.altcloud.actualPath && Path.extname(req.altcloud.actualPath).match(/.(md)|(markdown)/)) {
      readFile(opts, req, function(err) {
        if (err) {
          next(err)
        } else {
          opts.logger.debug(`rendering html from markdown ${req.path}`)
          const html = marked(req.altcloud.fileContents)
          res.send(html)
          // next()
        }
      })
    } else {
      next()
    }
  }
}