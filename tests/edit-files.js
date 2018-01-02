const test = require('tape')
const fs = require('fs')
const request = require('supertest')
const editFiles = require('../lib/edit-files')
const del = require('del')
const mkdirp = require('mkdirp')

test('post file', function(t) {
  t.plan(4)

  del.sync([`${__dirname}/data/rw`])

  // file shouldn't exist yet
  t.throws(function() {
    fs.statSync(`${__dirname}/data/rw/test.txt`)
  })

  request(editFiles({ root: `${__dirname}/data` }))
    .post('/rw/test.txt')
    .type('text')
    .send('oh hi')
    .end(function(err, res) {
      t.error(err)
      t.equals(res.statusCode, 201)
      const content = fs.readFileSync(`${__dirname}/data/rw/test.txt`, 'utf8')
      t.equals(content, 'oh hi')
    })
})

test('put file', function(t) {
  t.plan(4)

  del.sync([`${__dirname}/data/rw`])

  // file shouldn't exist yet
  t.throws(function() {
    fs.statSync(`${__dirname}/data/rw/test.txt`)
  })

  request(editFiles({ root: `${__dirname}/data` }))
    .put('/rw/test.txt')
    .type('text')
    .send('oh hi')
    .end(function(err, res) {
      t.error(err)
      t.equals(res.statusCode, 201)
      const content = fs.readFileSync(`${__dirname}/data/rw/test.txt`, 'utf8')
      t.equals(content, 'oh hi')
    })
})

test('delete file', function(t) {
  t.plan(3)
  mkdirp.sync(`${__dirname}/data/rw`)
  fs.writeFileSync(`${__dirname}/data/rw/deletion-test.txt`, 'test', 'utf8')

  // shoudn't throw an error
  fs.statSync(`${__dirname}/data/rw/deletion-test.txt`)

  request(editFiles({ root: `${__dirname}/data` }))
    .delete('/rw/deletion-test.txt')
    .end(function(err, res) {
      t.error(err)
      t.equals(res.statusCode, 202)
      t.throws(function() {
        // now that it's gone, this should throw an error
        fs.statSync(`${__dirname}/data/rw/deletion-test.txt`)
      })
    })
})

test("delete file that doesn't exist", function(t) {
  t.plan(2)

  request(editFiles({ root: `${__dirname}/data` }))
    .delete('/rw/totally-not-a-file')
    .end(function(err, res) {
      t.error(err)
      t.equals(res.statusCode, 202)
    })
})

test("delete file from a dir that doesn't exist", function(t) {
  t.plan(2)

  request(editFiles({ root: `${__dirname}/data` }))
    .delete('/not-a-directory/totally-not-a-file')
    .end(function(err, res) {
      t.error(err)
      t.equals(res.statusCode, 202)
    })
})
