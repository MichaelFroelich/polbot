const Util = require('../util.js');
const Users = require('../polusers.js');

exports.run = async (client, message, args) => {
    if (!message.member.hasPermission("BAN_MEMBERS")) {
        message.channel.send("You don't have the permissions to use this command!");
    }

    let reason = args.slice(1).join(' ');
    if (!reason) reason = "No reason provided";

    member.unban(args[0], reason)
        .catch(error => message.channel.send(`Sorry ${message.author} I couldn't unban the user because ${error}`));
    message.channel.send(`${member.user.tag} has been banned by ${message.author.tag} because: ${reason}`);
}