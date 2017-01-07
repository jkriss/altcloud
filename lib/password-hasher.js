var bcrypt = require('bcryptjs')

module.exports = function(username, password) {
  var hash = bcrypt.hashSync(password, 3)
  return ([username, hash].join(':'))
}
