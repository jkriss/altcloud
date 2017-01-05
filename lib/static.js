module.exports = function (opts) {

  const fileOptions = {
    root: opts.root,
    dotfiles: 'allow'
  }

  return function (req, res, next) {
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
