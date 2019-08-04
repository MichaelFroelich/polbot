const ROLES_FILES = "./roles.json";
const COMMAND_CHARACTER = "!";

/**
 * 
 * 
 * 
 */

const Discord = require('discord.js');
const fs = require('fs');
const RoleParser = require('./roleparser.js');
const Command = require('./command.js');

const client = new Discord.Client();

RoleParser.setRoles();
fs.watchFile(ROLES_FILES, (curr, prev) => RoleParser.setRoles());

client.on('message', message => {
	if(message.content.startsWith(COMMAND_CHARACTER)) {
		Command.command(message);
	}
});
client.on('messageReactionAdd', (reaction, user) => RoleParser.setRole(reaction, user));
client.on('messageReactionRemove', (reaction, user) => RoleParser.removeRole(reaction, user));
client.login('your-token-goes-here'); //Finally, login