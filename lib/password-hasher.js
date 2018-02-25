var bcrypt = require('bcryptjs')

module.exports = function(password) {
  return bcrypt.hashSync(password, 10)
}
