#! /usr/bin/env node

const argv = require('minimist')(process.argv.slice(2))
const server = require('../index')

const opts = {
  root: argv._[0],
  port: argv.p || 3000,
  logLevel: argv.debug ? 'debug' : 'info'
}

if (!opts.root) delete opts.root

console.log('running with options', opts)

server(opts).listen(opts.port, function () {
  console.log(`-- altcloud listening on port ${opts.port} --`)
})
