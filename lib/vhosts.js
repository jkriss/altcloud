const ip = require('ip')
const fs = require('fs')
const Path = require('path')
const defaultLogger = require('./default-logger')
const createError = require('http-errors')

module.exports = function (opts) {
  const logger = defaultLogger(opts)

  return function (req, res, next) {
    if (ip.isV4Format(req.hostname) || ip.isV6Format(req.hostname)) return next()

    const domainParts = req.hostname.split('.')
    const fullPath = Path.join(opts.root, req.hostname)

    logger.debug(`figuring out vhost for ${domainParts}, ${fullPath}`)

    if (!req.altcloud) req.altcloud = {}
    req.altcloud.originalPath = req.path

    fs.stat(fullPath, function (err) {
      if (err) {
        if (err.code === 'ENOENT') {
          logger.debug(`Couldn't find full hostname, trying subdomain path`)
          if (domainParts.length >= 2) {
            const lastPart = domainParts.pop()
            if (lastPart !== 'localhost') {
              domainParts.pop()
            }
            const siteBase = domainParts.length > 0 ? '/' + domainParts.reverse().join('/') : ''
            req.altcloud.siteBase = siteBase
            req.url = siteBase + req.url
            if (!req.altcloud) req.altcloud = {}
            req.altcloud.actualPath = req.url
            logger.debug(`path is now ${req.path}, url is now ${req.url}, actualPath is now ${req.altcloud.actualPath}`)
            // return a 404 if this one isn't available either
            fs.stat(Path.join(opts.root, siteBase), function (err) {
              if (err) {
                if (err.code === 'ENOENT') {
                  next(createError(404))
                } else {
                  next(err)
                }
              } else {
                next()
              }
            })
          } else {
            next()
          }
        } else {
          next(err)
        }
      } else {
        // full path file exists, set domain and continue
        req.url = '/' + Path.join(req.hostname, req.url)
        next()
      }
    })
  }
}
