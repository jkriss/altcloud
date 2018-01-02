const test = require('tape')
const signup = require('../lib/signup')
const httpMocks = require('node-mocks-http')
const Path = require('path')
const fs = require('fs')
const yaml = require('js-yaml')
const passwords = require('../lib/passwords')

const invitationsPath = Path.join(__dirname, 'data', '.invitations')

const loadInvitations = function() {
  return yaml.safeLoad(fs.readFileSync(invitationsPath, 'utf8'))
}

test('allow new user registration with invitation token', function(t) {
  t.plan(3)

  const invitationCode = `some-invitation-code:
  expires: ${new Date().getTime() + 1000 * 60 * 60 * 24 * 2}
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

  const handler = signup({ root: `${__dirname}/data/` })

  handler(req, res, function(err) {
    t.error(err)
    t.equal(req.user, 'newuser')

    const invitations = loadInvitations()
    t.false(
      invitations['some-invitation-code'],
      'invitation should no longer be valid'
    )
    passwords.remove(`${__dirname}/data/.passwords`, 'newuser')
  })
})

test("don't allow expired invitation", function(t) {
  t.plan(3)

  // this one expired one minute ago
  const invitationCode = `some-old-invitation-code:
  expires: ${new Date().getTime() - 1000 * 60}
  `

  fs.writeFileSync(invitationsPath, invitationCode)

  const req = httpMocks.createRequest({
    method: 'POST',
    url: '/signup',
    body: {
      token: 'some-old-invitation-code',
      username: 'newuser',
      password: 'newpassword'
    }
  })

  const res = httpMocks.createResponse()

  const handler = signup({ root: `${__dirname}/data/` })

  handler(req, res, function(err) {
    t.true(err)
    t.notOk(req.user)

    const invitations = loadInvitations()
    t.false(
      invitations['some-old-invitation-code'],
      'invitation should no longer be valid'
    )
  })
})

test("don't allow bad (unlisted) token", function(t) {
  t.plan(2)

  const req = httpMocks.createRequest({
    method: 'POST',
    url: '/signup',
    body: {
      token: 'not-a-code',
      username: 'newuser',
      password: 'newpassword'
    }
  })

  const res = httpMocks.createResponse()

  const handler = signup({ root: `${__dirname}/data/` })

  handler(req, res, function(err) {
    t.true(err)
    t.notOk(req.user)
  })
})

test("don't allow signup without a token", function(t) {
  t.plan(2)

  const req = httpMocks.createRequest({
    method: 'POST',
    url: '/signup',
    body: {
      username: 'newuser',
      password: 'newpassword'
    }
  })

  const res = httpMocks.createResponse()

  const handler = signup({ root: `${__dirname}/data/` })

  handler(req, res, function(err) {
    t.true(err)
    t.notOk(req.user)
  })
})

test("don't allow bad passwords", function(t) {
  t.plan(3)

  const invitationCode = `some-invitation-code:
  expires: ${new Date().getTime() + 1000 * 60 * 60 * 24 * 2}
  `

  fs.writeFileSync(invitationsPath, invitationCode)

  const req = httpMocks.createRequest({
    method: 'POST',
    url: '/signup',
    body: {
      token: 'some-invitation-code',
      username: 'newuser',
      password: 'passw0rd'
    }
  })

  const res = httpMocks.createResponse()

  const handler = signup({ root: `${__dirname}/data/` })

  handler(req, res, function(err) {
    t.ok(err)
    t.notOk(req.user)

    const invitations = loadInvitations()
    t.true(
      invitations['some-invitation-code'],
      'invitation should still be valid'
    )
  })
})

test("don't allow passwords that are too short", function(t) {
  t.plan(3)

  const invitationCode = `some-invitation-code:
  expires: ${new Date().getTime() + 1000 * 60 * 60 * 24 * 2}
  `

  fs.writeFileSync(invitationsPath, invitationCode)

  const req = httpMocks.createRequest({
    method: 'POST',
    url: '/signup',
    body: {
      token: 'some-invitation-code',
      username: 'another-newuser',
      password: 'no'
    }
  })

  const res = httpMocks.createResponse()

  const handler = signup({ root: `${__dirname}/data/` })

  handler(req, res, function(err) {
    t.ok(err)
    t.notOk(req.user)

    const invitations = loadInvitations()
    t.true(
      invitations['some-invitation-code'],
      'invitation should still be valid'
    )
  })
})

test("don't allow passwords that include the username", function(t) {
  t.plan(3)

  const invitationCode = `some-invitation-code:
  expires: ${new Date().getTime() + 1000 * 60 * 60 * 24 * 2}
  `

  fs.writeFileSync(invitationsPath, invitationCode)

  const req = httpMocks.createRequest({
    method: 'POST',
    url: '/signup',
    body: {
      token: 'some-invitation-code',
      username: 'newuser-bad-pw',
      password: 'newuser-bad-pw-45'
    }
  })

  const res = httpMocks.createResponse()

  const handler = signup({ root: `${__dirname}/data/` })

  handler(req, res, function(err) {
    t.ok(err)
    t.notOk(req.user)

    const invitations = loadInvitations()
    t.true(
      invitations['some-invitation-code'],
      'invitation should still be valid'
    )
  })
})

test("don't allow missing password", function(t) {
  t.plan(3)

  const invitationCode = `some-invitation-code:
  expires: ${new Date().getTime() + 1000 * 60 * 60 * 24 * 2}
  `

  fs.writeFileSync(invitationsPath, invitationCode)
  passwords.remove(`${__dirname}/data/.passwords`, 'newuser')

  const req = httpMocks.createRequest({
    method: 'POST',
    url: '/signup',
    body: {
      token: 'some-invitation-code',
      username: 'newuser'
    }
  })

  const res = httpMocks.createResponse()

  const handler = signup({ root: `${__dirname}/data/` })

  handler(req, res, function(err) {
    t.ok(err)
    t.notOk(req.user)

    const invitations = loadInvitations()
    t.true(
      invitations['some-invitation-code'],
      'invitation should still be valid'
    )
  })
})

test("don't allow missing username", function(t) {
  t.plan(3)

  const invitationCode = `some-invitation-code:
  expires: ${new Date().getTime() + 1000 * 60 * 60 * 24 * 2}
  `

  fs.writeFileSync(invitationsPath, invitationCode)

  const req = httpMocks.createRequest({
    method: 'POST',
    url: '/signup',
    body: {
      token: 'some-invitation-code',
      password: 'some-password'
    }
  })

  const res = httpMocks.createResponse()

  const handler = signup({ root: `${__dirname}/data/` })

  handler(req, res, function(err) {
    t.ok(err)
    t.notOk(req.user)

    const invitations = loadInvitations()
    t.true(
      invitations['some-invitation-code'],
      'invitation should still be valid'
    )
  })
})

test("don't allow duplicate usernames", function(t) {
  t.plan(3)

  const invitationCode = `some-invitation-code:
  expires: ${new Date().getTime() + 1000 * 60 * 60 * 24 * 2}
  `

  fs.writeFileSync(invitationsPath, invitationCode)

  const req = httpMocks.createRequest({
    method: 'POST',
    url: '/signup',
    body: {
      token: 'some-invitation-code',
      username: 'user1',
      password: 'some-password'
    }
  })

  const res = httpMocks.createResponse()

  const handler = signup({ root: `${__dirname}/data/` })

  handler(req, res, function(err) {
    t.ok(err)
    t.notOk(req.user)

    const invitations = loadInvitations()
    t.true(
      invitations['some-invitation-code'],
      'invitation should still be valid'
    )
  })
})
