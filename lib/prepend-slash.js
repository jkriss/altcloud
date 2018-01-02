module.exports = function(string) {
  return string[0] === '/' ? string : '/' + string
}
