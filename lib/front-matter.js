const fm = require('front-matter')
const Path = require('path')
const readFile = require('./read-file')
const defaultLogger = require('./default-logger')

module.exports = function (opts) {
  const logger = defaultLogger(opts)
  return function (req, res, next) {
    if (req.method !== 'GET') return next()
    logger.debug('-- front matter --')
    logger.debug('format:', req.query.format)
    if (req.query.format && req.query.format === 'raw') return next()
    const path = req.altcloud && req.altcloud.actualPath || req.path
    logger.debug('handling path', path)
    if (Path.extname(path).match(/.(md)|(markdown)|(html)/)) {
      readFile(opts, req, function (err) {
        if (err) {
          if (err.code === 'ENOENT') next()
          else next(err)
        } else {
          // logger.debug('extracting front matter from', req.altcloud.fileContents)
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
