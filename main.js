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
const Token = fs.readFileSync(TokenFile, 'utf8');

const client = new Discord.Client();

client.on('ready', () => {
	client.user.setStatus('online');
});

client.on('message', message => {
	if (message.content.startsWith(CommandCharacter)) {
		Command.command(message);
	}
});
client.on('messageReactionAdd', (reaction, user) => RoleParser.setRole(reaction, user));
client.on('messageReactionRemove', (reaction, user) => RoleParser.removeRole(reaction, user));

fs.watchFile(RolesFile, (curr, prev) => RoleParser.loadRoles(client));

client.login(Token).then(value => {
	Log.write('started successfuly');
	RoleParser.loadRoles(client);
	//Infinite loop, required for the file listener
	setInterval(() => {
	}, 1000)
}, reason => {
	Log.write('failed to login because\t' + reason.message);
	process.exit(); //Exit the script
});


