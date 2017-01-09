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
    const pathWithExt = `${pathNoSuffix}.${ext}`
    opts.logger.debug('checking for', pathWithExt)
    fs.stat(pathWithExt, function (err) {
      if (err && err.code === 'ENOENT') {
        checkFile(pathNoSuffix, extensions, cb)
      } else if (err) return cb(err)
      else cb(null, pathWithExt)
    })
  }

  return function (req, res, next) {
    if (req.method !== 'GET') return next()
    opts.logger.debug('-- alt formats --')
    opts.logger.debug('format:', req.query.format)
    if (req.query.format && req.query.format === 'raw') return next()
    // the static handler didn't find anything, so find alternates
    // save the found path as req.altcloud.actualPath
    const fullPath = Path.join(opts.root, req.path)
    opts.logger.debug(`full path: ${fullPath} (including root ${opts.root})`)
    const ext = Path.extname(fullPath)
    let pathNoSuffix
    if (ext) {
      const suffixRegex = new RegExp(RegExp.escape(ext) + '$')
      pathNoSuffix = fullPath.replace(suffixRegex, '')
    } else {
      pathNoSuffix = fullPath
      if (fullPath[fullPath.length - 1] === '/') pathNoSuffix += 'index'
    }
    opts.logger.debug('pathNoSuffix:', pathNoSuffix, 'ext:', ext)

    checkFile(pathNoSuffix, [ext.replace(/^\./, '')].concat(opts.extensions), function (err, actualPath) {
      if (err) {
        next(err)
      } else if (actualPath) {
        opts.logger.debug('got actualPath', actualPath)
        if (!req.altcloud) req.altcloud = {}
        const rootPathRegex = new RegExp('^' + RegExp.escape(opts.root))
        const actualRelativePath = Path.normalize(actualPath.replace(rootPathRegex, '/'))
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
