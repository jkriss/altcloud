const defaultLogger = require('./default-logger')
const yaml = require('js-yaml')
const fs = require('fs')
const Path = require('path')

module.exports = function (opts) {
  const logger = defaultLogger(opts)

  const loadAccessFiles = function (accessRules, paths, cb) {
    const path = paths.shift()
    logger.debug(`loading .access from ${path}`)
    fs.readFile(Path.join(path, '.access'), 'utf8', function (err, data) {
      if (err && err.code !== 'ENOENT') {
        cb(err)
      } else if (!err) {
        const dirAccessRules = yaml.safeLoad(data)
        // convert relative paths to absolute paths
        let absoluteAccessRules = {}
        const prefix = Path.relative(opts.root, path)
        for (const key in dirAccessRules) {
          let newKey = key
          if (key[0] !== '/') {
            newKey = '/' + Path.join(prefix, key)
          }
          absoluteAccessRules[newKey] = dirAccessRules[key]
        }
        Object.assign(accessRules, absoluteAccessRules)
        logger.debug('rules now', accessRules)
      }
      if (paths.length === 0) {
        cb(null, accessRules)
      } else {
        loadAccessFiles(accessRules, paths, cb)
      }
    })
  }

  const searchPaths = function (child) {
    let paths = []
    while (opts.root !== child) {
      const dir = Path.dirname(child) + '/'
      logger.debug('checking', dir)
      paths.unshift(dir)
      child = dir
    }
    if (paths.length === 0) paths = [opts.root]
    logger.debug(`searching paths for .access files: ${paths} (${paths.length} items)`)
    return paths
  }

  return function (req, res, next) {
    const paths = searchPaths(Path.join(opts.root, req.path))
    loadAccessFiles({}, paths, function (err, accessRules) {
      logger.debug('full rules:', accessRules)
      if (err) return next(err)
      if (!req.altcloud) req.altcloud = {}
      req.altcloud.rules = accessRules[req.path]
      next()
    })
  }
}