#! /usr/bin/env node

const argv = require('minimist')(process.argv.slice(2))
const fs = require('fs')
const Path = require('path')
const yaml = require('js-yaml')
const server = require('../index')

const opts = {
  root: argv._[0] || process.cwd(),
  port: argv.p || 3000,
  logLevel: argv.debug ? 'debug' : 'info',
  ssl: argv.ssl ? true : process.env.NODE_ENV === 'production'
}

if (!opts.root) delete opts.root

console.log('running with options', opts)

let config
try {
  config = yaml.safeLoad(fs.readFileSync(Path.join(opts.root, '.config'), 'utf8'))
} catch (e) {}

if (opts.ssl && !config) {
  console.log('SSL should be on, but no .config file present')
  process.exit(1)
}

if (opts.ssl && !config.letsencrypt) {
  console.log('SSL should be on, but no letsencrypt settings in .config')
  process.exit(1)
}

// auto approve domains
function approveDomains (opts, certs, cb) {
  if (certs) {
    opts.domains = certs.altnames
  } else {
    opts.email = config.letsencrypt.email
    opts.agreeTos = true
  }
  cb(null, { options: opts, certs: certs })
}

if (opts.ssl && config && config.letsencrypt) {
  require('letsencrypt-express').create({
    server: config.letsencrypt.server || 'https://acme-v01.api.letsencrypt.org/directory',
    email: config.letsencrypt.email,
    agreeTos: true,
    approveDomains: approveDomains,

    app: server(opts)

  }).listen(80, 443)
  console.log('-- altcloud running with ssl on ports 80 and 443 --')
} else {
  server(opts).listen(opts.port, function () {
    console.log(`-- altcloud listening on port ${opts.port} --`)
  })
}
