const crypto = require('crypto')
const fs = require('fs')

const getSalt = function() {
  const hash = crypto.createHash('sha256')
  const privateKey = fs.readFileSync('.keys/private.key')
  hash.update(privateKey)
  return hash.digest('hex')
}

const hash = function(password) {
  const hash = crypto.createHash('sha256')
  hash.update(getSalt())
  hash.update(password)
  return hash.digest('hex')
}

module.exports = hash
