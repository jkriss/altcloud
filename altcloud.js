var argv = require('minimist')(process.argv.slice(2))
var server = require('./index')

console.log('minimist says', argv)

const opts = {
  root: argv._[0],
  port: argv.p || 3000,
  logLevel: argv.debug ? 'debug' : 'info'
}

console.log('running with options', opts)

server(opts).listen(opts.port, function () {
  console.log(`Example app listening on port ${opts.port}!`)
})
