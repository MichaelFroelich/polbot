const Util = require('../util.js');
const Users = require('../polusers.js');
const MutedRole = "Muted";
var muterole = null;

exports.run = async (bot, message, args) => {
  var member = null;
  try {
    member = Util.validate(message, args, "MANAGE_MESSAGES");
    if(muterole === null)
      muterole = message.guild.roles.find("name", MutedRole);
  } catch (error) {
    return message.channel.send(error);
  }
  currentMember = await Users.read(member.id);
  currentRoles = currentMember.roles.filter(function(value, index, arr){
    return value !== muterole.id;
  });

  member.setRoles(currentRoles);
  message.channel.send(`<@${member.id}> has been unmuted`);
}