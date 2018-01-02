const Dat = require('dat-node')
const fs = require('fs')
const path = require('path')
const debug = require('debug')('altcloud:dat')

const serve = function(root) {
  Dat(root, function (err, dat) {
    if (err) throw err
    if (dat.writable) {
      const progress = dat.importFiles({
        watch: true,
        ignoreHidden: false
      })
    }
    dat.joinNetwork({
      download: false
    })
    const datLink = `dat://${dat.key.toString('hex')}`
    console.log(`My Dat link is: ${datLink}, hosting ${root}`)
    fs.writeFileSync(path.join(root, '.dat-link'), datLink)
  })
}

const mirror = function(datKey, root) {
  console.log("Mirroring", datKey)
  Dat(root, {
    // 2. Tell Dat what link I want
    key: datKey, // (a 64 character hash from above)
  }, function (err, dat) {
    if (err) throw err
    // console.log('My Dat link is: dat://' + dat.key.toString('hex'))
    // 3. Join the network & download (files are automatically downloaded)
    dat.joinNetwork(function (err) {
      if (err) throw err
      if (!dat.network.connected || !dat.network.connecting) {
        console.error('altcloud dat: no peers currently online for that key.')
      }
    })

    var stats = dat.trackStats()
    stats.on('update', function() {
      debug(`altcloud dat: ${stats.peers.total} peers (${stats.peers.complete} complete), download speed ${stats.network.downloadSpeed}`)
    })
  })
}

module.exports = {
  serve: serve,
  mirror: mirror
}
