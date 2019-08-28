const Util = require('../util.js');
const Users = require('../polusers.js');

exports.run = (client, message, args) => {
    var member = null;
    try {
        member = Util.validate(message, "BAN_MEMBERS");
    } catch (error) {
        return message.channel.send(error);
    }

    let reason = args.slice(1).join(' ');
    if (!reason) reason = "No reason provided";

    member.ban(reason)
        .catch(error => message.channel.send(`Sorry ${message.author} I couldn't ban the user`));
    message.channel.send(`${member.user.tag} has been banned by ${message.author.tag} because: ${reason}`);
}