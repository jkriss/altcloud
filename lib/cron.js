const fs = require('fs')
const yaml = require('js-yaml')
const Path = require('path')
const CronJob = require('cron').CronJob
const cronParser = require('cron-parser')
const friendlyCron = require('./friendly-cron')
const spawn = require('child_process').spawn

module.exports = function (opts) {
  const logger = opts.logger
  let jobs = []
  // read the .cron file for the schedule
  // watch the file for changes? or just make people restart? latter is fine for now.
  fs.readFile(Path.join(opts.root, '.cron'), 'utf8', function (err, data) {
    if (err) {
      if (err.code !== 'ENOENT') logger.warn('Error reading .cron file', err)
    } else {
      const cronJobs = yaml.safeLoad(data)
      console.log('loaded cron jobs:', cronJobs)
      Object.keys(cronJobs).forEach(function (name) {
        const job = cronJobs[name]
        // try running it through friendly cron
        if (friendlyCron(job.pattern)) job.pattern = friendlyCron(job.pattern)
        logger.info(`-- loading cron job ${name} --`)
        const interval = cronParser.parseExpression(job.pattern)
        logger.info(`
          job will run at:
            ${interval.next().toString()},
            ${interval.next().toString()},
            ${interval.next().toString()},
            etc.
        `)
        jobs.push(new CronJob(job.pattern, function () {
          logger.info(`-- running cron job ${name} --`)
          let commandParts = job.command.split(' ')
          const firstCommand = commandParts.shift()
          const cmd = spawn(firstCommand, commandParts, job.options)
          cmd.stdout.on('data', (data) => {
            logger.info(`cron job ${name}: ${data}`)
          })

          cmd.stderr.on('data', (data) => {
            logger.warn(`cron job ${name} error: ${data}`)
          })

          cmd.on('close', (code) => {
            logger.info(`-- cron job ${name} exited with code ${code} --`)
          })
        }, null, true, 'America/Los_Angeles'))
      })
    }
  })
}
