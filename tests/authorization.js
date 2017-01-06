const test = require('tape')
const authorization = require('../lib/authorization')
const httpMocks = require('node-mocks-http')

test('load rules for path', function (t) {
  t.plan(4)

  const req = httpMocks.createRequest({
    method: 'GET',
    url: '/user1secrets.txt'
  })

  const res = httpMocks.createResponse()

  const handler = authorization({root: `${__dirname}/data/`})

  handler(req, res, function (err) {
    t.error(err)
    t.ok(req.altcloud)
    t.ok(req.altcloud.rules)
    t.equal(req.altcloud.rules.read, 'user1')
  })
})

test('load rules from parent dir if not present', function (t) {
  t.plan(4)

  const req = httpMocks.createRequest({
    method: 'GET',
    url: '/sub1/user2secrets.txt'
  })

  const res = httpMocks.createResponse()

  const handler = authorization({root: `${__dirname}/data/`})

  handler(req, res, function (err) {
    t.error(err)
    t.ok(req.altcloud)
    t.ok(req.altcloud.rules)
    t.equal(req.altcloud.rules.read, 'user2')
  })
})

test('prefer current dir access file', function (t) {
  t.plan(4)

  const req = httpMocks.createRequest({
    method: 'GET',
    url: '/sub2/user3secrets.txt'
  })

  const res = httpMocks.createResponse()

  const handler = authorization({root: `${__dirname}/data/`})

  handler(req, res, function (err) {
    t.error(err)
    t.ok(req.altcloud)
    t.ok(req.altcloud.rules)
    t.equal(req.altcloud.rules.read, 'user3')
  })
})

test('load rules for actual path if it is an alt format', function (t) {
  t.plan(4)

  // rule is for /example.md, but request is for /example
  const req = httpMocks.createRequest({
    method: 'GET',
    url: '/example',
    altcloud: {
      actualPath: '/example.md'
    }
  })

  const res = httpMocks.createResponse()

  const handler = authorization({root: `${__dirname}/data/`})

  handler(req, res, function (err) {
    t.error(err)
    t.ok(req.altcloud)
    t.ok(req.altcloud.rules)
    t.equal(req.altcloud.rules.read, 'all')
  })
})
