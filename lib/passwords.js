const bcrypt = require('bcryptjs')
const fs = require('fs')
const yaml = require('js-yaml')

module.exports = {
  load: function (path, cb) {
    fs.readFile(path, function (err, data) {
      if (err) {
        if (err.code === 'ENOENT') return cb(null, {})
        else cb(err)
      } else {
        cb(null, yaml.safeLoad(data))
      }
    })
  },
  verify: function (password, hashed) {
    return bcrypt.compareSync(password, hashed)
  }
}
