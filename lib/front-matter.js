const fm = require('front-matter')
const Path = require('path')
const readFile = require('./read-file')
const debug = require('debug')('front-matter')

module.exports = function (opts) {
  return function (req, res, next) {
    if (req.method !== 'GET') return next()
    debug('-- front matter --')
    debug('format:', req.query.format)
    if (req.query.format && req.query.format === 'raw') return next()
    const path = req.altcloud && req.altcloud.actualPath || req.path
    debug('handling path', path)
    if (Path.extname(path).match(/.(md)|(markdown)|(html)/)) {
      readFile(opts, req, function (err) {
        if (err) {
          if (err.code === 'ENOENT') next()
          else next(err)
        } else {
          const content = fm(req.altcloud.fileContents)
          req.altcloud.attributes = content.attributes
          req.altcloud.fileContents = content.body
          debug('front matter attributes:', req.altcloud.attributes)
          debug('altcloud now', req.altcloud)
          next()
        }
      })
    } else {
      next()
    }
  }
}
