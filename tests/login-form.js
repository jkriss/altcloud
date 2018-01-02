const test = require('tape')
const loginForm = require('../lib/login-form')
const httpMocks = require('node-mocks-http')

test('set user if cookie is valid', function(t) {
  t.plan(3)

  const req = httpMocks.createRequest({
    method: 'POST',
    url: '/login',
    body: {
      username: 'user1',
      password: 'test'
    }
  })

  const res = httpMocks.createResponse({
    eventEmitter: require('events').EventEmitter
  })

  const handler = loginForm({
    root: `${__dirname}/data/`,
    sessionCookieName: '_s'
  })

  handler(req, res)
  res.on('end', function() {
    t.equals(res.statusCode, 200)
    t.equal(req.user, 'user1')
    t.true(res.cookies['_s'])
  })
})
