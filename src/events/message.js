/**
 * Handles messages, for bot commands and maybe for AI
 */

require('./../constants.js');
const active = new Map();
const talkedRecently = new Set();

module.exports = (client, message) => {
    let ops = {
      active: active
    }

    // Ignore all bots
    if (message.author.bot) return;
  
    // Ignore messages not starting with the prefix
    if (message.content.indexOf(CommandCharacter) !== 0) return;
  
    // Our standard argument/command name definition.
    const args = message.content.slice(CommandCharacter.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
  
    // Grab the command data from the client.commands Enmap
    const cmd = client.commands.get(command);
  
    // If that command doesn't exist, silently exit and do nothing
    if (!cmd) return;

    if (talkedRecently.has(message.author.id)) {
        message.channel.send("Hang on, I'm just a little slow. I'll get to you in a moment.");
    } else {

        // Run the command
        cmd.run(client, message, args, ops);

        // Adds the user to the set so that they can't talk for a minute
        talkedRecently.add(message.author.id);
        setTimeout(() => {
          // Removes the user from the set after a minute
          talkedRecently.delete(message.author.id);
        }, 1500);
    }
  
    
};