const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const getSalt = function(root) {
  const hash = crypto.createHash('sha256')
  const privateKey = fs.readFileSync(path.join(root, '.keys/private.key'))
  hash.update(privateKey)
  return hash.digest('hex')
}

const hash = function(password, root) {
  if (!root) root = ''
  const hash = crypto.createHash('sha256')
  hash.update(getSalt(root))
  hash.update(password)
  return hash.digest('hex')
}

module.exports = hash
