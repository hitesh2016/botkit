var CoreBot = require(__dirname + '/CoreBot.js');
var Slackbot = require(__dirname + '/SlackBot.js');
var Facebookbot = require(__dirname + '/Facebook.js');
var Gupshupbot = require(__dirname + '/Gupshup.js');

module.exports = {
    core: CoreBot,
    slackbot: Slackbot,
    facebookbot: Facebookbot,
	gupshupbot: Gupshupbot,
};
