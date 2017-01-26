const bcrypt = require('bcryptjs')
const fs = require('fs')
const yaml = require('js-yaml')
const passwordHasher = require('../lib/password-hasher')
const commonPassword = require('common-password')

const load = function (path, cb) {
  fs.readFile(path, function (err, data) {
    if (err) {
      if (err.code === 'ENOENT') return cb(null, {})
      else cb(err)
    } else {
      cb(null, yaml.safeLoad(data))
    }
  })
}

const verify = function (path, username, password, cb) {
  load(path, function (err, passwords) {
    if (err) return cb(err)
    const hashed = passwords[username]
    if (hashed) {
      bcrypt.compare(password, hashed, cb)
    } else {
      cb(null, false)
    }
  })
}

const add = function (path, username, password, cb) {
  if (!password || password.length < 8) return cb('Password must be at least 8 characters long')
  if (commonPassword(password)) return cb('Password is too common')
  if (password.indexOf(username) !== -1) return cb("Password can't contain your username")
  load(path, function (err, passwords) {
    if (err) return cb(err)
    if (passwords[username]) return cb(`Username "${username}" is already taken`)
    passwords[username] = passwordHasher(password)
    fs.writeFile(path, yaml.safeDump(passwords), cb)
  })
}

const remove = function (path, username, cb) {
  load(path, function (err, passwords) {
    if (err) return cb(err)
    delete passwords[username]
    fs.writeFile(path, yaml.safeDump(passwords), cb)
  })
}

module.exports = {
  load: load,
  verify: verify,
  add: add,
  remove: remove
}
