const Util = require('../util.js');
const Users = require('../polusers.js');
const MutedRole = "Muted";

exports.run = async (bot, message, args) => {
  var member = null;
  try {
    member = Util.validate(message, args, "MANAGE_MESSAGES");
  } catch (error) {
    return message.channel.send(error);
  }
  currentRoles = await Users.read(member.id).roles;
  member.setRoles(currentRoles);
  message.channel.send(`<@${member.id}> has been unmuted!`);
}