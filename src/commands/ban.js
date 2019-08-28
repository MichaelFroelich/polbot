const Util = require('../util.js');
const Users = require('../polusers.js');

exports.run = async (client, message, args) => {
    var member = null;
    try {
        member = Util.validate(message, args, "BAN_MEMBERS");
    } catch (error) {
        return message.channel.send(error);
    }

    let reason = args.slice(1).join(' ');
    if (!reason) reason = "No reason provided";

    this.ban(member, reason);
}

exports.ban = async(member, reason) => {
    member.ban(reason)
        .catch(error => message.channel.send(`Sorry, I couldn't ban the user`));
    message.channel.send(`${member.user.tag} has been banned because: ${reason}`);
}