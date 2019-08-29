const Util = require('../util.js');
const Users = require('../polusers.js');

exports.run = async (client, message, args) => {
    var member = null;
    try {
        member = Util.validate(message, args, "KICK_MEMBERS");
    } catch (error) {
        return message.channel.send(error);
    }
    // slice(1) removes the first part, which here should be the user mention or ID
    // join(' ') takes all the various parts to make it a single string.
    let reason = args.slice(1).join(' ');
    if (!reason)
        reason = "No reason provided";
    this.kick(member, reason, message);
}

exports.kick = async (member, reason, message) => {
    await member.kick(reason)
        .catch(error => message.channel.send(`Sorry, I couldn't kick because of : ${error}`));

    message.channel.send(`${member.user.tag} has been kicked because: ${reason}`);
}