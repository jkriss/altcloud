const test = require('tape')
const frontMatter = require('../lib/front-matter')
const httpMocks = require('node-mocks-http')

test('parse front matter', function(t) {
  t.plan(3)

  const req = httpMocks.createRequest({
    method: 'GET',
    url: '/example.md'
  })

  const res = httpMocks.createResponse()

  const handler = frontMatter({ root: `${__dirname}/data/` })

  handler(req, res, function(err) {
    t.error(err)
    t.equal(req.altcloud.attributes.title, 'test file')
    t.equal(req.altcloud.fileContents, 'markdown content')
  })
})

test('parse front matter for html files, too', function(t) {
  t.plan(3)

  const req = httpMocks.createRequest({
    method: 'GET',
    url: '/example.html'
  })

  const res = httpMocks.createResponse()

  const handler = frontMatter({ root: `${__dirname}/data/` })

  handler(req, res, function(err) {
    t.error(err)
    t.equal(req.altcloud.attributes.title, 'another test file')
    t.equal(req.altcloud.fileContents, '<h1>html content</h1>')
  })
})
