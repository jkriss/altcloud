const SecK = require('secure-keys');
const flatten = require('flat')
const unflatten = require('flat').unflatten
const crypto = require('crypto')
const yaml = require('js-yaml')
const fs = require('fs')

const encryptSecrets = function (password) {
  const obj = yaml.safeLoad(fs.readFileSync('.secrets', 'utf8'))
  var sec = new SecK({
    secret: password
  });
  const encryptedText = sec.encrypt(flatten(obj))
  fs.writeFileSync('.secrets-encrypted', JSON.stringify(encryptedText, null, 2))
}

const decryptSecrets = function (password) {
  const text = JSON.parse(fs.readFileSync('.secrets-encrypted', 'utf8'))
  var sec = new SecK({
    secret: password,
  });
  const decryptedText = sec.decrypt(text)
  fs.writeFileSync('.secrets', yaml.safeDump(unflatten(decryptedText)))
}

module.exports = {
  encryptSecrets: encryptSecrets,
  decryptSecrets: decryptSecrets
}
