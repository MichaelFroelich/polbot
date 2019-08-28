const Util = require('../util.js');
const Users = require('../polusers.js');
const Mute = require('./mute.js');
const Kick = require('./kick.js');
const Ban = require('./ban.js');

exports.run = async (client, message, args) => {
    var member = null;
    try {
        member = Util.validate(message, args, "MANAGE_MESSAGES");
    } catch (error) {
        return message.channel.send(error);
    }
    try {
        user = await Users.read(member.id);
        user.status -= 1;
        Users.create(member.id, user);
    } catch {
        return message.channel.send("Unwarning failed, please try again");
    }
    member.send(`You have been unwarned, you have an extra chance to prove yourself.`);
    return message.channel.send("User unwarned");
}