const Path = require('path')
const marked = require('marked')
const readFile = require('./read-file')

module.exports = function (opts) {
  return function (req, res, next) {
    if (req.altcloud && req.altcloud.actualPath && Path.extname(req.altcloud.actualPath).match(/.(md)|(markdown)/)) {
      readFile(opts, req, function (err) {
        if (err) {
          next(err)
        } else {
          opts.logger.debug(`rendering html from markdown ${req.path}`)
          const html = marked(req.altcloud.fileContents)
          req.altcloud.fileContents = html
          next()
        }
      })
    } else {
      next()
    }
  }
}
