const debug = require('debug')('altcloud:rewrite')

module.exports = function (opts) {
  return function (req, res, next) {
    debug("full rules are", JSON.stringify(req.altcloud.fullRules))
    if (req.altcloud.fullRules && req.altcloud.fullRules.rewrite) {
      debug("url was:", req.url)
      req.url = (req.altcloud.siteBase ? `${req.altcloud.siteBase}/` : '') + req.url.replace(req.path, req.altcloud.fullRules.rewrite)
      debug("url now:", req.url)
      debug("path now:", req.path)
    }
    next()
  }
}
