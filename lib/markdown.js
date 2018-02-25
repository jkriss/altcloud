const Path = require('path')
const marked = require('marked')
const readFile = require('./read-file')
const debug = require('debug')('altcloud:markdown')

module.exports = function(opts) {
  return function(req, res, next) {
    if (req.method !== 'GET') return next()
    if (
      req.altcloud &&
      req.altcloud.actualPath &&
      Path.extname(req.altcloud.actualPath).match(/.(md)|(markdown)/)
    ) {
      readFile(opts, req, function(err) {
        if (err) {
          next(err)
        } else {
          debug(`rendering html from markdown ${req.path}`)
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
