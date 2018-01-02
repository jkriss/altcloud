// const test = require('tape')
// const staticFiles = require('../lib/static')
// const httpMocks = require('node-mocks-http')
//
// test('forward to dir', function (t) {
//   t.plan(2)
//
//   const req = httpMocks.createRequest({
//     method: 'GET',
//     url: '/sub1'
//   })
//
//   const res = httpMocks.createResponse()
//
//   const handler = staticFiles({root: `${__dirname}/data/`})
//
//   handler(req, res, function (err) {
//     t.error(err)
//     t.equal(req.url, '/sub1/')
//   })
// })
//
// test('forward to dir with a subdomain', function (t) {
//   t.plan(2)
//
//   const req = httpMocks.createRequest({
//     method: 'GET',
//     url: '/sub1.1',
//     hostname: 'sub1.example.com'
//   })
//
//   const res = httpMocks.createResponse()
//
//   const handler = staticFiles({root: `${__dirname}/data/`})
//
//   handler(req, res, function (err) {
//     t.error(err)
//     t.equal(req.url, '/sub1/sub1.1/')
//   })
// })
