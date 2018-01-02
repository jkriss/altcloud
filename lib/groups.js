const Path = require('path')
const debug = require('debug')('groups')
const util = require('util')
const findFile = util.promisify(require('./find-file'))
const yaml = require('js-yaml')
const fs = require('fs-extra')

module.exports = function (opts) {
  return async function (req, res, next) {
    try {
      // look in root and siteBase (vhost base)
      const path = await findFile([
        '.groups',
        Path.join(req.altcloud.siteBase, '.groups')
      ], opts.root)

      // if there's a .groups dir, read them all
      if (path) {
        if (!req.altcloud) req.altcloud = {}
        req.altcloud.groups = []
        const groupsPath = Path.join(opts.root, path)
        debug("found .groups at", groupsPath)
        const groupFiles = await fs.readdir(groupsPath)
        for (let f of groupFiles) {
          const fullPath = Path.join(groupsPath, f)
          const members = await fs.readFile(fullPath, 'utf8')
            .then(text => yaml.safeLoad(text))
          debug("members:", members)
          req.altcloud.groups.push({
            name: Path.basename(f, Path.extname(f)),
            members
          })
        }
        debug("groups:", req.altcloud.groups)
      }
      next()
    } catch (err) {
      console.error(err)
      next(err)
    }
  }
}
