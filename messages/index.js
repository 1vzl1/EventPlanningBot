/*-----------------------------------------------------------------------------
This template demonstrates how to use an IntentDialog with a LuisRecognizer to add 
natural language support to a bot. 
For a complete walkthrough of creating this type of bot see the article at
http://docs.botframework.com/builder/node/guides/understanding-natural-language/
-----------------------------------------------------------------------------*/
"use strict";
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");

var useEmulator = (process.env.NODE_ENV == 'development');

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

var bot = new builder.UniversalBot(connector);

// Make sure you add code to validate these fields
var luisAppId = process.env.LuisAppId;
var luisAPIKey = process.env.LuisAPIKey;
var luisAPIHostName = process.env.LuisAPIHostName || 'api.projectoxford.ai';

const LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v1/application?id=' + luisAppId + '&subscription-key=' + luisAPIKey;

//YP API
var url = 'http://api.yellowapi.com/FindBusiness/?what=barber&where=Canada&fmt=JSON&pgLen=1&apikey=yek5f7zjg79dwv6udsdpwtxa';
var request = require('request');

// Main dialog with LUIS
var recognizer = new builder.LuisRecognizer(LuisModelUrl);
var intents = new builder.IntentDialog({ recognizers: [recognizer] })
/*
.matches('<yourIntent>')... See details at http://docs.botframework.com/builder/node/guides/understanding-natural-language/
*/
.matches('None', (session, args) => {
    session.send('Hi! This is the None intent handler. You said: \'%s\'.', session.message.text);
})

.matches('event_suggestion', [
    function (session, args) {
        builder.Prompts.text(session, "What date is your event?");
    },
    function (session, args){
        builder.Prompts.text(session, "How many people do you expect?");
    },
    function (session, results) {
        session.send("Ok let me search available options for %s people...", results.response);
        url = 'http://api.yellowapi.com/FindBusiness/?what=barber&where=Canada&fmt=JSON&pgLen=1&apikey=yek5f7zjg79dwv6udsdpwtxa';
        request(url, function(e,r,b){
            session.send('body');
        })
    }
])

.matches('book_service', [
    function (session, args, next) {
        var service = builder.EntityRecognizer.findEntity(args.entities, 'service');
        var location = builder.EntityRecognizer.findEntity(args.entities, 'location');
        if (!location) {
            builder.Prompts.text(session, "Where is your event located?");
        } else {
            next({ response: service.entity });
        }
    },
    function (session, results) {
        if (results.response) {
            session.send("Ok... searching for '%s' businesses.", results.response);
        } else {
            session.send("Ok");
        }
    }        
])

.onDefault((session) => {
    session.send('Sorry, I did not understand \'%s\'.', session.message.text);
});

bot.dialog('/', intents);    

if (useEmulator) {
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());    
} else {
    module.exports = { default: connector.listen() }
}

