#! /usr/bin/env node

const passwordHasher = require('../lib/password-hasher')

if (process.argv.length < 4) {
  console.error('Usage: add-user <username> <password>')
} else {
  const username = process.argv[2]
  const password = passwordHasher(process.argv[3])
  console.log(`${username}: ${password}`)
}
