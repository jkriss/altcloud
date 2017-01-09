const defaultLogger = require('./default-logger')
const createError = require('http-errors')
const Path = require('path')

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
    // if no rules, assume special files are hidden
    if (!rules && ['.access', '.passwords'].indexOf(Path.basename(req.path)) !== -1) return next(createError(404))
    // otherwise, if no rules, allow read, nothing else
    if (!rules && (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS')) return next()
    // can view if on the list
    if (user && rules && rules.indexOf(user) !== -1) return next()
    // can view if authenticated and 'authenticated' is a rule
    if (user && rules && rules.indexOf('authenticated') !== -1) return next()
    else return next(createError(404))
  }
}
