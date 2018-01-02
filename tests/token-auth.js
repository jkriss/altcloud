const test = require('tape')
const tokenAuth = require('../lib/token-auth')
const httpMocks = require('node-mocks-http')

test('set user if token is valid', function(t) {
  t.plan(2)

  const req = httpMocks.createRequest({
    method: 'GET',
    url: '/',
    query: {
      token: 'bff4aee0447777ed40f7bf56aeb34e894fbcfaeb0ef09445033f431f7613cf4a'
    }
  })

  const res = httpMocks.createResponse()

  const handler = tokenAuth({ root: `${__dirname}/data/` })

  handler(req, res, function(err) {
    t.error(err)
    t.equal(req.user, 'user1')
  })
})

test("return unauthorized if credentials aren't valid", function(t) {
  t.plan(2)

  const req = httpMocks.createRequest({
    method: 'GET',
    url: '/',
    query: {
      token: 'badtoken'
    }
  })

  const res = httpMocks.createResponse()

  const handler = tokenAuth({ root: `${__dirname}/data/` })

  handler(req, res, function(err) {
    t.ok(err)
    t.equal(err.status, 401)
  })
})

test("don't set user if no token present", function(t) {
  t.plan(2)

  const req = httpMocks.createRequest({
    method: 'GET',
    url: '/'
  })

  const res = httpMocks.createResponse()

  const handler = tokenAuth({ root: `${__dirname}/data/` })

  handler(req, res, function(err) {
    t.error(err)
    t.false(req.user)
  })
})
