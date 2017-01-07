module.exports = function (opts) {
  return function (req, res, next) {
    opts.logger.debug('-- send rendered file --')
    if (req.altcloud && req.altcloud.fileContents) {
      res.send(req.altcloud.fileContents)
    } else {
      next()
    }
  }
}
