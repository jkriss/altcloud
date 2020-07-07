const cookieAuth = require('../cookie-auth')

function getLink (user, opts) {
  console.log('making link for', user)

  const cookies = cookieAuth(opts)

  const hours = 24
  const token = cookies.makeToken(user, {
    exp: Math.floor(Date.now() / 1000) + hours * 60 * 60
  })
  console.log(`/auth/link?token=${token}`)
}

module.exports = getLink
