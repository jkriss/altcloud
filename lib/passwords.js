const bcrypt = require('bcryptjs')
const fs = require('fs')
const yaml = require('js-yaml')

const load = function (path, cb) {
  fs.readFile(path, function (err, data) {
    if (err) {
      if (err.code === 'ENOENT') return cb(null, {})
      else cb(err)
    } else {
      cb(null, yaml.safeLoad(data))
    }
  })
}

const verify = function (path, username, password, cb) {
  load(path, function (err, passwords) {
    if (err) return cb(err)
    const hashed = passwords[username]
    if (hashed) {
      bcrypt.compare(password, hashed, cb)
    } else {
      cb(null, false)
    }
  })
}

module.exports = {
  load: load,
  verify: verify
}
