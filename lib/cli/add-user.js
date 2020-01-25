const passwordHasher = require('../password-hasher')
const crypto = require('crypto')

module.exports = function (username, password) {
  if (!password) {
    password = crypto.randomBytes(16).toString('hex')
    console.error(`Generated password for ${username}: ${password}`)
  }
  return `${username}: ${passwordHasher(password)}`
}
