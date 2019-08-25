const ms = require("ms");
const Util = require('../util.js');
const MutedRole = "Muted";

exports.run = async (bot, message, args) => {

  //!tempmute @user 1s/m/h/d
  var tomute = null;
  try {
    tomute = message.mentions.members.first() || Util.getMember(message.guild, args[0]);
  } catch (error) {
    return message.channel.send(error);
  }
  if (!tomute) return message.reply("Couldn't find user.");
  if (tomute.hasPermission("MANAGE_MESSAGES")) return message.reply("Can't mute them!");
  let muterole = message.guild.roles.find("name", MutedRole);
  //start of create role
  if (!muterole) {
    try {
      message.channel.send("No muted channel found, please contact the developer");
    } catch (e) {
      console.log(e.stack);
    }
  }
  //end of create role
  let mutetime = parseInt(args[1]);
  var plural = "";
  if(mutetime > 1) {
    plural = "s";
  }

  if (!mutetime) return message.reply("You didn't specify a time!");
  var currentRoles = tomute.roles;
  await (tomute.setRoles([muterole]));
  message.reply(`<@${tomute.id}> has been muted for ${mutetime} minute${plural}`);

  setTimeout(function () {
    tomute.setRoles(currentRoles);
    message.channel.send(`<@${tomute.id}> has been unmuted!`);
  }, mutetime * 1000 * 60);

}