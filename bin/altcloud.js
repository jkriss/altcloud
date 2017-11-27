#! /usr/bin/env node
const argv = require('minimist')(process.argv.slice(2))
const path = require('path')
const fs = require('fs')

const server = require('../lib/cli/server')
const keys = require('../lib/cli/keys')
const addUser = require('../lib/cli/add-user')
const addToken = require('../lib/cli/add-token')
const addInvitation = require('../lib/cli/add-invitation')

const append = function(file, line) {
  const root = argv.root || './'
  const outputFile = path.join(root, file)
  console.log("Appending to", outputFile)
  fs.appendFileSync(outputFile, `${line}\n`)
}

// console.error(argv)

const command = argv._[0] || 'server'

if (command === 'server') {
  const opts = {
    root: argv._[0] || './',
    port: argv.p || 3000,
    logLevel: argv.debug ? 'debug' : 'info',
    ssl: argv.ssl ? true : process.env.NODE_ENV === 'production'
  }
  server(opts)
} else if (command === 'add-user') {
  if (argv._.length === 1 || argv._.length >= 4) {
    console.error('Usage: add-user <username> <password>')
  } else {
    const newLine = addUser(argv._[1], argv._[2])
    append('.passwords', newLine)
  }
} else if (command === 'add-token') {
  const newLine = addToken(argv._[1])
  append('.tokens', newLine)
} else if (command === 'add-invitation') {
  const newLine = addInvitation(argv._[1])
  append('.invitations', newLine)
} else if (command === 'keys') {
  const root = argv._[1] || './'
  keys(root)
} else if (argv._.length >= 2) {
  console.error("Too many arguments")
  process.exit(1)
} else {
  console.log("Usage: altcloud [add-user]")
}
