const ip = require('ip')
const fs = require('fs')
const Path = require('path')
const defaultLogger = require('./default-logger')
const createError = require('http-errors')

module.exports = function (opts) {
  const logger = defaultLogger(opts)

  const search = function (paths, cb) {
    logger.debug("-- searching paths:", paths)
    if (paths.length === 0) cb(null, null)
    const path = paths.shift()
    logger.debug("checking", path, Path.join(opts.root, path))
    fs.stat(Path.join(opts.root, path), function (err) {
      if (err) {
        if (err.code === 'ENOENT') {
          logger.debug("not found")
          search(paths, cb)
        } else {
          cb(err)
        }
      } else {
        logger.debug("found", path)
        cb(null, path)
      }
    })
  }

  return function (req, res, next) {
    if (ip.isV4Format(req.hostname) || ip.isV6Format(req.hostname)) return next()

    // reset the hacky hostname
    if (req.query.domain === 'false') {
      req.query.domain = false
      res.clearCookie('_vhost')
      delete req.cookies['_vhost']
    }

    const hostname = req.query.domain || req.cookies['_domain'] || req.hostname
    // if we're pulling it from the query string, save it in a cookie
    if (req.query.domain) {
      res.cookie('_domain', req.query.domain)
    }

    const domainParts = hostname.split('.')
    const fullPath = Path.join(opts.root, hostname)

    logger.debug(`figuring out vhost for ${domainParts}, ${fullPath}`)

    if (!req.altcloud) req.altcloud = {}
    req.altcloud.originalPath = req.path

    search([
      hostname,
      hostname.replace(/\.localhost$/,''),
      '/' + domainParts[0],
      '/' + domainParts.reverse().join('/'),
      ''
    ], function(err, siteBase) {
      logger.debug("settled on", siteBase)
      if (err) {
        return next(err)
      } else {
        if (siteBase === null) {
          next(createError(404))
        } else {
          req.url = siteBase + req.url
          if (!req.altcloud) req.altcloud = {}
          req.altcloud.siteBase = siteBase
          req.altcloud.actualPath = req.url
          logger.debug(`path is now ${req.path}, url is now ${req.url}, actualPath is now ${req.altcloud.actualPath}`)
          next()
        }
      }
    })
  }
}
