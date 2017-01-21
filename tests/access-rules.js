const test = require('tape')
const accessRules = require('../lib/access-rules')
const httpMocks = require('node-mocks-http')

test('load rules for path', function (t) {
  t.plan(3)

  const req = httpMocks.createRequest({
    method: 'GET',
    url: '/user1secrets.txt'
  })

  const res = httpMocks.createResponse()

  const handler = accessRules({root: `${__dirname}/data/`})

  handler(req, res, function (err) {
    t.error(err)
    t.ok(req.altcloud)
    t.equal(req.altcloud.rules, 'user1')
  })
})

test('parse multiple users', function (t) {
  t.plan(3)

  const req = httpMocks.createRequest({
    method: 'GET',
    url: '/another-secret.txt'
  })

  const res = httpMocks.createResponse()

  const handler = accessRules({root: `${__dirname}/data/`})

  handler(req, res, function (err) {
    t.error(err)
    t.ok(req.altcloud)
    t.deepEqual(req.altcloud.rules, ['user1', 'user2'])
  })
})

test('load rules from parent dir if not present', function (t) {
  t.plan(3)

  const req = httpMocks.createRequest({
    method: 'GET',
    url: '/sub1/user2secrets.txt'
  })

  const res = httpMocks.createResponse()

  const handler = accessRules({root: `${__dirname}/data/`})

  handler(req, res, function (err) {
    t.error(err)
    t.ok(req.altcloud)
    t.equal(req.altcloud.rules, 'user2')
  })
})

test('prefer current dir access file', function (t) {
  t.plan(3)

  const req = httpMocks.createRequest({
    method: 'GET',
    url: '/sub2/user3secrets.txt'
  })

  const res = httpMocks.createResponse()

  const handler = accessRules({root: `${__dirname}/data/`})

  handler(req, res, function (err) {
    t.error(err)
    t.ok(req.altcloud)
    t.equal(req.altcloud.rules, 'user3')
  })
})

test('load rules for actual path if it is an alt format', function (t) {
  t.plan(3)

  // rule is for /example.md, but request is for /example
  const req = httpMocks.createRequest({
    method: 'GET',
    url: '/example',
    altcloud: {
      actualPath: '/example.md'
    }
  })

  const res = httpMocks.createResponse()

  const handler = accessRules({root: `${__dirname}/data/`})

  handler(req, res, function (err) {
    t.error(err)
    t.ok(req.altcloud)
    t.equal(req.altcloud.rules, 'all')
  })
})

test('substitute user variables', function (t) {
  t.plan(3)

  // rule is for /example.md, but request is for /example
  const req = httpMocks.createRequest({
    method: 'GET',
    url: '/someuser/secrets.txt'
  })

  const res = httpMocks.createResponse()

  const handler = accessRules({root: `${__dirname}/data/`})

  handler(req, res, function (err) {
    t.error(err)
    t.ok(req.altcloud)
    t.equal(req.altcloud.rules, 'someuser')
  })
})

test('substitute user variables for subdirs, too', function (t) {
  t.plan(3)

  // rule is for /example.md, but request is for /example
  const req = httpMocks.createRequest({
    method: 'GET',
    url: '/sub2/user1/test.txt'
  })

  const res = httpMocks.createResponse()

  const handler = accessRules({root: `${__dirname}/data/`})

  handler(req, res, function (err) {
    t.error(err)
    t.ok(req.altcloud)
    t.equal(req.altcloud.rules, 'user1')
  })
})
