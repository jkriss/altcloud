const ip = require('ip')
const fs = require('fs')
const Path = require('path')
const createError = require('http-errors')
const findFile = require('./find-file')
const debug = require('debug')('altcloud:vhosts')

module.exports = function(opts) {
  return function(req, res, next) {
    if (ip.isV4Format(req.hostname) || ip.isV6Format(req.hostname))
      return next()

    // reset the hacky hostname
    if (req.query.domain === 'false') {
      req.query.domain = false
      res.clearCookie('_domain')
      delete req.cookies['_domain']
    }

    const hostname = req.query.domain || req.cookies['_domain'] || req.hostname
    // if we're pulling it from the query string, save it in a cookie
    if (req.query.domain) {
      res.cookie('_domain', req.query.domain)
    }

    const domainParts = hostname.split('.')
    const fullPath = Path.join(opts.root, hostname)

    debug(`figuring out vhost for ${domainParts}, ${fullPath}`)

    if (!req.altcloud) req.altcloud = {}
    req.altcloud.originalPath = req.path

    findFile(
      [
        hostname,
        hostname.replace(/\.localhost$/, ''),
        '/' + domainParts[0],
        '/' + domainParts.reverse().join('/'),
        ''
      ],
      opts.root,
      function(err, siteBase) {
        debug('settled on', siteBase)
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
            debug(
              `path is now ${req.path}, url is now ${
                req.url
              }, actualPath is now ${req.altcloud.actualPath}`
            )
            next()
          }
        }
      }
    )
  }
}
