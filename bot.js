//
// This is main file containing code implementing the Express server and functionality for the Express echo bot.
//
'use strict'
const express = require('express')
const debug = require('debug')
const bodyParser = require('body-parser')
const request = require('request')
const receiver = require('./rabbit/receiver')
const publisher = require('./rabbit/publisher')
const conn = require('./rabbit/connectionService')

// The rest of the code implements the routes for our Express server.
const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
  extended: true
}))

// Webhook validation.
app.get('/webhook', function (req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
    req.query['hub.verify_token'] === process.env.VERIFY_TOKEN) {
    res.status(200).send(req.query['hub.challenge'])
  } else {
    res.sendStatus(403)
  }
})

// Message processing
app.post('/webhook', function (req, res) {
  const data = req.body

  // Make sure this is a page subscription
  if (data.object === 'page') {

    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function (entry) {

      // Iterate over each messaging event
      entry.messaging.forEach(function (event) {
        if (event.message) {
          receivedMessage(event)
        } else if (event.postback) {
          if (event.postback.payload === 'get_started') {
            receivedPostback(event)
          }
        } else {
          debug.log('Webhook received unknown event: ', event)
        }
      })
    })

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know
    // you've successfully  the callback. Otherwise, the request
    // will time out and we will keep trying to resend.
    res.sendStatus(200)
  }
})

// Incoming events handling
function receivedMessage(event) {
  var senderID = event.sender.id
  var message = event.message
  var messageText = message.text
  var messageAttachments = message.attachments
  var messageId = message.mid

  if (messageText) {
    // If we receive a text message, check to see if it matches a keyword
    // and send back the template example. Otherwise, just echo the text we received.
    conn.then(
      publisher(conn, message)
    )

    sendTextMessage(senderID, messageText)
  } else if (messageAttachments) {
    sendTextMessage(senderID, 'Message with attachment received')
  }
}

function receivedPostback(event) {
  var senderID = event.sender.id
  // When a postback is called, we'll send a message back to the sender to
  // let them know it was successful
  sendFirst(senderID, 'Postback called')
}

function sendFirst(recipientId, messageText) {

  var messageData = {
    user: {
      id: recipientId,
      // lastname: user.lastname,
      // firstname: user.firstname
    },
    message: {
      text: messageText
    },
    timestamp: {
      // time: user.timestamp
    }
  }
}


//////////////////////////
// Sending helpers
//////////////////////////
function sendTextMessage(recipientId, messageText) {

  var messageData = {
    userId: {
      id: recipientId
    },
    message: {
      text: messageText
    },
    timestamp: {
      // time: user.timestamp
    }
  }
  // TODO - Get data from receiver
}


// Set Express to listen out for HTTP requests
var server = app.listen(process.env.PORT, function () {
  debug.log('Listening on port %s', server.address().port)
})
