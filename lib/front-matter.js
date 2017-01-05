var fm = require('front-matter')
var Path = require('path')
var readFile = require('./read-file')

module.exports = function (opts) {
  return function (req, res, next) {
    if (Path.extname(req.path).match(/.(md)|(markdown)|(html)/)) {
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
