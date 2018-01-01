const crypto = require('crypto')
const hash = require('../hash')

module.exports = function(username) {
  const token = crypto.randomBytes(16).toString('hex')
  return {
    unencryptedToken: token,
    tokenLine: `'${hash(token)}': ${username}`
  }
}
