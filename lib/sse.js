const fs = require('fs')
const Path = require('path')

module.exports = function (opts) {

  const connectionsByPath = {}

  return function (req, res, next) {

    opts.logger.debug('-- sse ' + req.path + ' --')

    res.sseSetup = function() {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      })
    }

    res.sseSend = function(eventName, data) {
      if (!data) {
        data = eventName
        eventName = null
      }
      if (eventName) res.write("event: " + eventName + "\n")
      const payload = (typeof data === 'string') ? data : JSON.stringify(data)
      res.write("data: " + payload + "\n\n")
      res.flush()
    }

    // not just a match, but an explicit accepts
    if (req.headers.accept.indexOf('text/event-stream') != -1) {
      opts.logger.debug('handling as event stream', req.headers.accept)
      res.sseSetup()
      if (!connectionsByPath[req.path]) connectionsByPath[req.path] = []
      connectionsByPath[req.path].push(res)
      // send the contents for this path, if present
      // TODO if not present, send the file?
      if (req.altcloud && req.altcloud.fileContents) {
        res.sseSend(req.altcloud.fileContents)
      } else {
        fs.readFile(Path.join(opts.root, req.path), 'utf8', function(err, body) {
          res.sseSend(body)
        })
      }
    } else {
      // if this is a post, broadcast to the listeners
      // (or pass the collection downstream, and have the post handler tell everything else)
      // ...or a different middleware. whatever.
      // only do the push if stream: true though
      if (!req.altcloud) req.altcloud = {}
      req.altcloud.subscribers = connectionsByPath[req.path]
      opts.logger.debug('set subscribers to', req.altcloud.subscribers)
      next()
    }
  }
}