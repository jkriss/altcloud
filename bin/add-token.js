#! /usr/bin/env node
const crypto = require('crypto')

if (process.argv.length < 3) {
  console.error('Usage: add-token <username>')
} else {
  const username = process.argv[2]
  const token = crypto.randomBytes(32).toString('hex')
  console.log(`'${token}': ${username}`)
}
