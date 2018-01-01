const Handlebars = require('handlebars')

module.exports = function (opts) {
  return function (req, res, next) {
    opts.logger.debug("-- write path --")
    if (req.altcloud.fullRules.writePath) {
      try {
        // TODO could cache this if source is the same
        req.altcloud.targetPathTemplate = Handlebars.compile(req.altcloud.fullRules.writePath)
      } catch (err) {
        opts.logger.debug("Error generating write path:", err)
        return next(err)
      }
    }
    next()
  }
}
