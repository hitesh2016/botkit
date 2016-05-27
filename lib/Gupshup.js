var Botkit = require(__dirname + '/CoreBot.js');
var request = require('request');
var express = require('express');
var bodyParser = require('body-parser');

function Gupshupbot(configuration) {

    // Create a core botkit bot
    var gupshup_botkit = Botkit(configuration || {});

    // customize the bot definition, which will be used when new connections
    // spawn!
    gupshup_botkit.defineBot(function(botkit, config) {
    	var bot = {
            botkit: botkit,
            config: config || {},
            utterances: botkit.utterances,
        };

        bot.sendMessage = function(botname, context, text, cb) {
            var data = "context=" + escape(JSON.stringify(context)) + "&message=" + escape(text);
            request.post({
                url: 'https://api.gupshup.io/sm/api/bot/' + botname + '/msg',
                headers: {'Content-Type': 'application/x-www-form-urlencoded', 
                           'apikey': configuration.apikey}, 
                body: data
            }, function(error, response, body){
                if(error) {
                    gupshup_botkit.log('** Error in sendMessage : Error: ' + error);
                } else {
                    gupshup_botkit.log('** Complete sendMessage : Status:' + response.statusCode + ':' + body);
                }
            });
        }

        bot.reply = function(src, resp, cb) {
            bot.sendMessage(src.botname, src.context, resp, cb);
        };

        return bot;
    });    

    gupshup_botkit.setupWebserver = function(port, cb) {

        if (!port) {
            throw new Error('Cannot start webserver without a port');
        }
        if (isNaN(port)) {
            throw new Error('Specified port is not a valid number');
        }

        gupshup_botkit.config.port = port;

        gupshup_botkit.webserver = express();
        gupshup_botkit.webserver.use(bodyParser.json());
        gupshup_botkit.webserver.use(bodyParser.urlencoded({ extended: true }));
        gupshup_botkit.webserver.use(express.static(__dirname + '/public'));

        var server = gupshup_botkit.webserver.listen(
            gupshup_botkit.config.port,
            function() {
                gupshup_botkit.log('** Starting webserver on port ' +
                    gupshup_botkit.config.port);
                if (cb) { cb(null, gupshup_botkit.webserver); }
            });

        return gupshup_botkit;
    };


    // set up a web route for receiving messages from gupshup omnichannels
    gupshup_botkit.createWebhookEndpoints = function(webserver, bot, cb) {

        gupshup_botkit.log('Setting up webhook');

        //GET method invoked by gupshup platform when anyone sends message to the bot
        webserver.get('/gupshup/receive', function(req, res) {
            gupshup_botkit.debug('GOT A MESSAGE HOOK');

            //parsing the request
            var message = {
            	botname: req.query.botname,
            	context: JSON.parse(req.query.contextobj),
            	user: JSON.parse(req.query.senderobj),
            	body: JSON.parse(req.query.messageobj)
            }

            if(message.body.type=="msg"){
            	//Handlers for message is triggered
            	message.text=message.body.text;
            	gupshup_botkit.trigger('message_received', [bot, message]);
            }else if(message.body.type=="image"){
            	//Handlers for image is triggered
         		gupshup_botkit.trigger('image_received', [bot, message]);
            }else if(message.body.type=="location"){
            	//Handlers for location is triggered
         		gupshup_botkit.trigger('location_received', [bot, message]);         		
            }else if(message.body.type=="event"){
            	//Handler for events such as botmappedevent gets triggered
            	gupshup_botkit.trigger(message.body.text, [bot, message]);
            }
            res.status(200).send();
        });


        if (cb) {
            cb();
        }

        return gupshup_botkit;
    };

    return gupshup_botkit;
};

module.exports = Gupshupbot;
