const crypto = require('crypto')

module.exports = function() {
  const token = crypto.randomBytes(16).toString('hex')
  // good for 2 days
  return `${token}: { expires: ${new Date().getTime() +
    1000 * 60 * 60 * 24 * 2} }`
}
