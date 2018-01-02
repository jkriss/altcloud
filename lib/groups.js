const Path = require('path')
const debug = require('debug')('groups')
const findFile = require('./find-file')
const yaml = require('js-yaml')
const fs = require('fs')

module.exports = function (opts) {
  return function (req, res, next) {
    findFile([
      '.groups',
      Path.join(req.altcloud.siteBase, '.groups')
    ], opts.root, function(err, path) {
      if (path) {
        const groupsPath = Path.join(opts.root, path)
        debug("found .groups at", groupsPath)
        fs.readdir(groupsPath, function(err, groupFiles) {
          if (err) return next(err)
          // debug("groups:", groupFiles)
          const groups = groupFiles.map(function(f) {
            return {
              name: Path.basename(f, Path.extname(f)),
              fullPath: Path.join(groupsPath, f),
              getMembers: function(cb) {
                // debug("getting members for", this.name, f)
                fs.readFile(this.fullPath, 'utf8', function(err, text) {
                  if (err) return cb(err)
                  cb(null, yaml.safeLoad(text))
                })
              }
            }
          })
          // debug("groups:", groups)
          // load 'em now, for now
          let count = groups.length
          groups.forEach(function(g) {
            g.getMembers(function(err, members) {
              if (err) return next(err)
              g.members = members
              count--
              if (count === 0) {
                debug("groups:", groups)
                if (!req.altcloud) req.altcloud = {}
                req.altcloud.groups = {}
                groups.forEach(function(g) {
                  req.altcloud.groups[g.name] = g.members
                })
                debug("req.altcloud.groups:", req.altcloud.groups)
                next()
              }
            })
          })
        })
      }
    })
  }
}
