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

    const domainParts = req.hostname.split('.')
    const fullPath = Path.join(opts.root, req.hostname)

    logger.debug(`figuring out vhost for ${domainParts}, ${fullPath}`)

    if (!req.altcloud) req.altcloud = {}
    req.altcloud.originalPath = req.path

    search([
      req.hostname,
      req.hostname.replace(/\.localhost$/,''),
      domainParts[0],
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

    // fs.stat(fullPath, function (err) {
    //   if (err) {
    //     if (err.code === 'ENOENT') {
    //       logger.debug(`Couldn't find full hostname, trying subdomain path`)
    //       if (domainParts.length >= 2) {
    //         const lastPart = domainParts.pop()
    //         if (lastPart !== 'localhost') {
    //           domainParts.pop()
    //         }
    //         const siteBase = domainParts.length > 0 ? '/' + domainParts.reverse().join('/') : ''
    //         const siteBase = domainParts.length > 0 ? '/' + domainParts.join('.') : ''
    //         req.altcloud.siteBase = siteBase
    //         req.url = siteBase + req.url
    //         if (!req.altcloud) req.altcloud = {}
    //         req.altcloud.actualPath = req.url
    //         logger.debug(`path is now ${req.path}, url is now ${req.url}, actualPath is now ${req.altcloud.actualPath}`)
    //         // return a 404 if this one isn't available either
    //         fs.stat(Path.join(opts.root, siteBase), function (err) {
    //           if (err) {
    //             if (err.code === 'ENOENT') {
    //               next(createError(404))
    //             } else {
    //               next(err)
    //             }
    //           } else {
    //             next()
    //           }
    //         })
    //       } else {
    //         next()
    //       }
    //     } else {
    //       next(err)
    //     }
    //   } else {
    //     // full path file exists, set domain and continue
    //     req.url = '/' + Path.join(req.hostname, req.url)
    //     next()
    //   }
    // })
  }
}
