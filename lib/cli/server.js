const argv = require('minimist')(process.argv.slice(2))
const fs = require('fs')
const Path = require('path')
const yaml = require('js-yaml')
const server = require('../../index')
const mkdirp = require('mkdirp')
const { watchHostnames } = require('../hostnames')

module.exports = function(opts) {
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


  if (opts.ssl && config && config.letsencrypt) {
    // create the config directory if necessary, watch for new directories in
    // webroot, add them to the config

    const greenlockConfigDir = '.greenlock.d'
    mkdirp.sync(greenlockConfigDir)

    watchHostnames(hostnames => {
      let gc = { sites: [] }
      const configPath = Path.join(greenlockConfigDir, 'config.json')
      try {
        const greenlockConfig = fs.readFileSync(configPath, 'utf8')
        gc = JSON.parse(greenlockConfig)
      } catch (err) {
        console.log('Error reading greenlock config, creating a new one:', err)
      }
      console.log("read sites", gc.sites)
      const existingHosts = gc.sites.map(s => s.subject)
      for (const h of hostnames) {
        if (!h.includes('.')) {
	  console.log(`hostname ${h} isn't a full domain, not issuing a certificate`)
	} else if (!existingHosts.includes(h)) {
          gc.sites.push({ subject: h })
        }
      }
      // remove any hostnames no longer in the working directory
      const newSites = []
      for (const s of gc.sites) {
        if (!hostnames.includes(s.subject)) {
          console.log("!! removing old host", s.subject)
        } else {
          newSites.push(s)
        }
      }
      gc.sites = newSites
      fs.writeFileSync(configPath, JSON.stringify(gc, null, 2))
    })
	  
    require('greenlock-express')
      .init({
        packageRoot: Path.join(__dirname, '..', '..'),
        configDir: Path.resolve(greenlockConfigDir),
        maintainerEmail: config.letsencrypt.email,
        cluster: false
      })
      .serve(server(opts))
  } else {
    server(opts).listen(opts.port, function () {
      console.log(`-- altcloud listening on port ${opts.port} --`)
    })
  }
}
