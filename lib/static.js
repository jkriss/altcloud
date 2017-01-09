const Path = require('path')
const createError = require('http-errors')

module.exports = function (opts) {
  const fileOptions = {
    root: opts.root,
    dotfiles: 'allow'
  }

  return function (req, res, next) {
    if (req.method !== 'GET') return next()
    // hide sensitive files
    if (req.path.indexOf('/.keys') === 0) next(createError(404))
    if (['.passwords'].indexOf(Path.basename(req.path)) !== -1) next(createError(404))

    opts.logger.debug('-- static files --')
    opts.logger.debug('sending', req.path)
    if (req.query.format && req.query.format === 'raw') res.type('text')
    res.sendFile(req.path, fileOptions, function (err) {
      if (err) {
        if (err.code === 'ENOENT') {
          next()
        } else if (err.code === 'EISDIR') {
          // if it's a directory, add the slash
          res.redirect(req.path + '/')
        } else {
          next(err)
        }
      }
    })
  }
}
