const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const fs = require('fs')
const Stripe = require('stripe')
const mkdirp = require('mkdirp')
const yaml = require('js-yaml')
const rp = require('request-promise')

module.exports = function(opts) {
  const app = express()
  app.use(require('body-parser').json())

  let stripeClients = {}

  const loadConfig = function() {
    return yaml.safeLoad(
      fs.readFileSync(path.join(opts.root, '.stripe'), 'utf8')
    )
  }

  const validateItem = function(stripeConfig, itemName, chargedPrice) {
    const items = stripeConfig.items
    const item = items[itemName]
    if (item) {
      if (chargedPrice < item.price) {
        console.log(
          `tried to pay ${chargedPrice} for an item priced at ${item.price}`
        )
        return false
      } else {
        return true
      }
    } else {
      console.log(`item ${itemName} not found`)
      return false
    }
  }

  const validateOrder = function(stripeConfig, order) {
    const chargedTotal = order.total
    let calculatedTotal = 0
    if (!order.items) {
      console.log('no items found in order')
      return false
    }
    for (let i = 0; i < order.items.length; i++) {
      const item = order.items[i]
      if (!validateItem(stripeConfig, item.name, item.subtotal / item.quantity))
        return false
      calculatedTotal += item.subtotal
    }
    // console.log("charged total", chargedTotal, "calculated total", calculatedTotal)
    return chargedTotal === calculatedTotal
  }

  const makeCharge = function(stripeConfig, org, customerData, chargeData) {
    const items = stripeConfig.items
    const orgConfig = stripeConfig[org]

    let stripe = stripeClients[org]
    if (!stripe) {
      const keyPublishable = orgConfig.publishable_key
      const keySecret = orgConfig.secret_key
      stripe = Stripe(keySecret)
      stripeClients[org]
    }

    return stripe.customers
      .create(customerData)
      .then(customer => {
        // console.log("created customer:", customer)
        chargeData.customer = customer.id
        if (
          !chargeData.statement_descriptor &&
          orgConfig.statement_descriptor
        ) {
          chargeData.statement_descriptor = orgConfig.statement_descriptor
        }
        return stripe.charges.create(chargeData)
      })
      .then(charge => {
        // console.log("created charge:", charge)
        const logDir = orgConfig.log_dir || '.stripe_logs'
        mkdirp.sync(logDir)
        fs.appendFile(
          path.join(logDir, '.charges'),
          JSON.stringify(charge) + '\n',
          err => {
            if (err) console.log('Error writing charge to log:', err)
          }
        )
        if (orgConfig.webhooks && orgConfig.webhooks.success) {
          console.log('posting webhook to', orgConfig.webhooks.success)
          // console.log("body:", JSON.stringify(body, null, 2))
          rp({
            method: 'POST',
            uri: orgConfig.webhooks.success,
            body: charge,
            json: true
          })
        }
        return charge
      })
  }

  app.post('/:org/charge/order', (req, res) => {
    console.log('handling order')
    try {
      const stripeConfig = loadConfig()

      if (!validateOrder(stripeConfig, req.body.order)) {
        return res.sendStatus(400)
      }

      const customerData = {
        email: req.body.token.email,
        source: req.body.token.id
      }
      const chargeData = {
        amount: req.body.amount,
        description: req.body.description,
        currency: 'usd',
        receipt_email: req.body.token.email
      }
      if (req.body.metadata) chargeData.metadata = req.body.metadata
      if (req.body.statement_descriptor) {
        chargeData.statement_descriptor = req.body.statement_descriptor
      }

      makeCharge(stripeConfig, req.params.org, customerData, chargeData)
        .then(charge => res.sendStatus(200))
        .catch(err => {
          console.log(err)
          res.sendStatus(500)
        })
    } catch (e) {
      console.log('!!!!', e)
    }
  })

  app.post('/:org/charge/:item', (req, res) => {
    console.log('handling item')

    try {
      const stripeConfig = loadConfig()

      if (
        !validateItem(stripeConfig, req.params.item, req.body.metadata.order)
      ) {
        return res.sendStatus(400)
      }

      const customerData = {
        email: req.body.token.email,
        source: req.body.token.id
      }
      const chargeData = {
        amount: req.body.amount,
        description: req.body.description,
        currency: 'usd',
        receipt_email: req.body.token.email
      }

      if (req.body.metadata) chargeData.metadata = req.body.metadata

      makeCharge(stripeConfig, req.params.org, customerData, chargeData)
        .then(charge => res.sendStatus(200))
        .catch(err => {
          console.log(err)
          res.sendStatus(500)
        })
    } catch (e) {
      console.log('!!!!', e)
    }
  })
  return app
}
