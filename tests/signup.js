const test = require('tape')
const signup = require('../lib/signup')
const httpMocks = require('node-mocks-http')
const Path = require('path')
const fs = require('fs')
const yaml = require('js-yaml')
const passwords = require('../lib/passwords')

const invitationsPath = Path.join(__dirname, 'data', '.invitations')

const loadInvitations = function () {
  return yaml.safeLoad(fs.readFileSync(invitationsPath, 'utf8'))
}

test('allow new user registration with invitation token', function (t) {
  t.plan(3)

  const invitationCode = `some-invitation-code:
  expires: ${new Date().getTime() + (1000 * 60 * 60 * 24 * 2)}
  `

  fs.writeFileSync(invitationsPath, invitationCode)
  passwords.remove(`${__dirname}/data/.passwords`, 'newuser')

  const req = httpMocks.createRequest({
    method: 'POST',
    url: '/signup',
    body: {
      token: 'some-invitation-code',
      username: 'newuser',
      password: 'newpassword'
    }
  })

  const res = httpMocks.createResponse()

  const handler = signup({root: `${__dirname}/data/`})

  handler(req, res, function (err) {
    t.error(err)
    t.equal(req.user, 'newuser')

    const invitations = loadInvitations()
    t.false(invitations['some-invitation-code'], 'invitation should no longer be valid')
  })
})

// test("don't allow expired invitation", function (t) {
// }

// test("don't allow bad (unlisted) token", function (t) {
// }

// test("don't allow signup without a token", function (t) {
// }

// test("don't allow bad passwords", function (t) {
// }

// test("don't allow missing password", function (t) {
// }

// test("don't allow missing username", function (t) {
// }

// test("don't allow duplicate usernames", function (t) {
// }
