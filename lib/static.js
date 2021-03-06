const createError = require('http-errors')
const defaultLogger = require('./default-logger')

module.exports = function (opts) {
  const logger = defaultLogger(opts)

  const fileOptions = {
    root: opts.root,
    dotfiles: 'allow'
  }

  return function (req, res, next) {
    if (req.method !== 'GET') return next()

    logger.debug('-- static files --')
    logger.debug('sending', req.path)
    if (req.query.format && req.query.format === 'raw') res.type('text')
    res.sendFile(decodeURI(req.path), fileOptions, function (err) {
      if (err) {
        if (err.code === 'ENOENT') {
          next(createError(404))
        } else if (err.code === 'EISDIR') {
          // if it's a directory, add the slash
          const path = req.altcloud && req.altcloud.originalPath || req.path
          logger.debug('redirecting to directory', path + '/')
          res.redirect(path + '/')
        } else {
          next(err)
        }
      }
    })
  }
}
