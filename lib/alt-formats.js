const fs = require('fs')
const Path = require('path')

RegExp.escape = function (text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
}

const altFormats = function (options) {
  const opts = Object.assign({
    extensions: ['html', 'md', 'markdown']
  }, options)

  const checkFile = function (pathNoSuffix, extensions, cb) {
    if (extensions.length === 0) return cb()
    const ext = extensions.shift()
    const fullPath = `${pathNoSuffix}.${ext}`
    fs.stat(fullPath, function (err) {
      if (err && err.code === 'ENOENT') {
        checkFile(pathNoSuffix, extensions, cb)
      } else if (err) return cb(err)
      else cb(null, fullPath)
    })
  }

  return function (req, res, next) {
    opts.logger.debug('-- alt formats --')
    // the static handler didn't find anything, so find alternates
    // save the found path as req.altcloud.actualPath
    const fullPath = Path.join(opts.root, req.path)
    const ext = Path.extname(fullPath)
    let pathNoSuffix
    if (ext) {
      const suffixRegex = new RegExp(ext + '$')
      pathNoSuffix = fullPath.replace(suffixRegex, '')
    } else {
      pathNoSuffix = fullPath
      if (fullPath[fullPath.length - 1] === '/') pathNoSuffix = 'index'
    }

    checkFile(pathNoSuffix, [ext].concat(opts.extensions), function (err, actualPath) {
      if (err) {
        next(err)
      } else if (actualPath) {
        if (!req.altcloud) req.altcloud = {}
        const rootPathRegex = new RegExp('^' + RegExp.escape(opts.root))
        const actualRelativePath = actualPath.replace(rootPathRegex, '/')
        opts.logger.debug(`requested path was ${req.path}, found ${actualRelativePath}`)
        req.altcloud.actualPath = actualRelativePath
        next()
      } else {
        next()
      }
    })
  }
}

module.exports = altFormats
