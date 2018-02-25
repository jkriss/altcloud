const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const fs = require('fs')
const Stripe = require('stripe')
const mkdirp = require('mkdirp')
const yaml = require('js-yaml')
const rp = require('request-promise')

module.exports = function (opts) {
  const app = express()
  app.use(require("body-parser").json());

  let stripeClients = {}

  app.post('/:org/charge/:item', (req, res) => {

    try {
      const stripeConfig = yaml.safeLoad(fs.readFileSync(path.join(opts.root, '.stripe'), 'utf8'))
      const items = stripeConfig.items

      const itemName = req.params.item
      const org = req.params.org
      console.log(`charging ${req.params.item} via ${req.params.org}, referrer: ${req.headers.referer}, body: ${req.body}`)
      const orgConfig = stripeConfig[org]
      const item = stripeConfig.items[itemName]
      if (item) {
        console.log("item:", item)
        const amount = req.body.amount
        if (amount < item.price) {
          console.log(`tried to pay ${amount} for an item priced at ${item.price}`)
          return req.sendStatus(400)
        }

        let stripe = stripeClients[org]
        if (!stripe) {
          const keyPublishable = orgConfig.publishable_key;
          const keySecret = orgConfig.secret_key;
          stripe = Stripe(keySecret);
          stripeClients[org]
        }

        let chargeCustomer

        stripe.customers.create({
          email: req.body.token.email,
          source: req.body.token.id
        })
        .then(customer => {
          // console.log("created customer:", customer)
          chargeCustomer = customer
          return stripe.charges.create({
            amount,
            description: item.description,
               currency: "usd",
               customer: customer.id
          })
        })
        .then(charge => {
          // console.log("created charge:", charge)
          const logDir = orgConfig.log_dir || '.stripe_logs'
          mkdirp.sync(logDir)
          fs.appendFile(path.join(logDir, '.charges'), JSON.stringify(charge)+"\n", (err) => {
            if (err) console.log("Error writing charge to log:", err)
          })
          if (req.body.metadata && req.body.metadata.signup) {
            const registration = [
              new Date().toISOString(),
              chargeCustomer.email,
              charge.description,
              charge.amount,
              req.body.metadata.signup
            ]
            fs.appendFile(path.join(logDir, '.'+req.body.metadata.signup), registration.join("\t")+"\n", (err) => {
              if (err) console.log("Error writing charge to log:", err)
            })
          }
          if (orgConfig.webhooks && orgConfig.webhooks.success) {
            console.log("posting webhook to", orgConfig.webhooks.success)
            const body = {
              charge,
              customer: chargeCustomer,
              metadata: req.body.metadata
            }
            // console.log("body:", JSON.stringify(body, null, 2))
            rp({
              method: 'POST',
              uri: orgConfig.webhooks.success,
              body,
              json: true
            }).catch(err => console.log("Error posting to webhook", orgConfig.webhooks.success, err))
          }
          res.sendStatus(200)
        }).catch(err => {
          console.log(err)
          res.sendStatus(500)
        });
      } else {
        console.log("no item found called", itemName)
        res.sendStatus(404)
      }

    } catch (e) {
      console.log("!!!!", e)
    }

  })
  return app
}
