const ip = require('ip')
const fs = require('fs')
const Path = require('path')

module.exports = function (opts) {
  return function (req, res, next) {
    if (ip.isV4Format(req.hostname) || ip.isV6Format(req.hostname)) return next()

    const domainParts = req.hostname.split('.')
    const fullPath = Path.join(opts.root, req.hostname)

    opts.logger.debug(`figuring out vhost for ${domainParts}, ${fullPath}`)

    fs.stat(fullPath, function(err) {
      if (err) {
        if (err.code === 'ENOENT') {
          opts.logger.debug(`Couldn't find full hostname, trying subdomain path`)
          if (domainParts.length >= 3) {
            domainParts.pop()
            domainParts.pop()
            const siteBase = '/' + domainParts.reverse().join('/')
            req.url = siteBase + req.url
          }
          opts.logger.debug(`path is now ${req.path}, url is now ${req.url}`)
          next()
        } else {
          next(e)
        }
      }
    })
  }
}