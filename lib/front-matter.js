const fm = require('front-matter')
const Path = require('path')
const readFile = require('./read-file')

module.exports = function (opts) {
  return function (req, res, next) {
    const path = req.altcloud && req.altcloud.actualPath || req.path
    if (Path.extname(path).match(/.(md)|(markdown)|(html)/)) {
      readFile(opts, req, function(err) {
        if (err) {
          next(err)
        } else {
          const content = fm(req.altcloud.fileContents)
          req.altcloud.attributes = content.attributes
          req.altcloud.fileContents = content.body
          opts.logger.debug('front matter attributes:', req.altcloud.attributes)
          next()
        }
      })
    } else {
      next()
    }
  }
}
