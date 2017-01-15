const test = require('tape')
const vhosts = require('../lib/vhosts')
const httpMocks = require('node-mocks-http')

test('load full subdomain directory if present', function (t) {
  t.plan(2)

  const req = httpMocks.createRequest({
    method: 'GET',
    url: '/',
    hostname: 'subdomain2.example.com'
  })

  const res = httpMocks.createResponse()

  const handler = vhosts({root: `${__dirname}/data/`})

  handler(req, res, function (err) {
    t.error(err)
    t.equal(req.url, '/subdomain2.example.com/')
  })
})

test('allow just the subdomain as a subfolder', function (t) {
  t.plan(2)

  const req = httpMocks.createRequest({
    method: 'GET',
    url: '/',
    hostname: 'subdomain1.example.com'
  })

  const res = httpMocks.createResponse()

  const handler = vhosts({root: `${__dirname}/data/`})

  handler(req, res, function (err) {
    t.error(err)
    t.equal(req.url, '/subdomain1/')
  })
})

test('allow multiple levels in a subdomain', function (t) {
  t.plan(2)

  const req = httpMocks.createRequest({
    method: 'GET',
    url: '/',
    hostname: 'subB.subA.example.com'
  })

  const res = httpMocks.createResponse()

  const handler = vhosts({root: `${__dirname}/data/`})

  handler(req, res, function (err) {
    t.error(err)
    t.equal(req.url, '/subA/subB/')
  })
})

test("don't die if it's just an ip address and not a regular domain name", function (t) {
  t.plan(2)

  const req = httpMocks.createRequest({
    method: 'GET',
    url: '/',
    hostname: '127.0.0.1'
  })

  const res = httpMocks.createResponse()

  const handler = vhosts({root: `${__dirname}/data/`})

  handler(req, res, function (err) {
    t.error(err)
    t.equal(req.url, '/')
  })
})

test('work with localhost subdomain', function (t) {
  t.plan(2)

  const req = httpMocks.createRequest({
    method: 'GET',
    url: '/',
    hostname: 'subdomain1.localhost'
  })

  const res = httpMocks.createResponse()

  const handler = vhosts({root: `${__dirname}/data/`})

  handler(req, res, function (err) {
    t.error(err)
    t.equal(req.url, '/subdomain1/')
  })
})

test("send 404 immediately if the hostname isn't found", function (t) {
  t.plan(2)

  const req = httpMocks.createRequest({
    method: 'GET',
    url: '/',
    hostname: 'nope.example.com'
  })

  const res = httpMocks.createResponse()

  const handler = vhosts({root: `${__dirname}/data/`})

  handler(req, res, function (err) {
    t.ok(err)
    t.equal(err.status, 404)
  })
})

test("don't worry about specific files existing, just the dir", function (t) {
  t.plan(2)

  const req = httpMocks.createRequest({
    method: 'GET',
    url: '/index',
    hostname: 'subdomain1.example.com'
  })

  const res = httpMocks.createResponse()

  const handler = vhosts({root: `${__dirname}/data/`})

  handler(req, res, function (err) {
    t.error(err)
    t.equal(req.url, '/subdomain1/index')
  })
})
