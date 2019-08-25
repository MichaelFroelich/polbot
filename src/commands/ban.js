const Util = require('../util.js');

exports.run = (client, message, args) => {
    var member = null;
    try {
        member = message.mentions.members.first() || Util.getMember(message.guild, args[0]);
    } catch(error) {
        return message.channel.send(error);
    }
    if(!message.member.hasPermission("BAN_MEMBERS")){
        message.channel.send("You don't have the permissions to use this command!");
    }

    else{
        if(!member)
            return message.channel.send("Please mention a valid member of this server");
        if(!member.bannable) 
            return message.channel.send("I cannot ban this user! Do they have a higher role? Do I have ban permissions?");

        let reason = args.slice(1).join(' ');
        if(!reason) reason = "No reason provided";

        member.ban(reason)
            .catch(error => message.channel.send(`Sorry ${message.author} I couldn't ban the user`));
        message.channel.send(`${member.user.tag} has been banned by ${message.author.tag} because: ${reason}`);
    }
}