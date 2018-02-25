const test = require('tape')
const accessEnforcement = require('../lib/access-enforcement')
const httpMocks = require('node-mocks-http')

test('let unauthed users view an unrestricted resource', function(t) {
  t.plan(2)

  const req = httpMocks.createRequest({
    method: 'GET',
    url: '/example'
  })

  const res = httpMocks.createResponse()

  const handler = accessEnforcement({ root: `${__dirname}/data/` })

  handler(req, res, function(err) {
    t.error(err)
    t.equals(res.statusCode, 200)
  })
})

test("don't let unauthed users view a restricted resource", function(t) {
  t.plan(2)

  const req = httpMocks.createRequest({
    method: 'GET',
    url: '/user1secrets.txt',
    altcloud: {
      rules: 'user1'
    }
  })

  const res = httpMocks.createResponse()

  const handler = accessEnforcement({ root: `${__dirname}/data/` })

  // don't leak info–return 404 if not authorized
  handler(req, res, function(err) {
    t.ok(err)
    t.equals(err.status, 404)
  })
})

test("let authed users view a restricted resource if they're on the list", function(t) {
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

  const handler = accessEnforcement({ root: `${__dirname}/data/` })

  handler(req, res, function(err) {
    t.error(err)
    t.equals(res.statusCode, 200)
  })
})

test("let authed users view a restricted resource if they're on a list with multiple users", function(t) {
  t.plan(2)

  const req = httpMocks.createRequest({
    method: 'GET',
    url: '/another-secret.txt',
    user: 'user1',
    altcloud: {
      rules: ['user1', 'user2']
    }
  })

  const res = httpMocks.createResponse()

  const handler = accessEnforcement({ root: `${__dirname}/data/` })

  handler(req, res, function(err) {
    t.error(err)
    t.equals(res.statusCode, 200)
  })
})

test("let authed users view a restricted resource if there's an 'authenticated' rule", function(t) {
  t.plan(2)

  const req = httpMocks.createRequest({
    method: 'GET',
    url: '/loggedin',
    user: 'user1',
    altcloud: {
      rules: 'authenticated'
    }
  })

  const res = httpMocks.createResponse()

  const handler = accessEnforcement({ root: `${__dirname}/data/` })

  handler(req, res, function(err) {
    t.error(err)
    t.equals(res.statusCode, 200)
  })
})

test("don't let unauthed users view a restricted resource if they're not on the list, even if 'authenticated' is", function(t) {
  t.plan(2)

  const req = httpMocks.createRequest({
    method: 'GET',
    url: '/loggedin',
    altcloud: {
      rules: 'authenticated'
    }
  })

  const res = httpMocks.createResponse()

  const handler = accessEnforcement({ root: `${__dirname}/data/` })

  // don't leak info–return 404 if not authorized
  handler(req, res, function(err) {
    t.ok(err, 'should throw an error')
    t.equals(err && err.status, 404)
  })
})

test("don't let authed users view a restricted resource if they're not on the list", function(t) {
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

  const handler = accessEnforcement({ root: `${__dirname}/data/` })

  // don't leak info–return 404 if not authorized
  handler(req, res, function(err) {
    t.ok(err)
    t.equals(err.status, 404)
  })
})

test("don't let people view .access if there's no rule for it", function(t) {
  t.plan(2)

  const req = httpMocks.createRequest({
    method: 'GET',
    url: '/.access',
    user: 'user2'
  })

  const res = httpMocks.createResponse()

  const handler = accessEnforcement({ root: `${__dirname}/data/` })

  // don't leak info–return 404 if not authorized
  handler(req, res, function(err) {
    t.ok(err)
    t.equals(err.status, 404)
  })
})

test("don't let people view .tokens if there's no rule for it", function(t) {
  t.plan(2)

  const req = httpMocks.createRequest({
    method: 'GET',
    url: '/.tokens',
    user: 'user2'
  })

  const res = httpMocks.createResponse()

  const handler = accessEnforcement({ root: `${__dirname}/data/` })

  // don't leak info–return 404 if not authorized
  handler(req, res, function(err) {
    t.ok(err)
    t.equals(err.status, 404)
  })
})

test("don't let people view .keys/private.key if there's no rule for it", function(t) {
  t.plan(2)

  const req = httpMocks.createRequest({
    method: 'GET',
    url: '/.keys/private.key',
    user: 'user2'
  })

  const res = httpMocks.createResponse()

  const handler = accessEnforcement({ root: `${__dirname}/data/` })

  // don't leak info–return 404 if not authorized
  handler(req, res, function(err) {
    t.ok(err)
    t.equals(err.status, 404)
  })
})

test("don't let people view .keys/private.key EVER", function(t) {
  t.plan(2)

  const req = httpMocks.createRequest({
    method: 'GET',
    url: '/.keys/private.key',
    user: 'user2',
    altcloud: {
      rules: 'user2'
    }
  })

  const res = httpMocks.createResponse()

  const handler = accessEnforcement({ root: `${__dirname}/data/` })

  // don't leak info–return 404 if not authorized
  handler(req, res, function(err) {
    t.ok(err)
    t.equals(err.status, 404)
  })
})

test("let people view .keys/public.pem if it's explicitly allowed", function(t) {
  t.plan(2)

  const req = httpMocks.createRequest({
    method: 'GET',
    url: '/.keys/public.pem',
    altcloud: {
      rules: 'all'
    }
  })

  const res = httpMocks.createResponse()

  const handler = accessEnforcement({ root: `${__dirname}/data/` })

  // don't leak info–return 404 if not authorized
  handler(req, res, function(err) {
    t.error(err)
    t.equals(res.statusCode, 200)
  })
})
