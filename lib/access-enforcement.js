const defaultLogger = require('./default-logger')
const createError = require('http-errors')

module.exports = function (opts) {
  const logger = defaultLogger(opts)

  return function (req, res, next) {
    logger.debug('-- access enforcement --')
    const user = req.user
    const rules = req.altcloud && req.altcloud.rules
    logger.debug(`user ${user}, rules ${rules}`)
    if (!user && rules && rules !== 'all') return next(createError(404))
    else next()
  }
}
