const test = require('tape')
const collections = require('../lib/collections')
const httpMocks = require('node-mocks-http')

test('fetch data files under a path as a single json file', function (t) {
  t.plan(4)

  const req = httpMocks.createRequest({
    method: 'GET',
    url: '/test-collection.json',
    altcloud: {
      collection: true
    }
  })

  const res = httpMocks.createResponse()

  const handler = collections({root: `${__dirname}/data/`})

  handler(req, res, function (err) {
    t.error(err)
    t.equals(res.statusCode, 200)
    var result = JSON.parse(res.body)
    t.equals(result.thing1.name, 'thing1')
    t.equals(result.thing2.name, 'thing2')
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
    t.equals(res.statusCode, 404)
  })
})
