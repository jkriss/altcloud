const Path = require('path')
const fs = require('fs')
const createError = require('http-errors')
const defaultLogger = require('./default-logger')

module.exports = function (opts) {
  const logger = defaultLogger(opts)
  return function (req, res, next) {
    if (!req.altcloud || !req.altcloud.collection === true) return next()
    logger.debug('-- attempting collection --')
    logger.debug('path:', req.path)
    const dirname = req.path.replace(/\.\w+$/, '')
    logger.debug('dirname:', dirname)
    fs.readdir(Path.join(opts.root, dirname), function (err, files) {
      console.log('result', err, files)
      if (err) {
        if (err.code === 'ENOENT') {
          return next(createError(404))
        } else {
          next(err)
        }
      } else {
        var collection = {}
        var count = files.length
        if (files.length === 0) res.json([])
        files.forEach(function (file) {
          fs.readFile(Path.join(opts.root, dirname, file), 'utf8', function (err, data) {
            if (err) return next(err)
            try {
              data = JSON.parse(data)
            } catch (e) {}
            collection[file] = data
            count--
            if (count === 0) {
              logger.debug('sending', collection)
              res.json(collection)
            }
          })
        })
      }
    })
  }
}
