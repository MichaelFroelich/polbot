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
  //end of create role
  let mutetime = parseInt(args[1]);

  if (!mutetime) return message.reply("You didn't specify a time!");
  this.mute(member, mutetime, message);
}

exports.mute = async (member, mutetime, message) => {
  await (member.setRoles([muterole]));
  var plural = "";
  if (mutetime > 1) {
    plural = "s";
  }
  message.reply(`<@${member.id}> has been muted for ${mutetime} minute${plural}`);

  setTimeout(async function () {
    currentRoles = await Users.read(member.id).roles;
    member.setRoles(currentRoles);
    message.channel.send(`<@${member.id}> has been unmuted!`);
  }, mutetime * 1000 * 60);
}