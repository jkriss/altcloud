const debug = require('debug')('headers')

module.exports = function (opts) {
  return function (req, res, next) {
    if (req.altcloud && req.altcloud.fullRules && req.altcloud.fullRules.headers) {
      Object.keys(req.altcloud.fullRules.headers).forEach(function(headerName) {
        debug("setting header", headerName, req.altcloud.fullRules.headers[headerName])
        res.set(headerName, req.altcloud.fullRules.headers[headerName])
      })
    }
    next()
  }
}
