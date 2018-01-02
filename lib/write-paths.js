const Handlebars = require('handlebars')
const slug = require('slug')
const debug = require('debug')('altcloud:write-paths')

Handlebars.registerHelper('getTimeMs', function() {
  return Date.now();
});

Handlebars.registerHelper('getTimestamp', function() {
  return new Date().toISOString();
});

Handlebars.registerHelper('slug', function(input, options) {
  const slugged = slug(input)
  const maxLength = options.hash.maxLength
  const trimmed = maxLength ? slugged.slice(0, maxLength) : slugged
  return trimmed
});

module.exports = function (opts) {
  return function (req, res, next) {
    if (req.altcloud.fullRules.writePath) {
      debug('handling writePath', req.altcloud.fullRules.writePath)
      try {
        // TODO could cache this if source is the same
        req.altcloud.targetPathTemplate = Handlebars.compile(req.altcloud.fullRules.writePath)
      } catch (err) {
        debug("Error generating write path:", err)
        return next(err)
      }
    }
    next()
  }
}
