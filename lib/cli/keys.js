const mkdirp = require('mkdirp')
const pem = require('pem')
const fs = require('fs')
const Path = require('path')

const dir = '.keys'

module.exports = function(root) {
  const path = Path.join(root, dir)

  mkdirp(path, function(err) {
    if (err) throw err
    pem.createCertificate({ days: 3650, selfSigned: true }, function(
      err,
      keys
    ) {
      if (err) throw err
      fs.writeFileSync(Path.join(path, 'private.key'), keys.serviceKey)
      fs.writeFileSync(Path.join(path, 'public.pem'), keys.certificate)
      console.log('Generated keys in', path)
    })
  })
}
