const fs = require('fs')
const Path = require('path')
const debug = require('debug')('altcloud:alt-formats')
require('./regexp-escape')

const altFormats = function(options) {
  const opts = Object.assign(
    {
      extensions: ['html', 'md', 'markdown']
    },
    options
  )

  const checkFile = function(pathNoSuffix, extensions, cb) {
    if (extensions.length === 0) return cb()
    const ext = extensions.shift()
    const pathWithExt = `${pathNoSuffix}.${ext}`
    debug('checking for', pathWithExt)
    fs.stat(pathWithExt, function(err) {
      if (err && err.code === 'ENOENT') {
        checkFile(pathNoSuffix, extensions, cb)
      } else if (err) return cb(err)
      else cb(null, pathWithExt)
    })
  }

  return function(req, res, next) {
    if (req.method !== 'GET') return next()
    debug('format:', req.query.format)
    if (req.query.format && req.query.format === 'raw') return next()
    // the static handler didn't find anything, so find alternates
    // save the found path as req.altcloud.actualPath
    const fullPath = Path.join(opts.root, req.path)
    debug(`full path: ${fullPath} (including root ${opts.root})`)
    const ext = fullPath.slice(-1) !== '/' && Path.extname(req.path)
    debug('ext:', ext)
    let pathNoSuffix
    if (ext) {
      const suffixRegex = new RegExp(RegExp.escape(ext) + '$')
      pathNoSuffix = fullPath.replace(suffixRegex, '')
    } else {
      pathNoSuffix = fullPath
      if (fullPath[fullPath.length - 1] === Path.sep) pathNoSuffix += 'index'
    }
    debug('pathNoSuffix:', pathNoSuffix, 'ext:', ext)

    const extensions = ext
      ? [ext.replace(/^\./, '')].concat(opts.extensions)
      : opts.extensions.concat([])

    checkFile(pathNoSuffix, extensions, function(err, actualPath) {
      if (err) {
        next(err)
      } else if (actualPath) {
        debug('got actualPath', actualPath)
        if (!req.altcloud) req.altcloud = {}
        const actualRelativePath = Path.relative(opts.root, actualPath)
        req.altcloud.actualPath = actualRelativePath
        next()
      } else {
        next()
      }
    })
  }
}

module.exports = altFormats
