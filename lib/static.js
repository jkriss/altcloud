const debug = require('debug')('file:static')

module.exports = function (opts) {

  const fileOptions = {
    root: opts.root,
    dotfiles: 'allow'
  }

  return function (req, res, next) {
    if (req.method !== 'GET') return next()

    debug('sending', req.path)
    if (req.query.format && req.query.format === 'raw') res.type('text')
    res.sendFile(decodeURI(req.path), fileOptions, function (err) {
      if (err) {
        if (err.code === 'ENOENT') {
          next()
        } else if (err.code === 'EISDIR') {
          // if it's a directory, add the slash
          const path = req.altcloud && req.altcloud.originalPath || req.path
          debug('redirecting to directory', path + '/')
          res.redirect(path + '/')
        } else {
          next(err)
        }
      }
    })
  }
}
