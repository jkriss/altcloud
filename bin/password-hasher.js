#! /usr/bin/env node

var passwordHasher = require('../lib/password-hasher')

if (process.argv.length < 4) {
  console.error("Usage: htpasswd <username> <password>")
} else {
  var username = process.argv[2]
  var password = process.argv[3]

  console.log(passwordHasher(username, password))
}
