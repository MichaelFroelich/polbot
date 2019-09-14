require('./constants.js');
const Discord = require('discord.js');
const Enmap = require('enmap');
const fs = require('fs');
const Log = require('./log.js');
const RoleParser = require('./roleparser.js');
const PolUser = require('./polusers.js');
const Game = require('./game.js');
const DeletedMessage = require('./deletedmessagelog.js');
const client = new Discord.Client();
client.commands = new Enmap();
const Active = new Map();
const WelcomeChannel = "welcome";
var Token;

try {
	Token = fs.readFileSync(TokenFile, 'utf8');
} catch (err) {
	console.log(err + " it's likely you need to add a file for your bot token.");
}

/*
	Bot Commander here
*/
fs.readdir("./commands/", (err, files) => {
	if (err) return console.error(err);
	files.forEach(file => {
		if (!file.endsWith(".js")) return;
		let props = require(`./commands/${file}`);
		let commandName = file.split(".")[0];
		console.log(`Attempting to load command ${commandName}`);
		client.commands.set(commandName, props);
	});
});

/*
	DiscordJs events
*/
client.on('ready', () => onStart());
client.on('error', (client, error) => Log.write(`An error event was sent by Discord.js: \n${JSON.stringify(error)}`));
client.on('guildCreate', (client, guild) =>Log.write(`Joined ${guild.name} (${guild.id}) added the bot. Owner: ${guild.owner.user.tag} (${guild.owner.user.id})`));
client.on('guildDelete', (client, guild) => Log.write(`Left ${guild.name} (${guild.id}) removed the bot.`));
client.on("guildMemberAdd", (member) => newMember(member));
client.on("message", (message) => newMessage(message));
client.on('messageDelete', (message) =>  DeletedMessage.deletedMessage(message));
client.on('messageUpdate', (oldmessage, newmessage) =>  DeletedMessage.modifiedMessage(oldmessage, newmessage));
/*
	Role Parsing here
*/
client.on('messageReactionAdd', (reaction, user) => {
	RoleParser.setRole(reaction, user); 
	Game.reacted(reaction, user);
});
client.on('messageReactionRemove', (reaction, user) => {
	RoleParser.removeRole(reaction, user);
	Game.unReacted(reaction, user);
});
client.on('messageReactionRemoveAll', (reaction) => RoleParser.removeRole(reaction, null));

forceEvents(client);

fs.watchFile(RolesFile, (curr, prev) => RoleParser.construct(client));

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
	RoleParser.construct(client);
	//Infinite loop, required for the file listener
	setInterval(() => {
		//sendHeartBeat(); //TODO:
		//RoleParser.loadRoles(); //make sure no roles have been missed
	}, 10000)
}

/**
 * This function is run after a "ready" signal from Discord
 */
function onStart() {
	client.user.setStatus('online');
}

/**
 * This function is run whenever there's a new member
 */
function newMember(member) {
	const channel = member.guild.channels.find('name', WelcomeChannel);
	//member.send(`Welcome to the server ${member} please read the rule channel and enjoy your journey to our server!`);

	let sicon = member.user.displayAvatarURL;
	let serverembed = new Discord.RichEmbed()
		.setColor("#ff0000")
		.setThumbnail(sicon)
		.addField("Welcome!", `Welcome ${member}! Please make sure to gaze upon the #policies-info channel, and verify yourself in the #verification channel.`);

	channel.send(serverembed);
	RoleParser.guildMemberAdd(member);
}

function newMessage(message) {
	if (message.author.bot || message.content.indexOf(CommandCharacter) !== 0) {
		return;
	}
	let ops = {
		active: Active
	}

	// Our standard argument/command name definition.
	const args = message.content.slice(CommandCharacter.length).trim().split(/ +/g);
	const command = args.shift().toLowerCase();

	// Grab the command data from the client.commands Enmap
	const cmd = client.commands.get(command);
	if (cmd) cmd.run(client, message, args, ops);
}

function forceEvents(client) {
	//Code snippet that forces events to be called
	client.on('raw', packet => {
		if (!['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE', 'MESSAGE_REACTION_REMOVE_ALL'].includes(packet.t)) return;
		const channel = client.channels.get(packet.d.channel_id);
		if (channel.messages.has(packet.d.message_id) || packet.t === 'MESSAGE_REACTION_REMOVE') return; //message already cached
		channel.fetchMessage(packet.d.message_id).then(message => {
			const emoji = packet.d.emoji.id ? `${packet.d.emoji.name}:${packet.d.emoji.id}` : packet.d.emoji.name;
			const reaction = message.reactions.get(emoji);
			if (reaction)
				reaction.users.set(packet.d.user_id, client.users.get(packet.d.user_id));
			if (packet.t === 'MESSAGE_REACTION_ADD') { //trigger the event
				client.emit('messageReactionAdd', reaction, client.users.get(packet.d.user_id));
			}
			if (packet.t === 'MESSAGE_REACTION_REMOVE' || packet.t === 'MESSAGE_REACTION_REMOVE_ALL') {
				client.emit('messageReactionRemove', reaction, client.users.get(packet.d.user_id));
			}
		});
	});
}