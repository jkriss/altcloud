const Dat = require('dat-node')
const fs = require('fs')
const path = require('path')

module.exports = function(root) {
  Dat(root, function (err, dat) {
    if (err) throw err
    var progress = dat.importFiles({ watch: true })
    dat.joinNetwork()
    const datLink = `dat://${dat.key.toString('hex')}`
    console.log(`My Dat link is: ${datLink}, hosting ${root}`)
    fs.writeFile(path.join(root, '.dat-link'), datLink)
  })
}
