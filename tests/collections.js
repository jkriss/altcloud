const test = require('tape')
const collections = require('../lib/collections')
const httpMocks = require('node-mocks-http')

test('fetch data files under a path as a single json file', function (t) {
  t.plan(2)

  const req = httpMocks.createRequest({
    method: 'GET',
    url: '/test-collection.json',
    altcloud: {
      collection: true
    }
  })

  const res = httpMocks.createResponse({
    eventEmitter: require('events').EventEmitter
  })

  const handler = collections({root: `${__dirname}/data/`})

  handler(req, res)
  res.on('end', function () {
    console.log('res body:', res._getData())
    var result = JSON.parse(res._getData())
    t.equals(result['thing1.json'].name, 'thing1')
    t.equals(result['thing2.json'].name, 'thing2')
  })
})

test("return 404 if dir doesn't exist", function (t) {
  t.plan(2)

  const req = httpMocks.createRequest({
    method: 'GET',
    url: '/nonexistent-collection.json',
    altcloud: {
      collection: true
    }
  })

  const res = httpMocks.createResponse()

  const handler = collections({root: `${__dirname}/data/`})

  handler(req, res, function (err) {
    t.ok(err)
    t.equals(err.statusCode, 404)
  })
})
