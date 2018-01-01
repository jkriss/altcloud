#! /usr/bin/env node
const argv = require('minimist')(process.argv.slice(2))
const path = require('path')
const fs = require('fs')
const del = require('del')

const server = require('../lib/cli/server')
const keys = require('../lib/cli/keys')
const addUser = require('../lib/cli/add-user')
const addToken = require('../lib/cli/add-token')
const addInvitation = require('../lib/cli/add-invitation')
const dat = require('../lib/dat')

const append = function(file, line) {
  const root = argv.root || process.cwd()
  const outputFile = path.join(root, file)
  console.log("Appending to", outputFile)
  fs.appendFileSync(outputFile, `${line}\n`)
}

// console.error(argv)

const command = argv._[0] || 'server'

if (command === 'server') {
  const root = argv._[1] || process.cwd()
  const opts = {
    root: root,
    port: argv.p || 3000,
    logLevel: argv.debug ? 'debug' : 'info',
    ssl: argv.ssl ? true : process.env.NODE_ENV === 'production',
    readOnly: argv['read-only'] || !!argv.mirror
  }
  server(opts)
  // run a dat server in parallel if desired
  if (argv.dat) {
    dat.serve(root)
  }
  if (argv.mirror) {
    dat.mirror(argv.mirror, root)
  }
} else if (command === 'add-user') {
  if (argv._.length === 1 || argv._.length >= 4) {
    console.error('Usage: add-user <username> <password>')
  } else {
    const newLine = addUser(argv._[1], argv._[2])
    append('.passwords', newLine)
  }
} else if (command === 'add-token') {
  const username = argv._[1]
  const token = addToken(username)
  console.log(`New token for ${username}: ${token.unencryptedToken} (will not be shown again)`)
  append('.tokens', token.tokenLine)
} else if (command === 'add-invitation') {
  const newLine = addInvitation(argv._[1])
  append('.invitations', newLine)
} else if (command === 'keys') {
  const root = argv._[1] || './'
  keys(root)
} else if (command === 'fork') {
  del.sync(['dat.json', '.dat/**'])
} else if (argv._.length >= 2) {
  console.error("Too many arguments")
  process.exit(1)
} else {
  console.log("Usage: altcloud [add-user]")
}
