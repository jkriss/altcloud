const test = require('tape')
const config = require('../lib/config')
const httpMocks = require('node-mocks-http')

test('load additional config data if present', function (t) {
  t.plan(2)

  const req = httpMocks.createRequest({
    method: 'GET',
    url: '/'
  })

  const res = httpMocks.createResponse()

  const handler = config({root: `${__dirname}/data/`})

  handler(req, res, function (err) {
    t.error(err)
    t.equal(req.altcloud.config.foo, 'bar')
  })
})
