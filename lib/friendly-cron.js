const places = 'second minute hour day month year'.split(' ')

module.exports = function(string) {
  const match = string.match(/(\d+)? (second|minute|hour|day|month|year)/)
  if (match) {
    let pattern = Array(6).fill('*')
    const count = match[1] || 1
    const interval = match[2]
    const intervalPlace = places.indexOf(interval)
    if (count !== 1) pattern[intervalPlace] = `*/${count}`
    for (let i=intervalPlace-1; i>=0; i--) {
      pattern[i] = 0
    }
    return pattern.join(' ')
  } else {
    return null
  }
}