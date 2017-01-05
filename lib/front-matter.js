const fm = require('front-matter')
const Path = require('path')
const readFile = require('./read-file')
const defaultLogger = require('./default-logger')

module.exports = function (opts) {
  const logger = defaultLogger(opts)
  return function (req, res, next) {
    const path = req.altcloud && req.altcloud.actualPath || req.path
    if (Path.extname(path).match(/.(md)|(markdown)|(html)/)) {
      readFile(opts, req, function (err) {
        if (err) {
          next(err)
        } else {
          const content = fm(req.altcloud.fileContents)
          req.altcloud.attributes = content.attributes
          req.altcloud.fileContents = content.body
          logger.debug('front matter attributes:', req.altcloud.attributes)
          logger.debug('altcloud now', req.altcloud)
          next()
        }
      })
    } else {
      next()
    }
  }
}
