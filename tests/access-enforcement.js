const test = require('tape')
const accessEnforcement = require('../lib/access-enforcement')
const httpMocks = require('node-mocks-http')

test('let unauthed users view an unrestricted resource', function (t) {
  t.plan(2)

  const req = httpMocks.createRequest({
    method: 'GET',
    url: '/example'
  })

  const res = httpMocks.createResponse()

  const handler = accessEnforcement({root: `${__dirname}/data/`})

  handler(req, res, function (err) {
    t.error(err)
    t.equals(res.statusCode, 200)
  })
})

test("don't let unauthed users view a restricted resource", function (t) {
  t.plan(2)

  const req = httpMocks.createRequest({
    method: 'GET',
    url: '/user1secrets.txt',
    altcloud: {
      rules: 'user1'
    }
  })

  const res = httpMocks.createResponse()

  const handler = accessEnforcement({root: `${__dirname}/data/`})

  // don't leak info–return 404 if not authorized
  handler(req, res, function (err) {
    t.ok(err)
    t.equals(err.status, 404)
  })
})

test("let authed users view a restricted resource if they're on the list", function (t) {
  t.plan(2)

  const req = httpMocks.createRequest({
    method: 'GET',
    url: '/user1secrets.txt',
    user: 'user1',
    altcloud: {
      rules: 'user1'
    }
  })

  const res = httpMocks.createResponse()

  const handler = accessEnforcement({root: `${__dirname}/data/`})

  // don't leak info–return 404 if not authorized
  handler(req, res, function (err) {
    t.error(err)
    t.equals(res.statusCode, 200)
  })
})

test("don't let authed users view a restricted resource if they're not on the list", function (t) {
  t.plan(2)

  const req = httpMocks.createRequest({
    method: 'GET',
    url: '/user1secrets.txt',
    user: 'user2',
    altcloud: {
      rules: 'user1'
    }
  })

  const res = httpMocks.createResponse()

  const handler = accessEnforcement({root: `${__dirname}/data/`})

  // don't leak info–return 404 if not authorized
  handler(req, res, function (err) {
    t.ok(err)
    t.equals(err.status, 404)
  })
})
