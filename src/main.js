/**
 * 
 * 
 * 
 */
require('./constants.js');
const Discord = require('discord.js');
const Log = require('./log.js');
const fs = require('fs');
const RoleParser = require('./roleparser.js');
const Command = require('./command.js');
const client = new Discord.Client();
var Token;
try { 
	Token = fs.readFileSync(TokenFile, 'utf8');
} catch(err) {
	console.log(err + " it's likely you need to add a file for your bot token.");
}

client.on('ready', () => onStart());
client.on('message', message => Command.command(client, message));
client.on('messageReactionAdd', (reaction, user) => RoleParser.setRole(reaction, user));
client.on('messageReactionRemove', (reaction, user) => RoleParser.removeRole(reaction, user));

fs.watchFile(RolesFile, (curr, prev) => RoleParser.loadRoles(client));

client.login(Token).then(value => onLogin(value), reason => {
	Log.write('failed to login because\t' + reason.message);
	process.exit(); //Exit the script
});

/**
 * This function is run after the login function returns successfuly
 */
function onLogin(value){
	fs.writeFile(PidFile, process.pid, function (err) {
		if (err)
			return console.log(err);
	});
	Log.write('Started successfuly');
	RoleParser.loadRoles(client);
	//Infinite loop, required for the file listener
	setInterval(() => {
	}, 1000)
}

/**
 * This function is run after a "ready" signal from Discord
 */
function onStart(){
	client.user.setStatus('online');
}