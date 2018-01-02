const debug = require('debug')('altcloud:send-rendered-file')

module.exports = function (opts) {
  return function (req, res, next) {
    if (req.method !== 'GET') return next()
    if (req.altcloud && req.altcloud.fileContents) {
      debug('sending rendering file')
      res.send(req.altcloud.fileContents)
    } else {
      next()
    }
  }
}
