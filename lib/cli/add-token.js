const crypto = require('crypto')

module.exports = function(username) {
  return `'${crypto.randomBytes(32).toString('hex')}': ${username}`
}
