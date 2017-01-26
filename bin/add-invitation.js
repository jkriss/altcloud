#! /usr/bin/env node
const crypto = require('crypto')

const token = crypto.randomBytes(32).toString('hex')
// good for 2 days
console.log(`${token}: { expires: ${new Date().getTime() + (1000 * 60 * 60 * 24 * 2)} }`)
