const test = require('tape')
const cookieAuth = require('../lib/cookie-auth')
const httpMocks = require('node-mocks-http')

test('set user if cookie is valid', function (t) {
  t.plan(2)

  const cookies = cookieAuth({root: `${__dirname}/data/`, sessionCookieName: '_s'})

  const req = httpMocks.createRequest({
    method: 'GET',
    url: '/',
    cookies: {
      '_s': cookies.makeToken('user1')
    }
  })

  const res = httpMocks.createResponse()

  const handler = cookies.checkCookie

  handler(req, res, function (err) {
    t.error(err)
    t.equal(req.user, 'user1')
  })
})
