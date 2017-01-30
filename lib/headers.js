module.exports = function (opts) {
  return function (req, res, next) {
    opts.logger.debug("-- headers --")
    if (req.altcloud && req.altcloud.fullRules && req.altcloud.fullRules.headers) {
      Object.keys(req.altcloud.fullRules.headers).forEach(function(headerName) {
        opts.logger.debug("-- setting header", headerName, req.altcloud.fullRules.headers[headerName])
        res.set(headerName, req.altcloud.fullRules.headers[headerName])
      })
    }
    next()
  }
}