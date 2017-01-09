const test = require('tape')
const fs = require('fs')
const request = require('supertest')
const editFiles = require('../lib/edit-files')
const del = require('del')

del.sync([`${__dirname}/data/rw`])

test('post file', function (t) {
  t.plan(4)

  // file shouldn't exist yet
  t.throws(function () {
    fs.statSync(`${__dirname}/data/rw/test.txt`)
  })

  request(editFiles({root: `${__dirname}/data`}))
    .post('/rw/test.txt')
    .type('text')
    .send('oh hi')
    .end(function (err, res) {
      t.error(err)
      t.equals(res.statusCode, 201)
      const content = fs.readFileSync(`${__dirname}/data/rw/test.txt`, 'utf8')
      t.equals(content, 'oh hi')
    })
})
