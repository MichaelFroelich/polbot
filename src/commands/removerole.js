const Util = require('../util.js');
const Users = require('../polusers.js');

exports.run = async (client, message, args) => {
    var member = null;
    try {
        member = Util.validate(message, args, "MANAGE_ROLES_OR_PERMISSIONS", true);
    } catch (error) {
        return message.channel.send(error);
    }

    let role = args.slice(1).join(' ');
    if (!role)
        return message.channel.send("Specify a role!");

    let gRole = message.guild.roles.find('name', role);
    if (!gRole)
        return message.channel.send("Couldn't find that role.");

    if (!member.roles.has(gRole.id))
        return message.reply("They don't have that role.");

    else {
        await member.removeRole(gRole.id).catch(console.error);
        Users.create(member);
        try {
            member.send(`Sorry,you lost the ${gRole.name} role`);
            message.channel.send(`The user ${member} has lost the ${gRole.name} role`);
        }
        catch (e) {
            console.log(e.stack);
            message.channel.send(`RIP to <@${member.id}>, We removed ${gRole.name} from them.`)
        }
    }
}