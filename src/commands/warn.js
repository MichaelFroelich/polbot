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

    // slice(1) removes the first part, which here should be the user mention or ID
    // join(' ') takes all the various parts to make it a single string.
    let reason = args.slice(1).join(' ');
    if (!reason)
        reason = "your transgressions.";

    member.send(`You have been warned for ${reason}.`);
    user = await Users.read(member.id);
    user.status += 1;
    switch (user.status) {
        case 1:
        case 2:
        case 3:
            Users.create(member.id, user);
            break;
        case 4:
            Users.create(member.id, user);
            Mute.mute(member, 10080); //one week
            break;
        case 5:
            Kick.kick(member, reason);
            break;
        case 6:
            Ban.ban(member, reason);
            break;
        default:
            break;
    }
}