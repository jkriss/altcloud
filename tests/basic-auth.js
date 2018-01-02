const test = require('tape')
const basicAuth = require('../lib/basic-auth')
const httpMocks = require('node-mocks-http')

test('set user if credentials are valid', function(t) {
  t.plan(2)

  const req = httpMocks.createRequest({
    method: 'GET',
    url: '/',
    headers: {
      Authorization:
        'Basic ' + new Buffer('user1:test', 'utf8').toString('base64')
    }
  })

  const res = httpMocks.createResponse()

  const handler = basicAuth({ root: `${__dirname}/data/` })

  handler(req, res, function(err) {
    t.error(err)
    t.equal(req.user, 'user1')
  })
})

test("don't set user if credentials aren't present", function(t) {
  t.plan(2)

  const req = httpMocks.createRequest({
    method: 'GET',
    url: '/'
  })

  const res = httpMocks.createResponse()

  const handler = basicAuth({ root: `${__dirname}/data/` })

  handler(req, res, function(err) {
    t.error(err)
    t.false(req.user)
  })
})

test("return unauthorized if credentials aren't valid", function(t) {
  t.plan(2)

  const req = httpMocks.createRequest({
    method: 'GET',
    url: '/',
    headers: {
      Authorization:
        'Basic ' + new Buffer('user1:badpass', 'utf8').toString('base64')
    }
  })

  const res = httpMocks.createResponse()

  const handler = basicAuth({ root: `${__dirname}/data/` })

  handler(req, res, function(err) {
    t.ok(err)
    t.equal(err.status, 401)
  })
})
