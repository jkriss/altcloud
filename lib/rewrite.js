const defaultLogger = require('./default-logger')

module.exports = function (opts) {
  const logger = defaultLogger(opts)
  return function (req, res, next) {
    logger.debug('-- rewrite --')
    logger.debug('full rules are', JSON.stringify(req.altcloud.fullRules))
    if (req.altcloud.fullRules && req.altcloud.fullRules.rewrite) {
      logger.debug('url was:', req.url)
      req.url = (req.altcloud.siteBase ? `${req.altcloud.siteBase}/` : '') + req.url.replace(req.path, req.altcloud.fullRules.rewrite)
      logger.debug('url now:', req.url)
      logger.debug('path now:', req.path)
    }
    next()
  }
}
