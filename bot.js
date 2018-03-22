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
const establishConnection = conn()
let userFName = ''
let userLName = ''

establishConnection.then((connectionEstablished) => {
    receiver(connectionEstablished)
})

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}))


// Webhook validation.
app.get('/webhook', function(req, res) {
    res.status(200).send(req.query['hub.challenge'])
})

// Message processing
app.post('/webhook', function(req, res) {
    const data = req.body

    // Make sure this is a page subscription
    if (data.object === 'page') {

        data.entry.forEach(function(entry) {
            entry.messaging.forEach(function(event) {
                if (event.message) {
                    receivedMessage(event)
                } else {
                    debug.log('Webhook received unknown event: ', event)
                }
            })
        })


        res.sendStatus(200)
    }
})

// Incoming events handling
function receivedMessage(event) {
    console.log(event)
    const senderID = event.sender.id
    const message = event.message
    const messageText = message.text
    const timestamp = event.timestamp
    const messageAttachments = message.attachments
    const messageId = message.mid

    const messageData = {
        'messageid': messageId,
        'content': messageText,
        'timestamp': timestamp.toString(),
        'userid': senderID
    }

    if (messageText) {
        establishConnection.then((connectionEstablished) => {
            publisher(connectionEstablished, messageData)
        })
    }
}


// Set Express to listen out for HTTP requests
const server = app.listen(process.env.PORT, function() {
    debug.log('Listening on port %s', server.address().port)
})