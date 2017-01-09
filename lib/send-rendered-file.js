module.exports = function (opts) {
  return function (req, res, next) {
    if (req.method !== 'GET') return next()
    opts.logger.debug('-- send rendered file --')
    if (req.altcloud && req.altcloud.fileContents) {
      res.send(req.altcloud.fileContents)
    } else {
      next()
    }
  }
}
