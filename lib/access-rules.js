const defaultLogger = require('./default-logger')
const yaml = require('js-yaml')
const fs = require('fs')
const Path = require('path')
const Route = require('route-parser')

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
        // logger.debug('rules now', accessRules)
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
    logger.debug('searching from', Path.resolve(child), 'to', Path.resolve(opts.root))
    while (Path.resolve(opts.root) !== Path.resolve(child)) {
      const dir = Path.dirname(child)
      logger.debug('checking', dir)
      paths.unshift(dir)
      child = dir
    }
    if (paths.length === 0) paths = [opts.root]
    logger.debug(`searching paths for .access files: ${paths} (${paths.length} items)`)
    return paths
  }

  const resolveVariables = function (req, rules) {
    var rulePaths = Object.keys(rules)
    logger.debug('rule paths:', rulePaths)
    if (!req.altcloud) req.altcloud = {}
    const path = req.altcloud.actualPath || req.path
    rulePaths.forEach(function (rulePath) {
      const route = new Route(rulePath)
      const matchedParams = route.match(path)
      logger.debug(`matching ${path} against ${rulePath} ${matchedParams}`)
      if (matchedParams) {
        req.altcloud.params = matchedParams
        logger.debug('resovling variables based on', rulePath, matchedParams)
        const originalRules = rules[rulePath]
        let rulesString = JSON.stringify(originalRules)
        Object.keys(matchedParams).forEach(function (key) {
          const regex = new RegExp('\\$' + key, 'g')
          rulesString = rulesString.replace(regex, matchedParams[key])
        })
        const newRules = JSON.parse(rulesString)
        logger.debug('new rules for', req.path, newRules)
        rules[req.path] = newRules
      }
    })
    return rules
  }

  return function (req, res, next) {
    logger.debug('-- access rules --')
    const paths = searchPaths(Path.join(opts.root, req.path))
    loadAccessFiles({}, paths, function (err, accessRules) {
      accessRules = resolveVariables(req, accessRules)
      logger.debug('full rules:', accessRules)
      if (err) return next(err)
      if (!req.altcloud) req.altcloud = {}
      let rules = accessRules[req.path] || {}
      // merge rules for requested path and actual file path
      if (req.altcloud.actualPath && accessRules[req.altcloud.actualPath]) {
        Object.assign(rules, accessRules[req.altcloud.actualPath])
      }

      // now look up the part that's relevant to the http method
      let methodKey
      if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') methodKey = 'read'
      if (req.method === 'POST' || req.method === 'PUT') methodKey = 'write'
      if (req.method === 'DELETE') methodKey = 'delete'

      req.altcloud.rules = rules[methodKey]

      next()
    })
  }
}
