const request = require('request')
const debug = require('debug')

module.exports = (recipientId, messageText, accessToken) => {

    let messageData = { text: messageText }

    request({
            url: 'https://graph.facebook.com/v2.6/me/messages',
            qs: { access_token: accessToken },
            method: 'POST',
            json: {
                recipient: { id: recipientId },
                message: messageData,
            }
        }, function(error, response, body) {
            if (error) {
                debug.log('Error sending messages: ', error)
            } else if (response.body.error) {
                debug.log('Error: ', response.body.error)
            }
        })
        // TODO - Get data from receiver
}