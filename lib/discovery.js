// hack for polo to work
process.EventEmitter = {
  prototype: require('events').prototype
}
const polo = require('polo')

module.exports = function(opts) {
  const services = polo(opts)

  const scan = function(cb) {
    let serviceList = []
    const onUp = function(name, service) {
      serviceList.push(service)
    }
    const emitter = watch(onUp)
    setTimeout(function() {
      cb(null, serviceList)
    }, 1000)
  }

  const watch = function(upListener, downListener) {
    if (upListener) services.on('up', upListener)
    if (downListener) services.on('down', downListener)
    // services.on('up', function(name, service) { // up fires everytime some service joins
    // 	// console.log(services.get(name))
    //   console.log(`${service.name} is available at ${service.proto}://${service.address}`)
    //   if (upListener) services.on('up', upListener)
    // })
    // services.on('down', function(name, service) { // up fires everytime some service joins
    // 	// console.log(services.get(name))
    //   console.log(`${service.name} is no longer available at ${service.proto}://${service.address}`)
    //   if (downListener) services.on('down', downListener)
    // })
    return services
  }

  return {
    watch: watch,
    scan: scan,
    put: services.put
  }
}
