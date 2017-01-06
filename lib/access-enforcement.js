const defaultLogger = require('./default-logger')
const createError = require('http-errors')

module.exports = function (opts) {
  const logger = defaultLogger(opts)

  return function (req, res, next) {
    logger.debug('-- access enforcement --')
    const user = req.user
    let rules = req.altcloud && req.altcloud.rules
    if (rules && !Array.isArray(rules)) rules = [rules]

    logger.debug(`user ${user}, rules`, rules)
    // "all" allows everybody, authed or not
    if (rules && rules.indexOf('all') !== -1) return next()
    // if no rules, allow read, nothing else
    if (!rules && (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS')) return next()
    // can view if on the list
    if (user && rules && rules.indexOf(user) !== -1) return next()
    else return next(createError(404))
  }
}
