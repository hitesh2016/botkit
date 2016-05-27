/*

This is a sample Gupshup bot built with Botkit. Just follow the steps and this bot will be instantly 
available for testing via Facebook, Slack, Telegram, Twitter, HipChat, Kik, Skype, vkontakte

***** IMPORTANT ****
You will require nodejs installed and internet connection to run this sample.

If you pulled this code from github first time, navigate to the botkit folder and run 
"npm install" command, so all dependecies specified in pacakge.json are installed.
********************

1. Get gupshup apikey
	a. Goto https://gupshup.io sign in using your github account
	b. Get your apikey from the APIs tab (https://www.gupshup.io/developer/rafocm-api)
	c. Replace apikey in code below with your apikey

2. Run this sample and obtain callback URL for bot
	a. Start the sample using command "node gupshup_bot.js"
	b. Once started, it will setup bot web service and give a public url
	c. Keep this URL handy. It will be needed to setup your bot on gupshup

3. Create bot on gupshup platform and setup callback URL.
	a. Goto "My Bots" section on gupshup.io and create new bot (https://www.gupshup.io/developer/dashboard)
	b. Name you provide to your bot is unique and will be used for testing across channels.
	c. In the Develop tab, select Callback URL Radio button and enter the URL obtained in step 2 above
	d. Click "Deploy" button

4. Test your bot on facebook messenger using gupshup proxy bot
	a. Gupshup proxy bot can act as any bot created on gupshup platform with a simple command
	b. Start chat with Gupshup proxy bot at https://www.messenger.com/t/gupshupproxybot
	c. Send a message "proxy yourbotname"  (make sure you give bot name created in step 3)

Gupshup proxy bot is available on many other channels. Goto https://www.gupshup.io/developer/demobots and select 
channel of your choice to test the bot.

*/

var Botkit = require('./lib/Botkit.js');
var os = require('os');
var commandLineArgs = require('command-line-args');
var localtunnel = require('localtunnel');
var request = require("request");
const fs = require('fs');

const cli = commandLineArgs([
      {name: 'lt', alias: 'l', args: 1, description: 'Use localtunnel.me to make your bot available on the web.',
      type: Boolean, defaultValue: true},
      {name: 'ltsubdomain', alias: 's', args: 1,
      description: 'Custom subdomain for the localtunnel.me URL. This option can only be used together with --lt.',
      type: String, defaultValue: null},
   ]);

const ops = cli.parse();
if(ops.lt === false && ops.ltsubdomain !== null) {
    console.log("error: --ltsubdomain can only be used together with --lt.");
    process.exit();
}

//Your gupshup apikey goes here
var controller = Botkit.gupshupbot({
    debug: true,
    apikey: "0b6ead769ab745efc566cf302c546983"
});

var bot = controller.spawn({
});

var host = "http://localhost:3000";

//Setup call back to be regitered on gupshup platform
controller.setupWebserver(process.env.port || 3000, function(err, webserver) {
    controller.createWebhookEndpoints(webserver, bot, function() {
        console.log('ONLINE!');
        if(ops.lt) {
            var tunnel = localtunnel(process.env.port || 3000, {subdomain: ops.ltsubdomain}, function(err, tunnel) {
                if (err) {
                    console.log(err);
                    process.exit();
                }
                host = tunnel.url;
                console.log("Your bot is available on the web at the following URL: " + tunnel.url + '/gupshup/receive');
            });

            tunnel.on('close', function() {
                console.log("Your bot is no longer available on the web at the localtunnnel.me URL.");
                process.exit();
            });
        }
        else
        {
        	console.log("Your bot is available locally at the following URL: http://localhost:3000/gupshup/receive");
        }
    });
});

//When a user sends hi or helllo message
controller.hears(['hello', 'hi'], 'message_received', function(bot, message) {
    if (message.user.display) {
        bot.reply(message, 'Hello ' + message.user.display + '!!');
    } else {
        bot.reply(message, 'Hello.');
    }
});

//When a bot is mapped using gupshup proxy bot
controller.on('botmappedevent', function(bot, message) {
    bot.reply(message, 'Welcome..I am gupshup botkit bot.');
});

//When a user sends a picture 
//Receiving images is supported via  kik, facebook, hipchat, vkontakte
controller.on('image_received', function(bot, message) {
	var url = message.body.url;
	var dir = __dirname + '/public'; //Image is saved on /public folder under botkit
	var filename = '/' + new Date().getTime() + '-' + message.user.channelid + '.jpg';   //random name for image

	//making folder if doesn't exist
	if (!fs.existsSync(dir)){
	    fs.mkdirSync(dir);
	}

	//Saving image
	request(url).pipe(fs.createWriteStream( dir + filename)); 

	//Respond to user
    bot.reply(message, 'I got the picture.. and saved it');
});

//When a user sends location
//Receiving location is supported via facebook, Telegram, Line, vkontakte
controller.on('location_received', function(bot, message) {
    bot.reply(message, 'Received Location:'  + message.body.address);
    bot.reply(message, 'Lat:'  + message.body.latitude);
    bot.reply(message, 'Long:'  + message.body.longitude);
    bot.reply(message, 'Google Maps:'  + message.body.text);
});