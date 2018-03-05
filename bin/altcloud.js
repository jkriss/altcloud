const argv = require('minimist')(process.argv.slice(2))

if (argv.debug) {
  process.env.DEBUG = 'altcloud:*'
  console.log('turned on debug pattern', process.env.DEBUG)
}

const path = require('path')
const fs = require('fs')
const del = require('del')

const server = require('../lib/cli/server')
const keys = require('../lib/cli/keys')
const addUser = require('../lib/cli/add-user')
const addToken = require('../lib/cli/add-token')
const addInvitation = require('../lib/cli/add-invitation')
const heartbeat =
  typeof argv.broadcast === 'number' ? argv.broadcast : 60 * 1000 // check in once a minute
const Discovery = require('../lib/discovery')

const append = function(file, line) {
  const root = argv.root || process.cwd()
  const outputFile = path.join(root, file)
  console.log('Appending to', outputFile)
  fs.appendFileSync(outputFile, `${line}\n`)
}

// console.error(argv)

const command = argv._[0] || 'server'

if (command === 'server') {
  const root = argv._[1] || process.cwd()
  const port = argv.p || 3000
  const ssl = argv.ssl ? true : process.env.NODE_ENV === 'production'
  const opts = {
    root: root,
    port: port,
    logLevel: argv.debug ? 'debug' : 'info',
    ssl: ssl,
    readOnly: argv['read-only'] || !!argv.mirror
  }
  server(opts)
  if (argv.broadcast) {
    const serviceName = argv.name || 'altcloud'
    console.log(
      'broadcasting servive with heartbeat',
      heartbeat,
      'and name',
      serviceName
    )
    const discovery = Discovery({ heartbeat })
    discovery.put({
      name: serviceName,
      host: argv.host, // defaults to the network ip of the machine
      port: port, // we are listening on port 8080.
      proto: ssl ? 'https' : 'http'
    })
  }
} else if (command === 'scan') {
  const discovery = Discovery({ heartbeat: 500 })
  discovery.scan(function(err, services) {
    if (argv.json) {
      console.log(services)
    } else {
      services.forEach(function(service) {
        console.log(`${service.name} at ${service.proto}://${service.address}`)
      })
    }
    process.exit()
  })
} else if (command === 'watch') {
  const discovery = Discovery({ heartbeat: 500 })
  discovery.watch(
    function(name, service) {
      console.log(
        `${service.name} is available at ${service.proto}://${service.address}`
      )
    },
    function(name, service) {
      console.log(
        `${service.name} is no longer available at ${service.proto}://${
          service.address
        }`
      )
    }
  )
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
  console.log(
    `New token for ${username}: ${
      token.unencryptedToken
    } (will not be shown again)`
  )
  append('.tokens', token.tokenLine)
} else if (command === 'add-invitation') {
  const newLine = addInvitation(argv._[1])
  append('.invitations', newLine)
} else if (command === 'keys') {
  const root = argv._[1] || './'
  keys(root)
} else if (argv._.length >= 2) {
  console.error('Too many arguments')
  process.exit(1)
} else {
  console.log('Usage: altcloud [add-user]')
}
