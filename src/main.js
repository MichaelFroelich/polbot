/**
 * 
 * 
 * 
 */
require('./constants.js');
const Discord = require('discord.js');
const Enmap = require('enmap');
const fs = require('fs');
const Log = require('./log.js');
const RoleParser = require('./roleparser.js');
const client = new Discord.Client();
var Token;

try {
	Token = fs.readFileSync(TokenFile, 'utf8');
} catch (err) {
	console.log(err + " it's likely you need to add a file for your bot token.");
}


client.on('ready', () => onStart());
/*
	Bot Commander here
*/
fs.readdir("./events/", (err, files) => {
    if (err) return console.error(err);
    files.forEach(file => {
      const event = require(`./events/${file}`);
      let eventName = file.split(".")[0];
      client.on(eventName, event.bind(null, client));
    });
});

client.commands = new Enmap();

//Todo: find a safer way to include these files
fs.readdir("./admin/", (err, files) => {
	if (err) return console.error(err);
	files.forEach(file => {
		if (!file.endsWith(".js")) return;
		let props = require(`./admin/${file}`);
		let commandName = file.split(".")[0];
		console.log(`Attempting to load command ${commandName}`);
		client.commands.set(commandName, props);
	});
});

fs.readdir("./info/", (err, files) => {
	if (err) return console.error(err);
	files.forEach(file => {
		if (!file.endsWith(".js")) return;
		let props = require(`./info/${file}`);
		let commandName = file.split(".")[0];
		console.log(`Attempting to load command ${commandName}`);
		client.commands.set(commandName, props);
	});
});

/*
	Role Parsing here
*/
client.on('messageReactionAdd', (reaction, user) => RoleParser.setRole(reaction, user));
client.on('messageReactionRemove', (reaction, user) => RoleParser.removeRole(reaction, user));
client.on("guildMemberAdd", (member) => RoleParser.guildMemberAdd(member));

fs.watchFile(RolesFile, (curr, prev) => RoleParser.loadRoles(client));

client.login(Token).then(value => onLogin(value), reason => {
	Log.write('failed to login because\t' + reason.message);
	process.exit(); //Exit the script
});

/**
 * This function is run after the login function returns successfuly
 */
function onLogin(value) {
	fs.writeFile(PidFile, process.pid, function (err) {
		if (err)
			return console.log(err);
	});
	Log.write('Started successfuly');
	RoleParser.loadRoles(client);
	//Infinite loop, required for the file listener
	setInterval(() => {
		//sendHeartBeat(); //TODO:
		RoleParser.refreshRoles(); //make sure no roles have been missed
		Log.write("ping");
	}, 10000)
}

/**
 * This function is run after a "ready" signal from Discord
 */
function onStart() {
	client.user.setStatus('online');
}