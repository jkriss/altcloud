module.exports = function (opts) {
  if (opts.logger) {
    return opts.logger
  } else {
    return Object.assign({}, console, { debug: console.log })
  }
}
