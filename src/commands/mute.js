const Util = require('../util.js');
const Users = require('../polusers.js');
const MutedRole = "Muted";

exports.run = async (bot, message, args) => {
  var member = null;
  var muterole = null
  try {
    member = Util.validate(message, "MANAGE_MESSAGES");
    muterole = message.guild.roles.find("name", MutedRole);
  } catch (error) {
    return message.channel.send(error);
  }
  //end of create role
  let mutetime = parseInt(args[1]);
  var plural = "";
  if (mutetime > 1) {
    plural = "s";
  }

  if (!mutetime) return message.reply("You didn't specify a time!");
  await (member.setRoles([muterole]));
  message.reply(`<@${member.id}> has been muted for ${mutetime} minute${plural}`);

  setTimeout(function () {
    currentRoles = await Users.read(member.id).roles;
    member.setRoles(currentRoles);
    message.channel.send(`<@${member.id}> has been unmuted!`);
  }, mutetime * 1000 * 60);
}